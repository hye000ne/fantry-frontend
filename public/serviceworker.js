self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker:activate] 🟢 Service Worker 활성화', {
    timestamp: new Date().toISOString(),
    scope: self.registration.scope,
  })
  event.waitUntil(clients.claim())
  console.log('[ServiceWorker:activate] ✅ clients.claim() 완료')
})

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker:notificationclick] 🖱️ 알림 클릭 이벤트 발생', {
    timestamp: new Date().toISOString(),
    action: event.action,
  })

  const clickedNotification = event.notification
  const url = clickedNotification.data?.url || '/'

  console.log('[ServiceWorker:notificationclick] 📋 알림 정보', {
    title: clickedNotification.title,
    body: clickedNotification.body,
    tag: clickedNotification.tag,
    data: clickedNotification.data,
    targetUrl: url,
  })

  // 알림 닫기
  clickedNotification.close()
  console.log('[ServiceWorker:notificationclick] ✅ 알림 닫기 완료')

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window' })
      .then((clientList) => {
        console.log('[ServiceWorker:notificationclick] 🔍 클라이언트 목록 조회', {
          clientCount: clientList.length,
          clients: clientList.map((c) => ({ url: c.url, focused: c.focused, visibilityState: c.visibilityState })),
        })

        for (const client of clientList) {
          // 원하는 URL 패턴을 가진 클라이언트 찾기
          if (client.url.startsWith(self.location.origin)) {
            console.log('[ServiceWorker:notificationclick] 🎯 기존 탭 발견 - 포커스 및 이동', {
              clientUrl: client.url,
              targetUrl: url,
            })
            client.focus()
            return client.navigate(url)
          }
        }

        // 일치하는 탭이 없으면 새 창 열기
        console.log('[ServiceWorker:notificationclick] 🆕 기존 탭 없음 - 새 창 열기', {
          url,
        })

        if (clients.openWindow) {
          return clients.openWindow(url).then((windowClient) => {
            console.log('[ServiceWorker:notificationclick] ✅ 새 창 열기 성공', {
              url: windowClient?.url,
            })
            return windowClient
          })
        } else {
          console.error('[ServiceWorker:notificationclick] ❌ openWindow 지원 안 됨')
        }
      })
      .catch((error) => {
        console.error('[ServiceWorker:notificationclick] ❌ 클라이언트 처리 실패', {
          error: error.message,
          stack: error.stack,
        })
      }),
  )
})
