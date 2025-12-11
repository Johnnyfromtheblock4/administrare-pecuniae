self.addEventListener("install", (event) => {
  console.log("Service Worker installato");
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/src/main.jsx",
        "/imgs/logo-192.png",
        "/imgs/logo-512.png",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
