// Shift Pay HQ v9_10_3ax DEV cache cleanup worker.
self.addEventListener("install", event => { self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith("shift-pay-hq-")).map(k=>caches.delete(k))); await self.registration.unregister(); const cs=await self.clients.matchAll({type:"window",includeUncontrolled:true}); for(const c of cs)c.postMessage({type:"SPHQ_DEV_SW_REMOVED",version:"v9_10_3ax"}); })()); });
