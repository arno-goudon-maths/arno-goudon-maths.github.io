// Service worker de « Plan de classe » (version web) : l'application marche hors ligne.
// Réseau d'abord, pour recevoir les mises à jour ; le cache prend le relais sans connexion.
const CACHE = "plan-de-classe-fea98eb223";
const FICHIERS = ["./", "index.html", "pont-web.js", "manifest.webmanifest", "lexend.css", "jspdf.umd.min.js", "lexend-0.woff2", "lexend-2.woff2", "lexend-1.woff2", "icone-32.png", "icone-180.png", "icone-192.png", "icone-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k.startsWith("plan-de-classe-") && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./"))));
});
