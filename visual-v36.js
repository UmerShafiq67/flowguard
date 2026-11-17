/* StudySprint V36 — premium visual storytelling layer */
(function(){
  const photos=[
    "https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&q=90&w=1800",
    "https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&q=90&w=1800",
    "https://images.unsplash.com/photo-1753613648131-f8189bf05bcf?auto=format&fit=crop&fm=jpg&q=90&w=1800",
    "https://images.unsplash.com/photo-1741699427799-3fbb70fce948?auto=format&fit=crop&fm=jpg&q=90&w=1800"
  ];
  function enhance(){
    document.querySelectorAll(".v34-site").forEach(site=>{
      if(site.classList.contains("v36-ready"))return;
      site.classList.add("v36-ready");
      const hero=site.querySelector(".v34-hero");
      if(hero){
        const stage=site.querySelector(".v34-hero-stage");
        if(stage){
          const glow=document.createElement("div");
          glow.className="v36-cursor-glow";
          stage.appendChild(glow);
          stage.addEventListener("pointermove",e=>{
            const r=stage.getBoundingClientRect();
            glow.style.left=((e.clientX-r.left)/r.width*100)+"%";
            glow.style.top=((e.clientY-r.top)/r.height*100)+"%";
          });
        }
        const copy=site.querySelector(".v34-hero-copy");
        if(copy && !copy.querySelector(".v36-scroll")){
          const cue=document.createElement("div");
          cue.className="v36-scroll";
          cue.innerHTML="<span></span><b>SCROLL TO SEE THE SYSTEM</b>";
          copy.appendChild(cue);
        }
      }
      const strip=site.querySelector(".v34-strip");
      if(strip && !strip.querySelector(".v36-stripline")){
        const line=document.createElement("div");
        line.className="v36-stripline";
        line.innerHTML="<span>BUILT FOR REAL STUDY</span><i></i><span>LESS GUESSING</span><i></i><span>MORE EVIDENCE</span><i></i><span>BETTER NEXT STEPS</span>";
        strip.appendChild(line);
      }
      const signal=site.querySelector(".v34-signalboard");
      if(signal && !signal.querySelector(".v36-pulse")){
        const p=document.createElement("div");
        p.className="v36-pulse";
        p.innerHTML="<span></span><b>LIVE LEARNING SIGNAL</b>";
        signal.prepend(p);
      }
      const proof=site.querySelector(".v34-proof");
      if(proof && !proof.querySelector(".v36-proof-tag")){
        const t=document.createElement("div");
        t.className="v36-proof-tag";
        t.textContent="DESIGNED AROUND THE STUDENT, NOT THE DASHBOARD";
        proof.appendChild(t);
      }
      const img=site.querySelector(".v34-photo-main img");
      if(img){
        let i=0;
        const dots=[...site.querySelectorAll(".v35-photo-dot")];
        const change=n=>{
          i=(n+photos.length)%photos.length;
          img.style.opacity=".18";
          img.style.transform="scale(1.045)";
          setTimeout(()=>{img.src=photos[i];img.style.opacity="1";img.style.transform="scale(1)";dots.forEach((d,k)=>d.classList.toggle("active",k===i));},260);
        };
        if(!site._v36Timer&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
          site._v36Timer=setInterval(()=>change(i+1),6200);
        }
      }
      site.querySelectorAll(".v34-tool,.v34-problem-grid article,.v34-signal-card,.v34-next,.v34-sticker").forEach((el,i)=>{
        el.style.setProperty("--v36-delay",Math.min(i*35,280)+"ms");
      });
    });
  }
  const old=window.render;
  if(typeof old==="function")window.render=function(){old();setTimeout(enhance,40)};
  setTimeout(enhance,120);
})();