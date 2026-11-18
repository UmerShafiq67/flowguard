/* StudySprint V39 — readability, page context and richer visual storytelling */
(function(){
  const scenes=[
    ["https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&q=88&w=1200","Focused study","A quiet place to turn a small block of time into real progress."],
    ["https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&q=88&w=1200","Active recall","Practice is where understanding becomes evidence."],
    ["https://images.unsplash.com/photo-1753613648131-f8189bf05bcf?auto=format&fit=crop&fm=jpg&q=88&w=1200","Review with intent","Return to the right idea at the right time."]
  ];
  const copy={
    today:["A good study session starts with knowing what matters next.","See the signal, choose the move, and make the next few minutes count."],
    plan:["Turn a busy week into a path you can actually follow.","Your plan should respond to what you learn, not just fill a calendar."],
    subjects:["Clarity begins when every subject has a next move.","Keep the important topics visible, measurable, and ready for practice."],
    session:["One focused session can change the shape of a whole week.","Start with one useful action, then let the evidence guide what comes after."],
    practice:["Confidence grows when you retrieve, not when you reread.","Every answer gives the system another signal about what you know."],
    tutor:["The right explanation is the one that makes the next question easier.","Ask, connect the idea, then prove it with a little practice."],
    review:["Memory gets stronger when you return at the right moment.","Review the things that still need you, before they become last-minute problems."],
    progress:["Progress is evidence of what you can now do.","Look for stronger retrieval, fewer mistakes, and better confidence over time."],
    focus:["Protect a small block of time, then make it count.","A focused 15 minutes is more useful than an hour spent deciding what to do."],
    account:["Keep the system simple enough to keep using.","Your settings should support the learning loop, not become another task."]
  };
  function addContext(){
    const app=document.getElementById("app");
    if(!app)return;
    const head=app.querySelector(".app-main .head");
    if(head&&!head.querySelector(".v39-headline-line")){
      const view=window.state?.view||document.body.dataset.view||"today";
      const pair=copy[view]||copy.today;
      const line=document.createElement("p");
      line.className="v39-headline-line";
      line.textContent=pair[0];
      line.setAttribute("aria-label","Page guiding line");
      head.appendChild(line);
    }
    addScene(app);
  }
  function addScene(app){
    const main=app.querySelector(".app-main");
    if(!main||main.querySelector(".v39-scene"))return;
    const view=window.state?.view||"today";
    if(!["today","practice","tutor","review"].includes(view))return;
    const anchor=main.querySelector(".command-grid,.practicegrid,.tutorgrid,.reviewgrid,.today-pack-panel");
    if(!anchor)return;
    const section=document.createElement("section");
    section.className="v39-scene";
    section.innerHTML='<div class="v39-scene-copy"><span class="v39-scene-kicker">A BETTER STUDY RHYTHM</span><h2>'+copy[view][1]+'</h2><p>StudySprint connects learning, practice and review so each action has a reason.</p></div><div class="v39-scene-grid">'+scenes.map((s,i)=>'<figure class="v39-scene-card"><img src="'+s[0]+'" alt="'+s[1]+'" loading="lazy"><figcaption><b>'+s[1]+'</b><span>'+s[2]+'</span></figcaption></figure>').join("")+'</div>';
    anchor.insertAdjacentElement("afterend",section);
  }
  function mount(){setTimeout(addContext,20)}
  const old=window.render;
  if(typeof old==="function")window.render=function(){old();mount()};
  mount();
  window.addEventListener("resize",()=>{});
})();