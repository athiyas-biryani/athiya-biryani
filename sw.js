/* Service worker — static shell cached so the menu wall loads even on a
   patchy kitchen connection; network-first for the pages themselves. */

const CACHE = "athiya-v3";
const CORE = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.webmanifest",
  "./css/signboard.css",
  "./css/customer.css",
  "./css/admin.css",
  "./js/utils.js",
  "./js/config.js",
  "./js/menu-data.js",
  "./js/db.js",
  "./js/sound.js",
  "./js/customer.js",
  "./js/admin.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.origin !== location.origin) return;

  // Network-first for the HTML shell so live content wins; cache as fallback.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return res; })
        .catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); }
        return res;
      }).catch(() => cached)
    )
  );
});
