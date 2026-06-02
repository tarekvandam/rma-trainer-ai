self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'show_notification') {
    const { title, body, tag, url } = e.data
    self.registration.showNotification(title || 'RMA Trainer', {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag,
      data: { url: url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  }
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  clients.openWindow(url)
})
