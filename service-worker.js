const CACHE_NAME = "conecta2-public-v4";

const STATIC_ASSETS = [
  "/conecta2/",
  "/conecta2/manifest.json?v=4",
  "/conecta2/icon-192.png",
  "/conecta2/icon-512.png",
  "/conecta2/logo.png",
  "/conecta2/banner.png",
  "/conecta2/farmacia-bg.jpg",
  "/conecta2/cabapps-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

// NO interceptar llamadas al backend (Apps Script)
if (url.hostname.includes("script.google.com")) {
  return;
}
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isHTMLRequest =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

  // HTML siempre desde red, sin cachear páginas
  if (isHTMLRequest) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match("/conecta2/"))
    );
    return;
  }

  // Assets: caché primero
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
