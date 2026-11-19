/* StudySprint V44 — one clean visual layer, no quote/guide injection. */
(function(){
 const photos={
  today:["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=88&w=1400","Focused study"],
  plan:["https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=jpg&q=88&w=1400","Planning a study week"],
  subjects:["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=88&w=1400","Learning in a classroom"],
  session:["https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&fm=jpg&q=88&w=1400","Focused laptop session"],
  practice:["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&fm=jpg&q=88&w=1400","Active recall"],
  tutor:["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&fm=jpg&q=88&w=1400","Study discussion"],
  review:["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&fm=jpg&q=88&w=1400","Reviewing notes"],
  progress:["https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&fm=jpg&q=88&w=1400","Tracking progress"],
  focus:["https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&fm=jpg&q=88&w=1400","Quiet focus space"],
  account:["https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=88&w=1400","Study planning"]
 };
 function key(main){const m=(main.className||"").match(/view-([a-z-]+)/);return m&&photos[m[1]]?m[1]:"today"}
 function mount(){
  document.querySelectorAll(".page-guide,.v34-guide-line,.page-quote").forEach(e=>e.remove());
  const main=document.querySelector("#app .app-main");
  if(!main||main.querySelector(".v44-page-visual"))return;
  const k=key(main),p=photos[k],head=main.querySelector(".head");
  if(!head)return;
  const fig=document.createElement("figure");fig.className="v44-page-visual";
  fig.style.cssText="position:relative;min-height:250px;height:250px;margin:0 0 24px;border-radius:22px;overflow:hidden;border:1px solid #294762;background:#0b1c31;box-shadow:0 20px 55px rgba(0,0,0,.22)";
  fig.innerHTML='<img src="'+p[0]+'" alt="'+p[1]+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;opacity:.58;display:block"><figcaption style="position:absolute;inset:auto 22px 20px;z-index:2"><small style="display:block;color:#68dce5;font:700 9px DM Mono,monospace;letter-spacing:.14em">STUDYSPRINT · '+k.toUpperCase()+'</small><b style="display:block;color:#fff;font:700 clamp(25px,4vw,42px) Space Grotesk,sans-serif;letter-spacing:-.05em;margin-top:5px">'+p[1]+'</b></figcaption>';
  fig.insertAdjacentHTML("beforeend",'<div aria-hidden="true" style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,12,22,.78),rgba(4,12,22,.18) 70%),linear-gradient(0deg,rgba(4,12,22,.75),transparent 60%)"></div>');
  head.insertAdjacentElement("afterend",fig);
  fig.querySelector("img").addEventListener("error",()=>{fig.style.background="linear-gradient(135deg,#102b4d,#3157ff)";fig.querySelector("img").style.display="none"},{once:true});
 }
 function clean(){document.querySelectorAll(".page-guide,.v34-guide-line,.page-quote").forEach(e=>e.remove());mount()}
 const old=window.render;
 if(typeof old==="function")window.render=function(){old();requestAnimationFrame(clean)};
 requestAnimationFrame(clean);setTimeout(clean,150);
})();
