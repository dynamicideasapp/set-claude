const CACHE_NAME = 'set-claude-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pdf-logic.js',
  './libs/jspdf.umd.min.js',
  './libs/heic2any.min.js',
  './manifest.json',
  './imagenes/icon-sf.svg',
  './imagenes/logoempresa.png',
  './imagenes/1.png',
  './imagenes/2.png',
  './imagenes/3.png',
  './fonts/DejaVuSans.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear GET; ignorar extensiones de Capacitor y Analytics
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol === 'capacitor:' || url.hostname.includes('google')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Sin red y sin caché: para HTML principal devolver index cacheado
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
