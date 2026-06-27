const RUNTIME_CACHE = 'scrubbys-runtime-v3';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== RUNTIME_CACHE; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Reviews/Instagram data must always be fresh, never served stale from cache.
  if (url.pathname.indexOf('/assets/data/') !== -1) return;

  // HTML pages: always go to network first so content updates show immediately.
  // Only fall back to the cache if the network is actually unavailable.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then(function (response) {
          caches.open(RUNTIME_CACHE).then(function (cache) { cache.put(req, response.clone()); });
          return response;
        })
        .catch(function () {
          return caches.open(RUNTIME_CACHE).then(function (cache) { return cache.match(req); });
        })
    );
    return;
  }

  // Static assets (CSS, JS, images): serve from cache instantly, refresh in background.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        const networkFetch = fetch(req)
          .then(function (response) {
            if (response.ok) cache.put(req, response.clone());
            return response;
          })
          .catch(function () { return cached; });
        return cached || networkFetch;
      });
    })
  );
});
