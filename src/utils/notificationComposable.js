import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  connectSse,
  disconnectSse,
  getAuctionsByUser,
  isConnected,
  MessageType,
  showNotification,
  subscribe,
} from '@/api/notification.js'
import { requestNotificationPermission } from '@/utils/permission.js'
import Toast from '@/components/common/atoms/Toast.vue'

/**
 * 알림 시스템을 관리하는 Vue Composable
 * SSE 연결, 메시지 처리, Service Worker 등록 등을 담당합니다.
 *
 * @param {Object} userStore - Pinia 사용자 스토어
 * @returns {Object} 알림 시스템 관련 함수들
 */
export function useNotification(userStore, useNotificationStore) {
  const router = useRouter()
  const toast = useToast()

  /**
   * 경매 상세 페이지로 이동합니다.
   * @param {string} auctionId - 경매 ID
   */
  const navigateToAuction = (auctionId) => {
    if (auctionId) {
      router.push(`/product/${auctionId}`)
    }
  }

  /**
   * 메시지 타입에 따라 토스트를 표시합니다.
   * @param {string} type - 메시지 타입
   * @param {string} message - 메시지 내용
   * @param {string} auctionId - 경매 ID
   */
  const showToast = (type, message, auctionId) => {
    console.log('[Toast] showToast 호출:', { type, message, auctionId })

    const toastConfig = {
      component: Toast,
      props: {
        title: '알림',
        message,
        onClick: () => navigateToAuction(auctionId),
      },
    }

    try {
      switch (type) {
        case MessageType.AUCTION_END:
          console.log('[Toast] info 표시')
          toast.info(toastConfig)
          break
        case MessageType.BID_SUCCESSFUL:
          console.log('[Toast] success 표시')
          toast.success(toastConfig)
          break
        case MessageType.BID_UPDATE:
          console.log('[Toast] warning 표시')
          toast.warning(toastConfig)
          break
        default:
          console.log('[알림] 처리되지 않은 메시지 타입:', type, message)
      }
    } catch (error) {
      console.error('[Toast] 표시 실패:', error)
    }
  }

  /**
   * SSE 메시지를 처리합니다.
   * 페이지가 활성화되어 있으면 토스트로, 백그라운드면 브라우저 알림으로 표시합니다.
   * @param {Object} messageJson - 파싱된 메시지 객체
   */
  const handleMessage = (messageJson) => {
    console.log('[Composable:handleMessage] 📬 메시지 처리 시작', {
      timestamp: new Date().toISOString(),
      messageType: messageJson.type,
      auctionId: messageJson.auctionId,
      message: messageJson.message,
      fullMessage: messageJson,
      pageState: {
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
      },
    })

    // 연결 상태 메시지는 무시
    if (messageJson.type === MessageType.CONNECTION_STATUS) {
      console.log('[Composable:handleMessage] ℹ️ CONNECTION_STATUS 메시지 - 처리 스킵')
      return
    }

    const isPageVisible = document.visibilityState === 'visible' || document.hasFocus()

    if (isPageVisible) {
      console.log('[Composable:handleMessage] 👁️ 페이지 활성 상태 - 토스트 표시', {
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
      })
      // 페이지가 활성화되어 있으면 토스트 표시
      showToast(messageJson.type, messageJson.message, messageJson.auctionId)
    } else {
      console.log('[Composable:handleMessage] 🌙 백그라운드 상태 - 브라우저 알림 + 토스트', {
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
      })

      const notificationData = {
        body: messageJson.message,
        data: {
          url: `/product/${messageJson.auctionId}`,
        },
        actions: [
          {
            action: 'view-auction',
            title: '경매 확인',
          },
        ],
      }

      console.log('[Composable:handleMessage] 🔔 브라우저 알림 표시 호출', notificationData)

      // 백그라운드면 브라우저 알림 표시
      showNotification('Fantry 알림', notificationData)

      console.log('[Composable:handleMessage] 🍞 토스트도 함께 표시')
      showToast(messageJson.type, messageJson.message, messageJson.auctionId)
    }
  }

  /**
   * SSE 연결을 초기화합니다.
   */
  const initNotification = () => {
    console.log('[Composable:initNotification] 🚀 알림 초기화 호출', {
      timestamp: new Date().toISOString(),
      hasUser: !!userStore.currentUser,
      userId: userStore.currentUser?.id,
      memberId: userStore.currentUser?.memberId,
      isAlreadyConnected: isConnected(),
    })

    if (userStore.currentUser && !isConnected()) {
      console.log('[Composable:initNotification] ✅ 연결 조건 충족 - SSE 연결 시작')

      connectSse(userStore.currentUser.id, {
        onOpen: () => {
          console.log('[Composable:onOpen] 🟢 SSE 연결 성공', {
            timestamp: new Date().toISOString(),
            userId: userStore.currentUser?.id,
          })
        },
        onRegistration: async () => {
          console.log('[Composable:onRegistration] 🔗 Connection ID 할당 완료 - 구독 준비됨', {
            timestamp: new Date().toISOString(),
            memberId: userStore.currentUser?.memberId,
          })

          // 사용자의 입찰 경매 목록 조회 및 구독
          if (userStore.currentUser?.memberId) {
            console.log('[Composable:onRegistration] 🔍 입찰 경매 목록 조회 시작', {
              memberId: userStore.currentUser.memberId,
            })

            try {
              const auctions = await getAuctionsByUser(userStore.currentUser.memberId)
              useNotificationStore.auctions = auctions

              console.log('[Composable:onRegistration] ✅ 경매 목록 조회 완료', {
                auctionCount: auctions?.length || 0,
                auctionIds: auctions,
              })

              if (useNotificationStore.auctions && useNotificationStore.auctions.length > 0) {
                console.log('[Composable:onRegistration] 📝 경매 구독 시작', {
                  count: useNotificationStore.auctions.length,
                })

                const subscribePromises = useNotificationStore.auctions.map(
                  async (auctionId, index) => {
                    console.log('[Composable:onRegistration] 📝 구독 진행', {
                      index: index + 1,
                      total: useNotificationStore.auctions.length,
                      auctionId,
                    })

                    try {
                      await subscribe(userStore.currentUser.id, auctionId)
                      console.log('[Composable:onRegistration] ✅ 개별 구독 성공', {
                        auctionId,
                        progress: `${index + 1}/${useNotificationStore.auctions.length}`,
                      })
                    } catch (subError) {
                      console.error('[Composable:onRegistration] ❌ 개별 구독 실패', {
                        auctionId,
                        error: subError.message,
                      })
                    }
                  },
                )

                await Promise.all(subscribePromises)

                console.log('[Composable:onRegistration] ✅ 모든 경매 구독 완료', {
                  totalSubscribed: useNotificationStore.auctions.length,
                })
              } else {
                console.log('[Composable:onRegistration] ℹ️ 구독할 경매 없음')
              }
            } catch (error) {
              console.error('[Composable:onRegistration] ❌ 경매 구독 프로세스 실패', {
                error: error.message,
                stack: error.stack,
              })
            }
          } else {
            console.warn('[Composable:onRegistration] ⚠️ memberId 없음 - 구독 스킵')
          }
        },
        onMessage: (message) => {
          console.log('[Composable:onMessage] 📨 SSE 메시지 수신', {
            timestamp: new Date().toISOString(),
            messagePreview: message.substring(0, 100),
          })

          try {
            const messageJson = JSON.parse(message)
            console.log('[Composable:onMessage] ✅ 메시지 파싱 성공', {
              type: messageJson.type,
              auctionId: messageJson.auctionId,
              message: messageJson.message,
            })
            handleMessage(messageJson)
          } catch (error) {
            console.error('[Composable:onMessage] ❌ 메시지 파싱 에러', {
              error: error.message,
              rawMessage: message,
            })
          }
        },
        onError: (error) => {
          console.error('[Composable:onError] ❌ SSE 연결 에러', {
            timestamp: new Date().toISOString(),
            error: error,
            errorType: error?.type,
            readyState: error?.target?.readyState,
          })
        },
      })
    } else {
      console.log('[Composable:initNotification] ⏭️ 연결 스킵', {
        reason: !userStore.currentUser ? '사용자 없음' : '이미 연결됨',
        isConnected: isConnected(),
      })
    }
  }

  const subscribeAuction = async (auctionId) => {
    if (!useNotificationStore.isIncludeAuction(auctionId)) {
      useNotificationStore.addAuction(auctionId)
      await subscribe(userStore.currentUser.id, auctionId)
    }
  }

  /**
   * Service Worker를 등록합니다.
   */
  const registerServiceWorker = async () => {
    console.log('[Composable:registerServiceWorker] 🔧 Service Worker 등록 시작', {
      timestamp: new Date().toISOString(),
      isSecureContext: window.isSecureContext,
      hasServiceWorker: 'serviceWorker' in navigator,
    })

    if (window.isSecureContext && 'serviceWorker' in navigator) {
      try {
        console.log('[Composable:registerServiceWorker] 📝 navigator.serviceWorker.register 호출')

        const registration = await navigator.serviceWorker.register('/serviceworker.js')

        console.log('[Composable:registerServiceWorker] ✅ 등록 완료 - 업데이트 확인 중', {
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
        })

        await registration.update()

        console.log('[Composable:registerServiceWorker] ✅ Service Worker 등록 및 업데이트 성공', {
          registration,
          scope: registration.scope,
        })
      } catch (error) {
        console.error('[Composable:registerServiceWorker] ❌ Service Worker 등록 실패', {
          error: error.message,
          stack: error.stack,
        })
      }
    } else {
      console.warn('[Composable:registerServiceWorker] ⚠️ Service Worker 등록 불가', {
        isSecureContext: window.isSecureContext,
        hasServiceWorker: 'serviceWorker' in navigator,
      })
    }
  }

  /**
   * 알림 시스템을 초기화합니다.
   */
  const setupNotification = () => {
    registerServiceWorker()
    requestNotificationPermission()
  }

  // 사용자 로그인 상태를 감시하여 SSE 연결 관리
  watch(
    () => userStore.currentUser,
    (newUser) => {
      if (newUser && !isConnected()) {
        initNotification()
      } else if (!newUser) {
        disconnectSse()
      }
    },
    { immediate: true },
  )

  // 컴포넌트 마운트 시 알림 시스템 초기화
  onMounted(() => {
    setupNotification()
  })

  // 컴포넌트 언마운트 시 정리 (선택사항)
  // SSE 연결은 앱 전체에서 유지되므로 일반적으로 여기서 종료하지 않습니다.
  onUnmounted(() => {
    // 필요 시 disconnectSse 호출
  })

  return {
    initNotification,
    setupNotification,
    subscribeAuction,
  }
}
