// Bump CACHE_VERSION whenever static assets, HTML templates, or JSON schemas change.
const CACHE_VERSION = "matrika-v1.0.0";
const VERSION_QS = "?v=20261126";

const PRECACHE_PATHS = [
  "./",
  "./index.html",
  "./languages.html",
  "./library.html",
  "./gallery.html",
  "./audio.html",
  "./map.html",
  "./contribute.html",
  "./assets/icons/favicon.svg",
  `./css/fonts.css${VERSION_QS}`,
  `./css/tokens.css${VERSION_QS}`,
  `./css/base.css${VERSION_QS}`,
  `./css/layout.css${VERSION_QS}`,
  `./css/pages/home.css${VERSION_QS}`,
  "./assets/fonts/fraunces-var-normal-latin.woff2",
  "./assets/fonts/plus-jakarta-var-normal-latin.woff2",
  "./assets/fonts/noto-devanagari-var.woff2",
  "./data/taxonomy.json",
  "./data/languages.json",
  "./data/brand/wordmarks.json",
];

function resolveScopeUrl(rel) {
  return new URL(rel, self.registration.scope).href;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const urls = PRECACHE_PATHS.map(resolveScopeUrl);
      await Promise.allSettled(
        urls.map((u) => cache.add(new Request(u, { cache: "reload" })))
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first with cached page or index offline fallback
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return (
            (await caches.match(resolveScopeUrl("./index.html"))) ||
            new Response("Offline — Archive page unavailable.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        })
    );
    return;
  }

  // Fonts & archive imagery: cache-first
  if (url.pathname.includes("/assets/fonts/") || url.pathname.includes("/assets/images/")) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Data JSON & CSS/JS: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
