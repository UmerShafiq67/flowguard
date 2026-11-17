const CACHE="studysprint-shell-v52-v32";
const ASSETS=["./","./index.html","./styles.css?v=31","./design-v2.css?v=31","./design-v3.css?v=31","./config.js?v=31","./study-core.js?v=31","./app.js?v=31","./maxi-plus.js?v=31","./enhancements.js?v=31","./account.js?v=31","./visual-v31.css?v=31","./visual-v31.js?v=31","./manifest.webmanifest","./icon.svg","./icon-maskable.svg","./terms.html","./privacy.html","./refund.html","./contact.html","./pricing.html"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==self.location.origin)return;
  e.respondWith(fetch(r).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(r).then(c=>c||caches.match("./index.html"))));
});
