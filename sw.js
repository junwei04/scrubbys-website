const RUNTIME_CACHE = 'scrubbys-runtime-v1';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Reviews/Instagram data must always be fresh, never served stale from cache.
  if (url.pathname.indexOf('/assets/data/') !== -1) return;

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
