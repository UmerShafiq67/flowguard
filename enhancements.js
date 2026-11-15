/* StudySprint V3 — product polish + learning analytics + offline/PWA layer. */
(function(){
  const ACTIVITY_KEY="studysprint_activity_v1", MAX_ACTIVITY=365;
  function activity(){try{const x=JSON.parse(localStorage.getItem(ACTIVITY_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
  function saveActivity(x){try{localStorage.setItem(ACTIVITY_KEY,JSON.stringify(x.slice(-MAX_ACTIVITY)))}catch{}}
  function event(type,meta={}){const x=activity();x.push({date:today(),time:new Date().toISOString(),type,...meta});saveActivity(x)}
  function uniqueDays(){return [...new Set(activity().map(x=>x.date).filter(Boolean))].sort()}
  function streak(){
    const days=new Set(uniqueDays()),d=new Date(),tk=today();let c=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    if(!days.has(tk))c.setDate(c.getDate()-1);let n=0;while(days.has(localDate(c))){n++;c.setDate(c.getDate()-1)}return n;
  }
  function stats(){
    const attempts=Number(state.data.practice?.attempts||0),correct=Number(state.data.practice?.correct||0);
    const topics=state.data.subjects.flatMap(s=>(s.topics||[]).map(t=>({...t,subject:s.name})));
    return {attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):0,topics};
  }
  function download(name,text,type="application/json"){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
  function exportStudyData(){
    download("studysprint-backup-"+today()+".json",JSON.stringify({app:"StudySprint",version:3,exportedAt:new Date().toISOString(),data:state.data,activity:activity()},null,2));
    event("export");toast("Backup downloaded.");
  }
  function importStudyData(file){
    if(!file)return;const r=new FileReader();r.onload=()=>{
      try{const p=JSON.parse(String(r.result||"")),incoming=p?.data||p,normalized=normalizeData(incoming);if(!normalized)throw new Error("That is not a valid StudySprint backup.");
        state.data=normalized;if(Array.isArray(p.activity))saveActivity(p.activity);save();state.view="today";render();toast("Backup restored successfully.");event("import");
      }catch(e){toast(e.message||"Backup restore failed.")}
    };r.readAsText(file);
  }
  window.studySprintExport=exportStudyData;
  window.studySprintImport=importStudyData;
  window.studySprintWeakest=function(){
    const t=stats().topics.filter(x=>Number(x.confidence||3)<=2).sort((a,b)=>Number(a.confidence||3)-Number(b.confidence||3))[0];
    if(t&&window.startTopicPractice){startTopicPractice(t.subject,t.name)}else view("today");
  };

  function progressPage(){
    const s=stats(),plan=state.data.plan||[],done=plan.filter(x=>x.done),minutes=Number(state.data.focus?.minutes||0),sessions=Number(state.data.focus?.sessions||0);
    const weak=s.topics.filter(t=>Number(t.confidence||3)<=2),strong=s.topics.filter(t=>Number(t.confidence||3)>=4);
    const due=plan.filter(x=>!x.done&&x.date<=today()).length,coverage=plan.length?Math.round(done.length/plan.length*100):0,days=uniqueDays().length;
    return '<section>'+head("PROGRESS","See the learning, not just the hours.","StudySprint tracks the evidence behind your progress: practice, focus, weak topics, reviews and consistency.",'<button class="btn secondary" onclick="studySprintExport()">Export backup</button>')+
      '<div class="stats"><div><small>STREAK</small><b>'+streak()+'d</b><span>study days in a row</span></div><div><small>ACCURACY</small><b>'+s.accuracy+'%</b><span>'+s.attempts+' practice attempts</span></div><div><small>FOCUS</small><b>'+minutes+'m</b><span>'+sessions+' sessions</span></div><div><small>COVERAGE</small><b>'+coverage+'%</b><span>planned work completed</span></div></div>'+
      '<div class="progress-grid"><div class="card"><div class="cardhead"><div><div class="kicker">LEARNING MAP</div><h2>Topic health</h2><p>Confidence changes when you prove or miss an answer.</p></div></div>'+
      (s.topics.slice().sort((a,b)=>Number(a.confidence||3)-Number(b.confidence||3)).map(t=>'<div class="progress-topic"><div><b>'+esc(t.name)+'</b><small>'+esc(t.subject)+'</small></div><span class="health h'+Number(t.confidence||3)+'">'+(["","Very weak","Weak","Building","Strong","Very strong"][Number(t.confidence||3)]||"Building")+'</span></div>').join("")||'<div class="empty">Add subjects and topics to build your learning map.</div>')+
      '</div><div class="card"><div class="kicker">NEXT MOVES</div><h2>What deserves attention?</h2>'+
      '<div class="smart-metric"><b>'+weak.length+'</b><span>weak topics</span></div><div class="smart-metric"><b>'+due+'</b><span>reviews due</span></div><div class="smart-metric"><b>'+strong.length+'</b><span>strong topics</span></div><div class="smart-metric"><b>'+days+'</b><span>study days recorded</span></div>'+
      '<button class="btn primary wide" onclick="studySprintWeakest()">'+(weak.length?"Practice your weakest topic":"Go to Today")+'</button></div></div>'+
      '<div class="card data-card"><div><div class="kicker">YOUR DATA</div><h2>Portable by default</h2><p>Your plan, progress and mistakes are stored on this device. Export a backup anytime, or restore one on another device.</p></div><div class="data-actions"><button class="btn secondary" onclick="studySprintExport()">Download backup</button><label class="btn secondary file-btn">Restore backup<input type="file" accept="application/json,.json" hidden onchange="studySprintImport(this.files[0])"></label></div></div>'+
      '</section>';
  }
  window.progressPage=progressPage;

  const oldRender=window.render;
  window.render=function(){
    if(state.view==="progress"){const root=document.getElementById("app");if(!root)return;try{root.innerHTML=window.shell(progressPage())}catch(e){console.error(e);state.view="today";oldRender()}return}
    oldRender();
  };

  const oldShell=window.shell;
  window.shell=function(c){
    let base=oldShell(c);
    const marker='<button class="nav '+(state.view==="review"?"active":"")+'" onclick="view(\'review\')"><span>✓</span>Review</button>';
    const progress='<button class="nav '+(state.view==="progress"?"active":"")+'" onclick="view(\'progress\')"><span>◌</span>Progress</button>';
    if(base.includes(marker))base=base.replace(marker,marker+progress);
    return base;
  };

  const oldCheckPractice=window.checkPractice;
  window.checkPractice=async function(){
    const before=Number(state.data.practice?.attempts||0);await oldCheckPractice();
    if(Number(state.data.practice?.attempts||0)>before)event("practice-attempt",{topic:state.currentTask?.topic||""});
  };
  const oldFinish=window.finishCurrentTask;
  window.finishCurrentTask=function(){const topic=state.currentTask?.topic||"";oldFinish();event("session-complete",{topic})};

  function registerPWA(){
    try{
      if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
      const online=()=>document.documentElement.classList.toggle("offline-mode",!navigator.onLine);
      addEventListener("online",online);addEventListener("offline",online);online();
    }catch{}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",registerPWA);else registerPWA();

  document.addEventListener("keydown",e=>{
    if(e.target?.matches?.("input,textarea,select"))return;
    const map={"1":"today","2":"practice","3":"focus","4":"review","5":"tutor","6":"progress"};
    if(map[e.key])view(map[e.key]);
  });
  const stamp="studysprint_open_"+today();if(!sessionStorage.getItem(stamp)){sessionStorage.setItem(stamp,"1");event("open")}

  setTimeout(()=>{
    if(document.querySelector(".install-hint")||!window.matchMedia)return;
    const standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
    if(!standalone&&"serviceWorker" in navigator){
      const target=document.querySelector(".sidefoot");
      if(target){const el=document.createElement("div");el.className="install-hint";el.innerHTML="<b>Install StudySprint</b><span>Add it to your Home Screen for a faster app-like experience.</span>";target.appendChild(el)}
    }
  },900);
  setTimeout(()=>render(),0);
})();