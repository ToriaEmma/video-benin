// Service worker minimal : il rend TockTick installable (ecran d'accueil,
// application de bureau). Aucune mise en cache : tout vient du reseau.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
