/* StudySprint V37 — in-product polish */
(function(){
  function polish(){
    const app=document.getElementById("app");
    if(!app||app.dataset.v37)return;
    app.dataset.v37="1";
    const main=app.querySelector(".app-main");
    if(main){
      main.classList.add("v37-main-enter");
      requestAnimationFrame(()=>main.classList.add("v37-main-visible"));
    }
    app.querySelectorAll(".btn,.nav,.utility-link,.ghost,.textbtn").forEach(btn=>{
      if(btn.dataset.v37)return;
      btn.dataset.v37="1";
      btn.addEventListener("pointerdown",()=>btn.classList.add("v37-pressed"));
      btn.addEventListener("pointerup",()=>btn.classList.remove("v37-pressed"));
      btn.addEventListener("pointercancel",()=>btn.classList.remove("v37-pressed"));
      btn.addEventListener("pointerleave",()=>btn.classList.remove("v37-pressed"));
    });
    const bar=app.querySelector(".appbar");
    if(bar&&!bar.querySelector(".v37-status")){
      const status=document.createElement("span");
      status.className="v37-status";
      status.innerHTML='<i></i><b>ADAPTIVE ENGINE</b><span>LIVE</span>';
      const right=bar.querySelector(".topright");
      if(right)right.prepend(status);
    }
    const today=app.querySelector(".command");
    if(today&&!today.querySelector(".v37-evidence-note")){
      const signal=today.querySelector(".signal-panel");
      if(signal){
        const note=document.createElement("div");
        note.className="v37-evidence-note";
        note.innerHTML="<span>HOW IT ADAPTS</span><b>Your next move changes when your evidence changes.</b>";
        signal.appendChild(note);
      }
    }
    app.querySelectorAll(".card,.hero-action,.signal-panel,.next-panel,.timeline-panel,.reviewgrid,.practice-subject").forEach((el,i)=>{
      if(el.dataset.v37)return;
      el.dataset.v37="1";
      el.style.setProperty("--v37-delay",Math.min(i*25,220)+"ms");
      el.classList.add("v37-card-in");
    });
  }
  const old=window.render;
  if(typeof old==="function")window.render=function(){old();setTimeout(polish,20)};
  setTimeout(polish,80);
})();