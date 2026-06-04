// Firebase Messaging Service Worker
// Gère les notifications push en arrière-plan

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// La config sera injectée au build via les env vars
// En production, ces valeurs viennent du manifest Vercel
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config)
    }
  }
})

// Notification par défaut si Firebase n'est pas encore initialisé
self.addEventListener('push', event => {
  if (!event.data) return
  try {
    const data = event.data.json()
    const options = {
      body: data.notification?.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data ?? {},
      actions: [
        { action: 'open', title: 'Voir' },
        { action: 'close', title: 'Fermer' },
      ],
    }
    event.waitUntil(
      self.registration.showNotification(data.notification?.title ?? 'Sacré-Cœur Brazzaville', options)
    )
  } catch (_) {}
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'close') return
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// Init Firebase Messaging si déjà configuré
try {
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage(payload => {
    const { title = 'Sacré-Cœur Brazzaville', body = '', image } = payload.notification ?? {}
    const options = {
      body,
      icon: image ?? '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data ?? {},
      vibrate: [200, 100, 200],
    }
    return self.registration.showNotification(title, options)
  })
} catch (_) {}
