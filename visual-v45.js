/* StudySprint V45 — page visual layer. Landing is owned by app.js. */
(function(){
  const photos={
    today:["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=88&w=1400","Focused study"],
    plan:["https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=jpg&q=88&w=1400","Planning the week"],
    subjects:["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=88&w=1400","Mapping the subject"],
    session:["https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&fm=jpg&q=88&w=1400","Focused work"],
    practice:["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&fm=jpg&q=88&w=1400","Active recall"],
    tutor:["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&fm=jpg&q=88&w=1400","Getting unstuck"],
    review:["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&fm=jpg&q=88&w=1400","Returning to review"],
    progress:["https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&fm=jpg&q=88&w=1400","Reading progress"],
    focus:["https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&fm=jpg&q=88&w=1400","Protected focus"],
    account:["https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=88&w=1400","Keeping the system simple"]
  };
  const esc=s=>String(s||"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  function mount(){
    document.querySelectorAll(".page-guide,.v34-guide-line,.page-quote,.v30-quote,.v6-quote,.v30-pagehero,.v6-hero").forEach(e=>e.remove());
    const main=document.querySelector("#app .app-main");
    if(!main||main.querySelector(".v45-page-visual"))return;
    const match=(main.className||"").match(/view-([a-z-]+)/);
    const key=match&&photos[match[1]]?match[1]:null;
    const head=main.querySelector(".head");
    if(!key||!head)return;
    const p=photos[key],fig=document.createElement("figure");
    fig.className="v45-page-visual";
    fig.innerHTML='<img src="'+p[0]+'" alt="'+esc(p[1])+'" loading="lazy"><figcaption><small>STUDYSPRINT · '+key.toUpperCase()+'</small><b>'+esc(p[1])+'</b></figcaption>';
    head.insertAdjacentElement("afterend",fig);
    const img=fig.querySelector("img");
    img.addEventListener("error",()=>{fig.style.background="linear-gradient(135deg,#102b4d,#3157ff)";img.remove()},{once:true});
  }
  const render=window.render;
  if(typeof render==="function")window.render=function(){render();requestAnimationFrame(mount)};
  requestAnimationFrame(mount);
  setTimeout(mount,250);
})();