// Application « Japonais » (fiches, mots, quiz audio) : fonctionne hors connexion une fois les fichiers en cache.
// L'application et la liste des mots : réseau d'abord (pour recevoir les mots nouveaux),
// cache sinon. Les mp3 : cache d'abord (ils ne changent jamais : leur nom est une empreinte).
const CACHE = 'japonais-v2';
const COQUILLE = ['./', './index.html', './vocab.json', './fiches.json', './manifest.json', './icone-180.png', './icone-192.png'];

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
	);
});
self.addEventListener('fetch', (e) => {
	const url = new URL(e.request.url);
	if (e.request.method !== 'GET' || url.origin !== location.origin) return;
	if (url.pathname.endsWith('.mp3')) {
		e.respondWith(
			caches.open(CACHE).then((c) =>
				c.match(e.request).then(
					(r) =>
						r ||
						fetch(e.request).then((rep) => {
							if (rep.ok) c.put(e.request, rep.clone());
							return rep;
						}),
				),
			),
		);
		return;
	}
	e.respondWith(
		fetch(e.request)
			.then((rep) => {
				if (rep.ok) {
					const copie = rep.clone();
					caches.open(CACHE).then((c) => c.put(e.request, copie));
				}
				return rep;
			})
			.catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
	);
});
