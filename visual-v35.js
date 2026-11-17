/* StudySprint V35 — subtle motion and hero storytelling */
(function(){
 const photos=[
  "https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&q=90&w=1800",
  "https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&q=90&w=1800",
  "https://images.unsplash.com/photo-1753613648131-f8189bf05bcf?auto=format&fit=crop&fm=jpg&q=90&w=1800"
 ];
 const original=window.onboardingPage;
 if(typeof original!=="function")return;
 window.onboardingPage=function(){
   const html=original();
   return html.replace('<div class="v34-photo-main"><img src="'+photos[0]+'" alt="Student studying at a laptop"></div>','<div class="v34-photo-main"><img src="'+photos[0]+'" alt="Student studying"><div class="v35-photo-dots" aria-label="StudySprint visual highlights"><button class="v35-photo-dot active" aria-label="Show study image 1"></button><button class="v35-photo-dot" aria-label="Show study image 2"></button><button class="v35-photo-dot" aria-label="Show study image 3"></button></div></div>');
 };
 function mount(){
   document.querySelectorAll(".v34-site").forEach(site=>{
     if(site.classList.contains("v35-ready"))return;
     site.classList.add("v35-ready");
     const img=site.querySelector(".v34-photo-main img"),dots=[...site.querySelectorAll(".v35-photo-dot")];
     let index=0,timer=0;
     const show=n=>{
       index=(n+photos.length)%photos.length;
       if(!img)return;
       site.querySelector(".v34-photo-main")?.classList.add("v35-changing");
       setTimeout(()=>{
         img.src=photos[index];
         site.querySelector(".v34-photo-main")?.classList.remove("v35-changing");
         dots.forEach((d,i)=>d.classList.toggle("active",i===index));
       },240);
     };
     dots.forEach((d,i)=>d.addEventListener("click",()=>{show(i);reset()}));
     const reset=()=>{clearInterval(timer);if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)timer=setInterval(()=>show(index+1),5600)};
     reset();
     const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting&&e.target.classList.add("v35-in")),{threshold:.12});
     site.querySelectorAll("section:not(.v34-hero)").forEach((el,i)=>{el.classList.add("v35-reveal");el.style.transitionDelay=Math.min(i*45,300)+"ms";observer.observe(el)});
     const stage=site.querySelector(".v34-hero-stage");
     if(stage&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
       stage.addEventListener("pointermove",e=>{
         const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
         stage.style.setProperty("--mx",(x*10).toFixed(2)+"px");stage.style.setProperty("--my",(y*8).toFixed(2)+"px");
       });
       stage.addEventListener("pointerleave",()=>{stage.style.setProperty("--mx","0px");stage.style.setProperty("--my","0px")});
       stage.style.setProperty("--mx","0px");stage.style.setProperty("--my","0px");
       const photo=site.querySelector(".v34-photo-main"); if(photo)photo.style.transform="rotate(2deg) translate3d(var(--mx),var(--my),0)";
     }
   });
 }
 const prevRender=window.render;
 if(typeof prevRender==="function"){
   window.render=function(){prevRender();setTimeout(mount,30)};
 }
 setTimeout(mount,90);
})();
