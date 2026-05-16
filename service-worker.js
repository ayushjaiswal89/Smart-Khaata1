self.addEventListener("install", e => {
  console.log("SW Installed");
  e.waitUntil(
    caches.open("smart-khaata1-v1").then(cache => {
      return cache.addAll([
       "/",
"/index.html",
"/style.css",
"/script.js",
"/manifest.json",
"/icon-192.png",
"/icon-512.png"

      ]);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== 'smart-khaata1-v1').map(key => caches.delete(key))
    ))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).then(networkRes => {
        if(e.request.method === 'GET'){
          caches.open('smart-khaata1-v1').then(cache => cache.put(e.request, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
