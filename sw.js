const CACHE_NAME = 'globalbiz-pwa-v4.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css?v=4.0',
  './assets/js/api.js?v=4.0',
  './assets/js/app.js?v=4.0',
  './assets/icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Install Event: Force immediate activation
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Market at Home SW] Caching v4.0 assets');
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('Pre-cache error:', err));
    })
  );
});

// 2. Activate Event: Purge ALL previous caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Market at Home SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for fresh UI updates
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // Network First strategy so edits are immediately visible on refresh
  event.respondWith(
    fetch(req)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(req).then(cached => cached || (req.headers.get('accept')?.includes('text/html') ? caches.match('./index.html') : null)))
  );
});

