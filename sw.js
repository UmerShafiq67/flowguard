const CACHE="studysprint-shell-v53-v33";
const ASSETS=["./","./index.html","./styles.css?v=33","./design-v2.css?v=33","./design-v3.css?v=33","./visual-upgrade.css?v=33","./visual-v32.css?v=33","./config.js?v=33","./study-core.js?v=33","./app.js?v=33","./maxi-plus.js?v=33","./enhancements.js?v=33","./account.js?v=33","./design-v2.js?v=33","./design-v3.js?v=33","./visual-upgrade.js?v=33","./visual-v32.js?v=33","./manifest.webmanifest","./icon.svg","./icon-maskable.svg","./assets/studysprint-mark.svg","./terms.html","./privacy.html","./refund.html","./contact.html","./pricing.html"];
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