const CACHE='elevore360d-local-deals-customer-v2-6';
const CORE=['./','index.html','style.css','app.js','manifest.json','elevore360d-logo.jpg','icon-192.png','icon-512.png','share-qr.png','install.js'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isBusinessData = /\/(businesses|business-settings|advert-settings)\.json$/i.test(url.pathname);
  const isBusinessImage = /\/(business\d{3}|advert[-_a-z0-9]*|ad[-_a-z0-9]*)\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(url.pathname);

  // Business data and advertising pictures: always try the live GitHub Pages copy first.
  if (isBusinessData || isBusinessImage) {
    event.respondWith(
      fetch(event.request, {cache:'no-store'})
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache first, network fallback.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
