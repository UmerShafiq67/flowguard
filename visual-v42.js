/* StudySprint V42 — final polish hooks */
(function(){
  function mount(){
    const app=document.querySelector("#app");
    if(!app)return;
    app.classList.add("v42-mounted");
    document.querySelectorAll(".v41-page-visual").forEach((el,i)=>{
      el.dataset.scene=String(i+1).padStart(2,"0");
    });
  }
  const old=window.render;
  if(typeof old==="function"){
    window.render=function(){old();requestAnimationFrame(mount)};
  }
  requestAnimationFrame(mount);
})();
