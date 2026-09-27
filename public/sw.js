/* Service worker PWA — cache hors-ligne (reprend la stratégie de l'ancienne
 * configuration Workbox). Enregistré par src/app/providers.tsx en production.
 * Les notifications push sont gérées à part par firebase-messaging-sw.js. */

const VERSION = 'v2'
const PAGES = `pages-${VERSION}`
const IMAGES = `images-${VERSION}`
const AELF = `aelf-${VERSION}`
const FORMATIONS = `formations-${VERSION}`
const FONTS = `fonts-${VERSION}`
const CONNUS = [PAGES, IMAGES, AELF, FORMATIONS, FONTS]

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !CONNUS.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function reseauDabord(request, cache, delaiMs) {
  const c = await caches.open(cache)
  try {
    const res = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('délai')), delaiMs)),
    ])
    if (res.ok) c.put(request, res.clone())
    return res
  } catch (e) {
    const cached = await c.match(request)
    if (cached) return cached
    throw e
  }
}

async function cacheDabord(request, cache) {
  const c = await caches.open(cache)
  const cached = await c.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok || res.type === 'opaque') c.put(request, res.clone())
  return res
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Liturgie AELF : fraîche si possible, sinon la dernière version lue.
  if (url.pathname.startsWith('/api/aelf')) {
    event.respondWith(reseauDabord(request, AELF, 5000))
    return
  }
  // Cours de catéchèse déjà ouverts : lisibles hors ligne.
  if (/supabase\.co\/rest\/v1\/(cours|catechisme_modules|lecons|path_steps)/.test(request.url)) {
    event.respondWith(reseauDabord(request, FORMATIONS, 4000))
    return
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    event.respondWith(cacheDabord(request, FONTS))
    return
  }
  if (url.origin === self.location.origin && /\.(png|jpe?g|svg|gif|webp|ico)$/.test(url.pathname)) {
    event.respondWith(cacheDabord(request, IMAGES))
    return
  }
  // Pages du site : réseau d'abord, dernière version en cache hors ligne.
  if (request.mode === 'navigate' && url.origin === self.location.origin && !url.pathname.startsWith('/admin')) {
    event.respondWith(reseauDabord(request, PAGES, 3000))
  }
})
