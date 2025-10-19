import { EventSourcePolyfill } from 'event-source-polyfill'
import { apiClient } from './index.js'
import { useUserStore } from '@/stores/userStore.js'

/* ============================================================================
   Constants
============================================================================ */

/**
 * SSE 이벤트 이름
 * @constant {string}
 */
const SSE_EVENT_NAME = 'fantry-sse'

/**
 * 구독 액션 타입
 * @enum {string}
 */
const ActionType = Object.freeze({
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
})

/**
 * 알림 메시지 타입
 * @enum {string}
 */
export const MessageType = Object.freeze({
  BID_UPDATE: 'bid_update',
  BID_SUCCESSFUL: 'bid_successful',
  AUCTION_END: 'auction_end',
  AUCTION_START: 'auction_start',
  CONNECTION_STATUS: 'connection_status',
})

/* ============================================================================
   State
============================================================================ */

/**
 * SSE 연결 상태 관리
 * @type {Object}
 */
const state = {
  userId: null,
  eventSource: null, // EventSource 인스턴스
  connectionId: null, // ✅ Backend에서 받은 Connection ID
  subscriptions: new Set(), // ✅ 서버 구독 목록의 로컬 캐시
  isIntentionalClose: false, // 의도적 종료 여부
}

/* ============================================================================
   Callbacks & Listeners
============================================================================ */

/**
 * SSE 콜백 함수들
 * @type {Object}
 */
const sseCallbacks = {
  onOpen: () => {},
  onRegistration: () => {},
  onMessage: (_) => {},
  onError: (_) => {},
  onReconnecting: () => {},
  onClose: () => {},
}

/**
 * SSE 이벤트 리스너들
 * @type {Object}
 */
const sseListeners = {
  onOpen: (event) => {
    console.log('[SSE:onOpen] 🟢 SSE 연결 열림', {
      timestamp: new Date().toISOString(),
      readyState: event.target?.readyState,
      url: event.target?.url,
    })
    if (typeof sseCallbacks.onOpen === 'function') {
      sseCallbacks.onOpen()
    }
  },
  onMessage: (event) => {
    console.log('[SSE:onMessage] 📨 원본 이벤트 수신', {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      rawData: event.data,
    })

    let messageData
    try {
      messageData = JSON.parse(event.data)
      console.log('[SSE:onMessage] ✅ 메시지 파싱 성공', {
        type: messageData.type,
        connectionId: messageData.connectionId,
        auctionId: messageData.auctionId,
        message: messageData.message,
        fullData: messageData,
      })
    } catch (parseError) {
      console.error('[SSE:onMessage] ❌ 메시지 파싱 실패', {
        error: parseError.message,
        rawData: event.data,
      })
      return
    }

    if (messageData.type === 'connection_status' && messageData.connectionId) {
      console.log('[SSE:onMessage] 🔗 Connection ID 할당 받음', {
        connectionId: messageData.connectionId,
        previousConnectionId: state.connectionId,
        timestamp: new Date().toISOString(),
      })
      state.connectionId = messageData.connectionId

      console.log('[SSE:onMessage] 📞 onRegistration 콜백 호출 시작')
      sseCallbacks.onRegistration()
      console.log('[SSE:onMessage] ✅ onRegistration 콜백 완료')
    } else {
      console.log('[SSE:onMessage] 📬 일반 메시지 수신', {
        type: messageData.type,
        hasConnectionId: !!messageData.connectionId,
      })
    }

    if (typeof sseCallbacks.onMessage === 'function') {
      console.log('[SSE:onMessage] 📞 onMessage 콜백으로 전달', {
        dataLength: event.data?.length,
      })
      sseCallbacks.onMessage(event.data)
    }
  },
  onDenied: async (event) => {
    try {
      // 재발급 API 호출
      const serverPath = import.meta.env.VITE_API_SERVER_URL
      const currentToken = localStorage.getItem('accessToken')
      const res = await axios.post(serverPath + '/api/reissue', null, {
        withCredentials: true,
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined,
      })
      const newAccessToken = res.headers.accesstoken || res.data

      // 로컬 스토리지에 새로운 토큰 저장 + 큐 처리
      localStorage.setItem('accessToken', newAccessToken)
    } catch (error) {
      try {
        localStorage.removeItem('accessToken')
      } catch (e) {
        console.warn('Logout failed inside interceptor', e)
      }
    }
  },
  onError: (event) => {
    console.error('[SSE:onError] ❌ SSE 에러 발생', {
      timestamp: new Date().toISOString(),
      status: event.status,
      readyState: event.readyState,
      readyStateText:
        event.readyState === EventSourcePolyfill.CONNECTING
          ? 'CONNECTING'
          : event.readyState === EventSourcePolyfill.OPEN
            ? 'OPEN'
            : event.readyState === EventSourcePolyfill.CLOSED
              ? 'CLOSED'
              : 'UNKNOWN',
      isIntentionalClose: state.isIntentionalClose,
      currentConnectionId: state.connectionId,
      activeSubscriptions: Array.from(state.subscriptions),
      eventType: event.type,
    })

    const isClosed = event.readyState === EventSourcePolyfill.CLOSED
    const isConnecting = event.readyState === EventSourcePolyfill.CONNECTING

    if (isClosed && !state.isIntentionalClose) {
      console.warn('[SSE:onError] 🔴 예기치 않은 연결 종료', {
        willAutoReconnect: true,
        subscriptionsToRestore: state.subscriptions.size,
      })

      if (typeof sseCallbacks.onError === 'function') {
        console.log('[SSE:onError] 📞 onError 콜백 호출')
        sseCallbacks.onError(event)
      }

      console.log('[SSE:onError] ⏳ EventSourcePolyfill 자동 재연결 대기 중...')
    } else if (isClosed) {
      console.log('[SSE:onError] 🟡 의도적 연결 종료', {
        reason: 'intentional close',
      })
    } else if (isConnecting) {
      console.log('[SSE:onError] 🔄 재연결 시도 중...', {
        attempt: 'auto reconnect in progress',
      })

      if (typeof sseCallbacks.onReconnecting === 'function') {
        console.log('[SSE:onError] 📞 onReconnecting 콜백 호출')
        sseCallbacks.onReconnecting(event)
      }
    }
  },
}

/* ============================================================================
   Internal Functions
============================================================================ */

/**
 * 콜백 함수들을 설정합니다.
 * @param {Object} callbacks - 콜백 객체
 */
const setCallbacks = (callbacks = {}) => {
  sseCallbacks.onOpen = callbacks.onOpen || (() => {})
  sseCallbacks.onRegistration = callbacks.onRegistration || (() => {})
  sseCallbacks.onMessage = callbacks.onMessage || (() => {})
  sseCallbacks.onError = callbacks.onError || (() => {})
  sseCallbacks.onReconnecting = callbacks.onReconnecting || (() => {})
  sseCallbacks.onClose = callbacks.onClose || (() => {})
}

/**
 * 이벤트 리스너를 제거합니다.
 */
const removeListeners = () => {
  if (!state.eventSource) {
    return
  }
  state.eventSource.removeEventListener('open', sseListeners.onOpen)
  state.eventSource.removeEventListener(SSE_EVENT_NAME, sseListeners.onMessage)
  state.eventSource.removeEventListener('error', sseListeners.onError)
  state.eventSource.removeEventListener('auth-error', sseListeners.onDenied)
}

/**
 * SSE 연결을 종료합니다.
 */
const closeConnection = () => {
  state.isIntentionalClose = true

  if (state.eventSource instanceof EventSourcePolyfill) {
    state.eventSource.close()
    removeListeners()
    state.eventSource = null
  }

  // Connection ID 및 상태 초기화
  state.connectionId = null
  state.subscriptions.clear()
}

/* ============================================================================
   Exported Functions
============================================================================ */

/**
 * SSE 이벤트 리스너를 등록합니다.
 * @param {Object} callbacks - 콜백 객체
 */
const addEventListeners = (callbacks) => {
  if (!state.eventSource) {
    return
  }
  removeListeners()
  setCallbacks(callbacks)
  state.eventSource.addEventListener('open', sseListeners.onOpen)
  state.eventSource.addEventListener(SSE_EVENT_NAME, sseListeners.onMessage)
  state.eventSource.addEventListener('error', sseListeners.onError)
  state.eventSource.addEventListener('auth-error', sseListeners.onDenied)
}

/**
 * SSE 연결을 시작합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} callbacks - 이벤트 콜백 객체
 * @param {Function} callbacks.onOpen - 연결 성공 시 콜백
 * @param {Function} callbacks.onRegistration - Connection ID 할당 완료 시 콜백 (구독 시작 타이밍)
 * @param {Function} callbacks.onMessage - 메시지 수신 시 콜백
 * @param {Function} callbacks.onError - 에러 발생 시 콜백
 * @param {Function} callbacks.onReconnecting - 재연결 시도 시 콜백
 * @param {Function} callbacks.onClose - 연결 종료 시 콜백
 */
export const connectSse = (userId, callbacks = {}) => {
  console.log('[SSE:connectSse] 🚀 SSE 연결 요청', {
    timestamp: new Date().toISOString(),
    userId,
    currentState: {
      hasEventSource: !!state.eventSource,
      readyState: state.eventSource?.readyState,
      connectionId: state.connectionId,
      subscriptions: Array.from(state.subscriptions),
    },
  })

  if (state.eventSource && state.eventSource.readyState === EventSourcePolyfill.OPEN) {
    console.warn('[SSE:connectSse] ⚠️ 이미 연결되어 있음 - 연결 시도 취소', {
      existingConnectionId: state.connectionId,
    })
    return
  }

  const baseURL = import.meta.env.VITE_API_SERVER_URL || ''
  const token = localStorage.getItem('accessToken')

  console.log('[SSE:connectSse] 🔧 연결 설정', {
    baseURL,
    endpoint: `${baseURL}/api/notification/${userId}`,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 10)}...` : null,
    heartbeatTimeout: 2100000,
  })

  state.userId = userId
  state.isIntentionalClose = false
  state.eventSource = new EventSourcePolyfill(`${baseURL}/api/notification/sse/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    heartbeatTimeout: 2100000, // 35분
    withCredentials: true,
  })

  console.log('[SSE:connectSse] 📡 EventSource 생성 완료', {
    readyState: state.eventSource.readyState,
    url: state.eventSource.url,
  })

  addEventListeners(callbacks)
  console.log('[SSE:connectSse] ✅ 이벤트 리스너 등록 완료')
}

/**
 * SSE 연결을 종료합니다.
 */
export const disconnectSse = async () => {
  try {
    if (isConnected() && state.userId !== null) {
      await apiClient.delete(`/notification/${state.userId}`)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[SSE] 연결 종료 중 오류:', error)
    }
  } finally {
    state.userId = null
    closeConnection()
  }
}

/**
 * 경매 알림을 구독합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} auctionId - 경매 ID
 * @returns {Promise<Object>} 구독 결과
 */
export const subscribe = async (userId, auctionId) => {
  console.log('[SSE:subscribe] 📝 구독 요청 시작', {
    timestamp: new Date().toISOString(),
    userId,
    auctionId,
    currentConnectionId: state.connectionId,
    existingSubscriptions: Array.from(state.subscriptions),
  })

  // ✅ Connection ID 확인
  if (!state.connectionId) {
    console.error('[SSE:subscribe] ❌ Connection ID 없음 - 구독 불가', {
      userId,
      auctionId,
      suggestion: 'onRegistration 콜백 이후 구독 필요',
    })
    throw new Error('SSE 연결이 아직 완료되지 않았습니다. onRegistration 콜백에서 구독하세요.')
  }

  try {
    console.log('[SSE:subscribe] 🔄 manageSubscription 호출', {
      userId,
      auctionId,
      action: ActionType.SUBSCRIBE,
      connectionId: state.connectionId,
    })

    const response = await manageSubscription(userId, auctionId, ActionType.SUBSCRIBE)

    state.subscriptions.add(auctionId)

    console.log('[SSE:subscribe] ✅ 구독 성공', {
      auctionId,
      totalSubscriptions: state.subscriptions.size,
      allSubscriptions: Array.from(state.subscriptions),
      response: response?.data,
    })

    return response
  } catch (error) {
    console.error('[SSE:subscribe] ❌ 구독 실패', {
      auctionId,
      userId,
      error: error.message,
      errorDetails: error.response?.data,
      status: error.response?.status,
    })
    state.subscriptions.delete(auctionId)
    throw error
  }
}

/**
 * 경매 알림 구독을 취소합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} auctionId - 경매 ID
 * @returns {Promise<Object>} 구독 해제 결과
 */
export const unsubscribe = async (userId, auctionId) => {
  try {
    const response = await manageSubscription(userId, auctionId, ActionType.UNSUBSCRIBE)

    // ✅ 구독 해제 시 추적에서 제거
    state.subscriptions.delete(auctionId)

    if (import.meta.env.DEV) {
      console.log('[SSE] 구독 해제:', auctionId, '남은 구독:', state.subscriptions.size)
    }

    return response
  } catch (error) {
    console.error('[SSE] 구독 해제 실패:', auctionId, error)
    throw error
  }
}

const manageSubscription = async (userId, auctionId, action) => {
  if (!Object.values(ActionType).includes(action)) {
    throw new Error(`유효하지 않은 액션입니다: ${action}`)
  }

  // ✅ Connection ID 확인
  if (!state.connectionId) {
    console.warn('[SSE] Connection ID 없이 구독 시도')
  }

  try {
    return await apiClient.post(
      '/notification/subscriptions',
      {
        username: userId,
        auctionId: auctionId,
        action: action,
      },
      {
        headers: {
          ...(state.connectionId && { 'X-Connection-Id': state.connectionId }),
        },
      },
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[SSE] 구독 관리 실패:', error)
    }
    throw error
  }
}

/**
 * SSE 연결 상태를 확인합니다.
 * @returns {boolean} 연결 여부
 */
export const isConnected = () => {
  return (
    state.eventSource instanceof EventSourcePolyfill &&
    state.eventSource.readyState === EventSourcePolyfill.OPEN
  )
}

/**
 * 브라우저 알림을 표시합니다.
 * @param {string} title - 알림 제목
 * @param {Object} options - 알림 옵션
 * @param {string} options.body - 알림 본문
 * @param {Object} options.data - 추가 데이터
 * @param {Array} options.actions - 액션 버튼들
 */
export const showNotification = (title, options = {}) => {
  console.log('[SSE:showNotification] 🔔 알림 표시 요청', {
    timestamp: new Date().toISOString(),
    title,
    body: options.body,
    data: options.data,
    actions: options.actions,
    permission: Notification.permission,
    isSecureContext: window.isSecureContext,
    hasServiceWorker: 'serviceWorker' in navigator,
  })

  if (Notification.permission !== 'granted') {
    console.warn('[SSE:showNotification] ⚠️ 알림 권한 없음', {
      permission: Notification.permission,
      suggestion: 'requestNotificationPermission() 호출 필요',
    })
    return
  }

  if (window.isSecureContext && 'serviceWorker' in navigator) {
    console.log('[SSE:showNotification] 🔧 Service Worker 알림 시도')

    navigator.serviceWorker.ready
      .then((registration) => {
        console.log('[SSE:showNotification] ✅ Service Worker 준비 완료', {
          scope: registration.scope,
          active: !!registration.active,
        })
        return registration.showNotification(title, options)
      })
      .then(() => {
        console.log('[SSE:showNotification] ✅ Service Worker 알림 표시 성공')
      })
      .catch((error) => {
        console.error('[SSE:showNotification] ❌ Service Worker 알림 실패', {
          error: error.message,
          stack: error.stack,
        })
        console.log('[SSE:showNotification] 🔄 기본 알림으로 폴백')
        showBasicNotification(title, options)
      })
  } else {
    console.log('[SSE:showNotification] ℹ️ Service Worker 미지원 - 기본 알림 사용', {
      isSecureContext: window.isSecureContext,
      hasServiceWorker: 'serviceWorker' in navigator,
    })
    showBasicNotification(title, options)
  }
}

/**
 * 기본 브라우저 알림을 표시합니다. (Service Worker 없이)
 * @param {string} title - 알림 제목
 * @param {Object} options - 알림 옵션
 */
const showBasicNotification = (title, options) => {
  try {
    new Notification(title, {
      body: options.body,
      icon: options.icon,
      badge: options.badge,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[알림] 기본 알림 표시 실패:', error)
    }
  }
}

/**
 * 사용자의 입찰 경매 목록을 조회합니다.
 * @param {number} memberId - 회원 ID
 * @returns {Promise<Array>} 경매 ID 배열
 */
export const getAuctionsByUser = async (memberId) => {
  try {
    const response = await apiClient.get(`/auctions/member/${memberId}/bids`)
    return response.data.message ? [] : response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[SSE] 입찰 경매 목록 조회 실패:', error)
    }
    return []
  }
}
