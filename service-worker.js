self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("smart-khaata-v1").then(cache => {
      return cache.addAll([
        "./",
        "index.html",
        "style.css",
        "script.js",
        "icon-192.png",
        "icon-512.png",
        "manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
