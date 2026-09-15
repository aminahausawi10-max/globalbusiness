const CACHE_NAME = 'globalbiz-pwa-v1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/api.js',
  './assets/js/app.js',
  './assets/icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Install Event: Pre-cache core app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[GlobalBiz Service Worker] Caching app shell assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[GlobalBiz Service Worker] Non-fatal pre-cache error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up stale caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[GlobalBiz Service Worker] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first for dynamic content, Cache-first for static assets
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or chrome extension schemes
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // Handle API requests (Network First, fallback to cache)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Handle App Shell & Static Assets (Stale-While-Revalidate strategy)
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      const fetchPromise = fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(err => {
        console.log('[GlobalBiz Service Worker] Network failed, serving cached/fallback:', err);
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
