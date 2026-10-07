"use strict";

const CACHE_NAME = 'darts-pwa-v1';
const assetsToCache = [
    './index.html',
    './css/style.css', // Pas aan indien je naam anders is
    './js/app.js',
    './manifest.json'
];

// Installeren & direct activeren bij updates
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(assetsToCache);
        })
    );
    self.skipWaiting();
});

// Activeren en oude caches opruimen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: probeer netwerk, val terug op cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Indien online, update de cache optioneel of geef response terug
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});