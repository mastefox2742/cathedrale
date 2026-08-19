// Service worker minimal - point de depart uniquement.
//
// Le cahier des charges (section 8) demande un mode hors ligne bien plus
// riche (shell applicatif, horaires recemment consultes, formations
// telechargees, prieres de base, derniers evenements). Ce fichier ne fait
// QUE mettre en cache l'app shell pour rendre l'app installable - remplacer
// par une strategie Workbox/Serwist complete avant d'annoncer un vrai mode
// hors ligne aux utilisateurs.

const CACHE_NAME = "csc-shell-v1";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

// Network-first pour tout le reste : on ne veut jamais servir une page perimee
// silencieusement pour du contenu pastoral qui peut changer (annonces urgentes).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
