// Shift Pay HQ v9.10.3u DEV cache cleanup worker.
// /test/index.html does not register this worker. This file exists so an older
// registration that checks for an update receives a worker that removes itself.
self.addEventListener("install", event => { self.skipWaiting(); });
self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("shift-pay-hq-")).map(k=>caches.delete(k)));
    await self.registration.unregister();
    const clientsList=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of clientsList){ client.postMessage({type:"SPHQ_DEV_SW_REMOVED",version:"v9.10.3u"}); }
  })());
});
self.addEventListener("fetch", event => { event.respondWith(fetch(event.request,{cache:"no-store"})); });
