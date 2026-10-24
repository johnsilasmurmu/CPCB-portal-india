/* CPCB Textile Inspection Portal – offline app shell service worker */
const CACHE = 'cpcb-textile-v3'
const APP_SHELL = ['./', './index.html', './favicon.svg', './manifest.webmanifest']

async function precache() {
  const cache = await caches.open(CACHE)
  await cache.addAll(APP_SHELL)

  // Precache every hashed build asset (including lazily imported export chunks)
  try {
    const response = await fetch('./.vite/manifest.json', { cache: 'no-store' })
    if (response.ok) {
      const manifest = await response.json()
      const urls = new Set()
      for (const entry of Object.values(manifest)) {
        if (entry.file) urls.add(`./${entry.file}`)
        for (const file of entry.css || []) urls.add(`./${file}`)
        for (const file of entry.assets || []) urls.add(`./${file}`)
      }
      await Promise.all(
        [...urls].map((url) => cache.add(url).catch(() => undefined)),
      )
    }
  } catch {
    /* manifest unavailable – runtime caching still applies once online */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html', { ignoreVary: true }).then((cached) => cached || caches.match('./', { ignoreVary: true }))),
    )
    return
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
