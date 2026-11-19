/* StudySprint V41 — unique page photography + concise guide lines */
(function(){
 const photos={
  today:["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=88&w=1400","A focused next move","One clear action is easier to start than a wall of tasks."],
  plan:["https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=jpg&q=88&w=1400","Build the path","A useful plan makes the next session obvious without pretending every day is identical."],
  subjects:["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=88&w=1400","See what matters","Turn a whole subject into visible topics, signals and next actions."],
  session:["https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&fm=jpg&q=88&w=1400","Protect the session","Start with one target, remove the noise and leave with evidence."],
  practice:["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&fm=jpg&q=88&w=1400","Prove what you know","Retrieval exposes the gaps that rereading can hide."],
  tutor:["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&fm=jpg&q=88&w=1400","Get unstuck, then return","Use help to understand the block, then test the idea yourself."],
  review:["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&fm=jpg&q=88&w=1400","Return when it counts","Review should target the memories most likely to fade next."],
  progress:["https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&fm=jpg&q=88&w=1400","Watch the signal","Progress means better retrieval, fewer mistakes and smarter priorities."],
  focus:["https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&fm=jpg&q=88&w=1400","Give focus one job","A protected block is easier to finish when the task is concrete."],
  account:["https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=88&w=1400","Keep the setup effortless","Your account should stay in the background while learning stays in front."]
 };
 function key(main){
  const m=(main.className||"").match(/view-([a-z-]+)/); if(m&&photos[m[1]])return m[1];
  const h=(main.querySelector(".head h1")?.textContent||"").toLowerCase();
  for(const k of Object.keys(photos))if(h.includes(k))return k;
  return "today";
 }
 function add(){
  const main=document.querySelector("#app .app-main"),head=main?.querySelector(".head");
  if(!main||!head||main.querySelector(".v41-page-visual"))return;
  const k=key(main),p=photos[k],el=document.createElement("figure");
  el.className="v41-page-visual";
  el.innerHTML='<img src="'+p[0]+'" alt="'+p[1]+'" loading="lazy"><figcaption><small>STUDYSPRINT · '+k.toUpperCase()+'</small><b>'+p[1]+'</b><span>'+p[2]+'</span></figcaption>';
  head.insertAdjacentElement("afterend",el);
 }
 function landingGuide(){
  const site=document.querySelector(".v34-site"); if(!site||site.querySelector(".v34-guide-line"))return;
  const hero=site.querySelector(".v34-hero-copy");
  if(!hero)return;
  const p=document.createElement("div");p.className="v34-guide-line";
  p.innerHTML='<i aria-hidden="true"></i><span>Plan with evidence. Practice with purpose. Adapt to what you actually know.</span>';
  const target=hero.querySelector(".v34-hero p"); target?.insertAdjacentElement("afterend",p);
 }
 function mount(){setTimeout(()=>{add();landingGuide()},40)}
 const old=window.render;
 if(typeof old==="function")window.render=function(){old();mount()};
 mount();
})();
