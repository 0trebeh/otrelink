// Otrelink service worker.
// - Static assets (JS/CSS/fonts/icons/uploaded images) are cached for speed.
// - Pages always come from the network so you never see stale data;
//   when offline, an offline screen is shown instead.
// - API calls are never cached (except immutable uploaded images).
// Bump VERSION to force clients to drop old caches.
const VERSION = 'v1';
const STATIC = `otrelink-static-${VERSION}`;
const RUNTIME = `otrelink-runtime-${VERSION}`;
const PRECACHE = ['/offline', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, RUNTIME].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Logout tells the worker to forget anything user-specific.
self.addEventListener('message', (event) => {
  if (event.data === 'clear-runtime') event.waitUntil(caches.delete(RUNTIME));
});

const cacheFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
};

const staleWhileRevalidate = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || network;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts (cross-origin)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, STATIC));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Page navigations: network first, offline screen as fallback.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () => (await caches.match('/offline')) || Response.error()));
    return;
  }
  // Uploaded images are immutable.
  if (url.pathname.startsWith('/api/assets/')) {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }
  if (url.pathname.startsWith('/api/')) return; // never cache API data
  // Hashed build output and icons.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(req, STATIC));
  }
});
