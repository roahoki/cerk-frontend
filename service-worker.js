// Manejo de caché para que funcione offline
let CACHE_NAME = 'my-cache';
let urlsToCache = [
    // '/',
    // '/index.html',
    '/chat-icon.png', 
];

// Guardo la info de arriba en el caché
self.addEventListener('install', (event) => {
    console.log("Service worker instalado");
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    console.log("Service worker activado");
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});

// Interceptamos todas las peticiones fetch, si ya lo tenemos en el cache lo devolvemos, 
// si no lo buscamos y lo guardamos en el cache
self.addEventListener('fetch', (event) => {
    console.log("Fetch");
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});