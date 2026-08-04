/**
 * Lulu custom service worker (injectManifest strategy).
 * Compiled by vite-plugin-pwa's Rollup sub-build, not by the main tsc.
 *
 * Responsibilities:
 *  1. Precache all app assets (self.__WB_MANIFEST injected by vite-plugin-pwa)
 *  2. SPA navigation fallback → serve the precached index.html
 *  3. Handle incoming Web Push notifications
 *  4. Handle notification clicks → focus / open the app
 */

import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// 1. Precache all Vite build assets (manifest injected at build time)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Activate immediately and claim all clients so push events are handled
// by the latest SW version (required with injectManifest + autoUpdate).
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Support vite-plugin-pwa autoUpdate: respond to SKIP_WAITING message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// 2. SPA navigation fallback — all navigations (except /api, /supabase) get index.html
const spaHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(spaHandler, {
    denylist: [/^\/api\//, /^\/supabase\//],
  })
)

// ── Web Push ──────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data: { title?: string; body?: string; icon?: string; badge?: string; tag?: string; url?: string }
  try { data = event.data.json() } catch { data = { body: event.data.text() } }

  const title = data.title ?? '🌸 Lulu'
  event.waitUntil(
    self.registration.showNotification(title, {
      body:  data.body,
      icon:  data.icon  ?? '/flower-192.png',
      badge: data.badge ?? '/flower-192.png',
      tag:   data.tag,
      data:  { url: data.url ?? '/' },
    })
  )
})

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target: string = (event.notification.data as { url?: string })?.url ?? '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const hit = clients.find(c => c.url.startsWith(self.location.origin))
        if (hit) return hit.focus().then(c => c.navigate(target))
        return self.clients.openWindow(target)
      })
  )
})
