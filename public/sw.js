const CACHE_NAME = 'grow-play-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/GrowPlayLogo.png',
  '/assets/GrowPlayIsotipo.png'
];

// Instalar el Service Worker y guardar en caché recursos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones (modo de red primero, luego caché para assets)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // No cachear peticiones de la API o de streaming
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
