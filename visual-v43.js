/* StudySprint V43 — remove legacy guide/quote UI and enforce clean mount */
(function(){
 function clean(){
  document.querySelectorAll('.page-guide,.v34-guide-line,.page-quote').forEach(e=>e.remove());
  document.querySelectorAll('#app .app-main').forEach(main=>main.classList.add('v43-dark'));
 }
 const old=window.render;
 if(typeof old==='function')window.render=function(){old();requestAnimationFrame(clean)};
 requestAnimationFrame(clean);setTimeout(clean,120);setTimeout(clean,600);
})();
