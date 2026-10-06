import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Firebase Cloud Messaging delivers a plain Web Push event to whichever
// service worker is active for this scope - there's no separate
// firebase-messaging-sw.js involved, this handler is all that's needed to
// show a notification while the app is backgrounded or closed.
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }
  const notification = payload.notification || {}
  event.waitUntil(
    self.registration.showNotification(notification.title || 'כיתת ענן', {
      body: notification.body,
      icon: 'pwa-192.png',
      data: payload.data || {},
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow('./'))
})
