/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Workbox inyecta el manifest aquí
precacheAndRoute(self.__WB_MANIFEST)

// Cache de DolarAPI (5 min)
registerRoute(
  ({ url }) => url.origin === 'https://dolarapi.com',
  new NetworkFirst({
    cacheName: 'dolar-api-cache',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 300 })],
  })
)

// Cache de Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-cache' })
)

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  let payload = { title: '하나 Hana 🌸', body: '¡Es momento de registrar tus gastos del día!' }
  try {
    if (event.data) payload = event.data.json()
  } catch {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'hana-daily',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    (self as unknown as { clients: { matchAll: (o: object) => Promise<readonly WindowClient[]>; openWindow: (url: string) => Promise<WindowClient | null> } })
      .clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus()
          }
        }
        return (self as unknown as { clients: { openWindow: (url: string) => Promise<WindowClient | null> } }).clients.openWindow('/')
      })
  )
})
