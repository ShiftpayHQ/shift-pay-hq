const CACHE="shift-pay-hq-v9-10-3l";
const ASSETS=["./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.mode==="navigate"||new URL(e.request.url).pathname.endsWith("/index.html")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./index.html")));return;}e.respondWith(fetch(e.request).then(resp=>{if(e.request.method==="GET"&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return resp;}).catch(()=>caches.match(e.request)));});
