/* StudySprint V40 — visual storytelling across the full learning journey */
(function(){
  const visuals={
    today:["https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&q=88&w=1200","Your next move","Start with the highest-value action, not the longest list.","https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&q=88&w=900","Make evidence","Practice turns a plan into proof."],
    plan:["https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&fm=jpg&q=88&w=1200","Build the week","A useful plan leaves room for evidence to change it.","https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=jpg&q=88&w=900","Keep it realistic","Small, visible sessions beat an impossible calendar."],
    subjects:["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=88&w=1200","Know the landscape","Every subject becomes easier to act on when its weak points are visible.","https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&fm=jpg&q=88&w=900","One topic at a time","Turn a broad subject into concrete retrieval targets."],
    session:["https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&fm=jpg&q=88&w=1200","Protect the session","Remove decisions from the moment you need to focus.","https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&fm=jpg&q=88&w=900","Then prove it","Finish with a signal the system can learn from."],
    practice:["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&fm=jpg&q=88&w=1200","Retrieve, don't reread","The answer you produce is more useful than the page you just scanned.","https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&fm=jpg&q=88&w=900","Use mistakes","A wrong answer is a precise place to improve."],
    tutor:["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=88&w=1200","Ask with purpose","Use the tutor to remove a specific block, then return to retrieval.","https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&fm=jpg&q=88&w=900","Explain it back","Understanding becomes stronger when you can teach the idea."],
    review:["https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&fm=jpg&q=88&w=1200","Return at the right time","Review is about timing, not endlessly repeating everything.","https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&fm=jpg&q=88&w=900","Close the gap","Bring the weakest evidence back into the loop."],
    progress:["https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&fm=jpg&q=88&w=1200","Measure what changed","Progress is strongest when it reflects actual retrieval and fewer mistakes.","https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&fm=jpg&q=88&w=900","Look for the signal","Use trends to decide what deserves attention next."],
    focus:["https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&fm=jpg&q=88&w=1200","Make focus visible","Give one block one job, then let the timer protect it.","https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&fm=jpg&q=88&w=900","Finish cleanly","A short, completed session is evidence of consistency."],
    account:["https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&fm=jpg&q=88&w=1200","Keep the system simple","Your account should support studying, not become another thing to manage.","https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&fm=jpg&q=88&w=900","Ready when you are","Good defaults keep the learning loop moving."]
  };
  function viewFromMain(main){
    const c=main.className||"";
    const m=c.match(/view-([a-z-]+)/);
    if(m&&visuals[m[1]])return m[1];
    const h=(main.querySelector(".head h1")?.textContent||"").toLowerCase();
    if(h.includes("plan"))return"plan"; if(h.includes("subject"))return"subjects"; if(h.includes("session"))return"session";
    if(h.includes("practice"))return"practice"; if(h.includes("tutor"))return"tutor"; if(h.includes("review"))return"review";
    if(h.includes("progress"))return"progress"; if(h.includes("focus"))return"focus"; if(h.includes("account"))return"account";
    return"today";
  }
  function addVisual(){
    const main=document.querySelector("#app .app-main");
    if(!main||main.querySelector(".v40-visual"))return;
    const head=main.querySelector(".head");
    if(!head)return;
    const key=viewFromMain(main),v=visuals[key]||visuals.today;
    const section=document.createElement("section");
    section.className="v40-visual";
    section.setAttribute("aria-label","StudySprint visual learning cue");
    section.innerHTML='<figure class="v40-visual-main"><img src="'+v[0]+'" alt="'+v[1]+'" loading="lazy"><figcaption class="v40-visual-copy"><small>STUDYSPRINT · '+key.toUpperCase()+'</small><b>'+v[1]+'</b><span>'+v[2]+'</span></figcaption></figure><figure class="v40-visual-side"><img src="'+v[3]+'" alt="'+v[4]+'" loading="lazy"><figcaption class="v40-visual-copy"><small>THE NEXT SIGNAL</small><b>'+v[4]+'</b><span>'+v[5]+'</span></figcaption></figure>';
    head.insertAdjacentElement("afterend",section);
  }
  function mount(){setTimeout(addVisual,35)}
  const old=window.render;
  if(typeof old==="function")window.render=function(){old();mount()};
  mount();
})();
