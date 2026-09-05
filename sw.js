const CACHE_TILES = 'senderos-tiles-v1';
const CACHE_SHELL = 'senderos-shell-v4';
const PAGINA_PRINCIPAL = './index.html';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_SHELL).then(cache => cache.add(PAGINA_PRINCIPAL)).catch(err => console.warn('No se pudo guardar la app', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

function esRecursoCacheable(url){
  return /api\.maptiler\.com|tile\.opentopomap\.org|arcgisonline\.com|cdnjs\.cloudflare\.com|unpkg\.com/.test(url);
}

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Mapas y librerías: primero caché, refresco en segundo plano si hay red
  if (esRecursoCacheable(url)) {
    e.respondWith(
      caches.open(CACHE_TILES).then(cache =>
        cache.match(e.request).then(cached => {
          const enRed = fetch(e.request).then(resp => {
            if (resp && resp.ok) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || enRed;
        })
      )
    );
    return;
  }

  // Navegación a la app: si no hay red, servir la copia guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'reload' }).catch(() => caches.match(PAGINA_PRINCIPAL))
    );
  }
});
