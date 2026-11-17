const STORAGE_KEY="studysprint_v2";
const BACKUP_KEY="studysprint_v2_backup";
const DATA_VERSION=2;
const API_BASE=window.STUDYSPRINT_API_BASE||"";
const emptyData=()=>({subjects:[],exams:[],availableMinutes:90,plan:[],focus:{sessions:0,minutes:0},mistakes:[],practice:{attempts:0,correct:0},meta:{lastModified:new Date().toISOString()}});
const state={view:"today",modal:false,data:load(),toast:"",currentTask:null,tutorMode:"Explain simply",tutorQuiz:{question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:false,history:[]},practice:{question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:false,history:[]}};
function normalizeData(x){const base=emptyData();if(!x||typeof x!=="object"||!Array.isArray(x.subjects))return null;const data={...base,...x};data.subjects=data.subjects.map((s,i)=>({...s,id:s.id||"subject-"+i,name:String(s.name||"Subject "+(i+1)),topics:Array.isArray(s.topics)?s.topics.map((t,j)=>({...t,id:t.id||"topic-"+i+"-"+j,name:String(t.name||"Topic "+(j+1)),confidence:Math.max(1,Math.min(5,Number(t.confidence||3))),minutes:Math.max(15,Math.min(180,Number(t.minutes||30)))})):[]}));data.exams=Array.isArray(data.exams)?data.exams.filter(e=>e&&e.subjectId):[];data.plan=Array.isArray(data.plan)?data.plan.filter(x=>x&&x.subject&&x.topic&&x.date).map(x=>({...x,subject:String(x.subject),topic:String(x.topic),date:String(x.date),minutes:Math.max(15,Math.min(180,Number(x.minutes||30))),priority:Number(x.priority||50),done:Boolean(x.done)})):[];data.mistakes=Array.isArray(data.mistakes)?data.mistakes.filter(x=>x&&x.topic&&x.subject):[];data.focus={sessions:0,minutes:0,...(data.focus||{})};data.practice={attempts:0,correct:0,evidence:[],...(data.practice||{})};data.practice.evidence=Array.isArray(data.practice.evidence)?data.practice.evidence.slice(-200):[];data.availableMinutes=Math.max(20,Math.min(600,Number(data.availableMinutes||90)));data.meta={lastModified:data.meta?.lastModified||new Date().toISOString()};data.version=DATA_VERSION;return data}
function load(){const base=emptyData();try{const primary=JSON.parse(localStorage.getItem(STORAGE_KEY));const normalized=normalizeData(primary);if(normalized)return normalized;const backup=JSON.parse(localStorage.getItem(BACKUP_KEY));const recovered=normalizeData(backup);if(recovered){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(recovered))}catch{};return recovered}return base}catch{try{const backup=normalizeData(JSON.parse(localStorage.getItem(BACKUP_KEY)));if(backup)return backup}catch{}return base}}
function add(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return localDate(x)}
function today(){const n=new Date();return localDate(n)}
function localDate(n){return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`}
function date(s){return new Date(s+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"})}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function save(){state.data.meta=state.data.meta||{};state.data.meta.lastModified=new Date().toISOString();const payload=JSON.stringify({...state.data,version:DATA_VERSION});try{localStorage.setItem(BACKUP_KEY,payload);localStorage.setItem(STORAGE_KEY,payload);window.studySprintQueueSync?.()}catch(e){console.error("StudySprint save failed",e)}}
function formatPracticeQuestion(text){
  const raw=String(text||"").trim();
  return esc(raw)
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/__(.+?)__/g,"<u>$1</u>")
    .replace(/\n/g,"<br>");
}
function practiceFeedback(text){
  const raw=String(text||"").replace(/^RESULT:\s*(CORRECT|NEEDS WORK)\s*/i,"").trim();
  return formatTutorText(raw);
}
function practiceResult(text){
  if(/RESULT:\s*NEEDS WORK/i.test(text))return "wrong";
  if(/RESULT:\s*CORRECT/i.test(text))return "correct";
  return "";
}
function nav(v,t,i){return `<button class="nav ${state.view===v?"active":""}" onclick="view('${v}')"><span>${i}</span>${t}</button>`}
function shell(c){
  const desktopNav=[["today","Today"],["plan","My plan"],["practice","Practice"],["tutor","Tutor"],["review","Review"],["progress","Progress"]];
  const mobileNav=[["today","Today","⌂"],["plan","Plan","◷"],["practice","Practice","✎"],["tutor","Tutor","✦"],["review","Review","✓"],["progress","Progress","◌"]];
  return '<header class="appbar">'+
    '<button class="brand" onclick="view(\'today\')" aria-label="StudySprint home"><span class="logo">S</span><span class="brand-copy"><b>StudySprint</b><small>adaptive learning</small></span></button>'+
    '<nav class="desktop-nav" aria-label="StudySprint pages">'+desktopNav.map(([v,t])=>nav(v,t,"")).join("")+'</nav>'+
    '<div class="topright"><button class="utility-link" onclick="view(\'subjects\')">Subjects</button><button class="utility-link" onclick="view(\'account\')">Account</button><span class="saved"><i></i> Saved</span><button class="ghost plus-link" onclick="openPremium()">Plus</button><button class="ghost edit-plan" onclick="openSetup()">Edit plan</button></div>'+
  '</header>'+
  '<main class="app-main view-'+state.view+'">'+c+'</main>'+
  '<nav class="mobile-nav" aria-label="StudySprint pages">'+mobileNav.map(([v,t,i])=>nav(v,t,i)).join("")+'</nav>'+
  '<footer class="site-footer"><span>StudySprint · Decide → learn → prove → review → adapt.</span><nav aria-label="Legal"><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer>'+
  '<div class="toast '+(state.toast?"show":"")+'">'+esc(state.toast)+'</div>'+ (state.modal?setup():"");
}
function pageHint(title,text,action=""){return '<div class="pagehint"><b>'+esc(title)+'</b><span>'+esc(text)+'</span>'+(action||'')+'</div>'}
function head(k,t,p,a=""){
  return '<div class="head"><div><div class="kicker">'+esc(k)+'</div><h1>'+t+'</h1><p>'+p+'</p></div>'+(a||"")+'</div>';
}
function onboardingPage(){
  return '<section class="landing">'+
    '<header class="landingbar"><button class="landingbrand" onclick="view(\'today\')"><span class="landinglogo">S</span><span><b>StudySprint</b><small>adaptive learning</small></span></button><div class="landingmeta"><span>LEARNING SYSTEM · 01</span><button class="landinglink" onclick="openSetup()">Get started <b>↗</b></button></div></header>'+
    '<div class="landinghero">'+
      '<div class="landingeyebrow"><i></i> PERSONAL STUDY INTELLIGENCE <span>BUILT AROUND EVIDENCE</span></div>'+
      '<h1>Your study plan should<br><em>think with you.</em></h1>'+
      '<p>StudySprint connects what you need to learn, how confident you are, when your exams arrive, and what you can actually prove — then chooses the next useful step.</p>'+
      '<div class="landingactions"><button class="btn primary" onclick="openSetup()">Build my study system <span>↗</span></button><span>No complicated setup. Start free. Your data stays yours.</span></div>'+
    '</div>'+
    '<div class="landingrail"><div><small>01</small><b>DECIDE</b><span>Turn subjects, confidence and deadlines into a realistic roadmap.</span></div><div><small>02</small><b>PROVE</b><span>Practice answers become evidence of what you actually know.</span></div><div><small>03</small><b>ADAPT</b><span>The next session changes when your learning signal changes.</span></div></div>'+
    '<div class="landingbottom"><span>PLAN</span><i>→</i><span>LEARN</span><i>→</i><span>PROVE</span><i>→</i><span>REVIEW</span><i>→</i><span>ADAPT</span><b>01—05</b></div>'+
  '</section>';
}
function learningSignal(){
  const topics=state.data.subjects.flatMap(s=>(s.topics||[]).map(t=>({...t,subject:s.name})));
  const attempts=Number(state.data.practice.attempts||0),correct=Number(state.data.practice.correct||0);
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  const weak=topics.filter(t=>Number(t.confidence||3)<=2).sort((a,b)=>Number(a.confidence||3)-Number(b.confidence||3))[0];
  const strong=topics.filter(t=>Number(t.confidence||3)>=4).length;
  return {topics,attempts,correct,accuracy,weak,strong};
}
function taskReason(x){
  const topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===x.topic);
  const confidence=Number(topic?.confidence||x.confidence||3);
  const days=Math.max(1,StudySprintCore.daysUntil(x.examDate));
  if(confidence<=2)return "This topic is marked weak, so StudySprint is bringing it forward for extra practice.";
  if(days<=3)return "Your exam is close, so this topic gets priority even if your confidence looks okay.";
  if(confidence===3)return "This topic is still developing. A short learn → recall → practice loop should strengthen it.";
  return "This keeps a stronger topic active so you do not lose it after learning it once.";
}
function pageQuote(text,source="StudySprint"){return '<div class="page-quote"><span>“</span><p>'+esc(text)+'</p><small>— '+esc(source)+'</small></div>';}
function todayPage(){
  const ready=state.data.subjects.length&&state.data.plan.length;
  if(!ready)return onboardingPage();
  const evidence={mistakes:state.data.mistakes,evidence:state.data.practice.evidence};
  const tasks=state.data.plan.filter(x=>x.date===today()),
    next=state.data.plan.filter(x=>!x.done&&x.date>=today()).sort((a,b)=>StudySprintCore.adaptiveScore(b,evidence)-StudySprintCore.adaptiveScore(a,evidence)).slice(0,5),
    ex=state.data.exams.filter(e=>e&&e.date).map(e=>({...e,days:StudySprintCore.daysUntil(e.date)})).sort((a,b)=>a.days-b.days),
    signal=learningSignal();
  const todayMinutes=tasks.reduce((a,x)=>a+Number(x.minutes||0),0);
  const completedMinutes=tasks.filter(x=>x.done).reduce((a,x)=>a+Number(x.minutes||0),0);
  const progress=todayMinutes?Math.min(100,Math.round(completedMinutes/todayMinutes*100)):0;
  const remaining=Math.max(0,todayMinutes-completedMinutes);
  const nextTask=tasks.find(x=>!x.done)||next[0];
  const reason=nextTask?taskReason(nextTask):"You have no unfinished sessions right now.";
  const examLabel=nextTask&&nextTask.examDate?(()=>{const d=StudySprintCore.daysUntil(nextTask.examDate);return d<0?Math.abs(d)+"d since exam":d===0?"Exam today":d+"d to exam"})():"No exam date";
  return '<section class="command">'+
    head("TODAY","Your next move is already chosen.","StudySprint turns your deadlines, confidence and practice evidence into one focused action.",'<button class="btn secondary" onclick="openSetup()">Edit plan</button>')+
    '<div class="command-grid">'+
      '<div class="hero-action">'+
        '<div class="hero-top"><span class="eyebrow">RECOMMENDED NEXT</span><span class="live-dot">LIVE</span></div>'+
        (nextTask?
          '<div class="hero-subject">'+esc(nextTask.subject)+'</div><h2>'+esc(nextTask.topic)+'</h2><p>'+esc(reason)+'</p>'+
          '<div class="hero-meta"><span>'+nextTask.minutes+' min</span><span>'+esc(examLabel)+'</span><span>'+esc(nextTask.done?"Complete":"Unfinished")+'</span></div>'+
          '<div class="hero-actions"><button class="btn primary" onclick="startTask(\''+nextTask.id+'\',\''+nextTask.date+'\')">Start this session <span>→</span></button><button class="btn textbtn" onclick="view(\'practice\')">Practice instead</button></div>'
        :
          '<div class="hero-subject">ALL CAUGHT UP</div><h2>Your plan is clear.</h2><p>Rebuild your schedule if your available time or exam dates changed.</p><div class="hero-actions"><button class="btn primary" onclick="regen()">Rebuild my plan <span>→</span></button></div>')+
      '</div>'+
      '<aside class="signal-panel">'+
        '<div class="signal-head"><span class="eyebrow">LEARNING SIGNAL</span><span>'+signal.accuracy+'%</span></div>'+
        '<div class="signal-number">'+(signal.topics.length?signal.accuracy+"%":"—")+'</div>'+
        '<p>'+ (signal.attempts?signal.correct+" correct from "+signal.attempts+" practice attempts.":"Practice creates the evidence StudySprint uses to adapt your plan.")+'</p>'+
        '<div class="signal-row"><span>Weak topics</span><b>'+signal.topics.filter(t=>Number(t.confidence||3)<=2).length+'</b></div>'+
        '<div class="signal-row"><span>Reviews due</span><b>'+state.data.plan.filter(x=>x.kind==="review"&&!x.done&&x.date<=today()).length+'</b></div>'+
        '<div class="signal-row"><span>Today left</span><b>'+remaining+'m</b></div>'+
      '</aside>'+
    '</div>'+
    '<div class="command-strip">'+
      '<div><span>DAY PROGRESS</span><b>'+progress+'%</b><i><em style="width:'+progress+'%"></em></i></div>'+
      '<div><span>NEXT EXAM</span><b>'+(ex[0]?(ex[0].days<0?Math.abs(ex[0].days)+"d ago":ex[0].days===0?"Today":ex[0].days+"d"):"—")+'</b><small>'+(ex[0]?esc(ex[0].name):"Add an exam date")+'</small></div>'+
      '<div><span>FOCUS TIME</span><b>'+Number(state.data.focus.minutes||0)+'m</b><small>'+Number(state.data.focus.sessions||0)+' sessions</small></div>'+
      '<div><span>WEAK TOPIC</span><b>'+(signal.weak?esc(signal.weak.name):"None flagged")+'</b><small>'+(signal.weak?"Needs another retrieval":"Keep building evidence")+'</small></div>'+
    '</div>'+
    '<div class="today-visual-story"><div class="today-visual-copy"><span class="eyebrow">THE STUDYSPRINT METHOD</span><h2>Turn a study session into <em>evidence.</em></h2><p>Plan the move, do the work, prove what you know, then let the system decide what deserves attention next.</p><div class="today-visual-steps"><span><b>01</b>Plan</span><span><b>02</b>Practice</span><span><b>03</b>Adapt</span></div></div><div class="today-visual-art"><img src="./assets/adaptive-network.svg" alt="StudySprint adaptive learning network"><div class="today-visual-badge"><i></i><span>LEARNING SIGNAL</span><b>Updating after practice</b></div></div></div>'+
    pageQuote("You do not rise to the level of your goals. You fall to the level of your systems.","James Clear")+'<div class="today-lower">'+
      '<div class="timeline-panel"><div class="section-title"><div><span class="eyebrow">TODAY</span><h2>Your study queue</h2></div><button class="text" onclick="view(\'plan\')">View full plan →</button></div>'+
      (tasks.map(task).join("")||'<div class="empty">No sessions scheduled today. <button class="text" onclick="regen()">Rebuild the plan →</button></div>')+
      '</div>'+
      '<div class="next-panel"><div class="section-title"><div><span class="eyebrow">UP NEXT</span><h2>Keep moving</h2></div></div>'+
      (next.map(x=>'<button class="next-item" onclick="startTask(\''+x.id+'\',\''+x.date+'\')"><span class="next-index">→</span><span><b>'+esc(x.topic)+'</b><small>'+esc(x.subject)+' · '+date(x.date)+' · '+x.minutes+'m</small></span></button>').join("")||'<div class="empty">Nothing waiting.</div>')+
      '</div>'+
    '</div>'+
  '</section>'+pageQuote("The expert in anything was once a beginner.","Helen Hayes");

}
function task(x){const examDays=typeof StudySprintCore!=="undefined"&&x.examDate?StudySprintCore.daysUntil(x.examDate):null;const examLabel=examDays===null?"exam date not set":examDays<0?Math.abs(examDays)+"d since exam":examDays===0?"exam today":examDays===1?"exam tomorrow":examDays+"d to exam";return `<div class="task ${x.done?"done":""}"><button class="check" onclick="toggle('${x.id}','${x.date}')" aria-label="${x.done?"Mark incomplete":"Mark complete"}">${x.done?"✓":""}</button><div class="grow"><small>${esc(x.subject)}</small><b>${esc(x.topic)}</b><span>${x.minutes} min · ${examLabel}</span></div><button class="btn small" onclick="startTask('${x.id}','${x.date}')">${x.done?"Review":"Start"}</button></div>`}
function planPage(){const groups={};state.data.plan.forEach(x=>(groups[x.date]??=[]).push(x));return `<section>${head("PLAN","Your roadmap.","Today tells you what to do. Plan lets you inspect the full schedule and rebuild it when your inputs change.",`<button class="btn secondary" onclick="regen()">Rebuild plan</button>`)}<div class="days">${Object.keys(groups).sort().map(d=>`<div class="day card"><div class="dayhead"><b>${d===today()?"Today":date(d)}</b><span>${groups[d].reduce((a,x)=>a+x.minutes,0)} min</span></div>${groups[d].map(task).join("")}</div>`).join("")}</div></section>`}
function subjectsPage(){
  const subjects=state.data.subjects.filter(s=>s&&s.name);
  return '<section>'+head("SUBJECTS","Your learning map.","Confidence is a starting signal. Practice evidence is what proves whether a topic is getting stronger.",'<button class="btn primary" onclick="openSetup()">Edit subjects</button>')+
    (subjects.length?'<div class="subjectgrid">'+subjects.map(s=>{
      const topics=(s.topics||[]).filter(t=>t&&t.name);
      return '<div class="card"><div class="subject"><span>'+esc(s.name[0]||"S")+'</span><div><h2>'+esc(s.name)+'</h2><small>'+topics.length+' topic'+(topics.length===1?"":"s")+'</small></div></div>'+
      (topics.map(t=>'<div class="topic"><span>'+esc(t.name)+'</span><b class="c'+Number(t.confidence||3)+'">'+Number(t.confidence||3)+"/5 · "+(["","Very weak","Weak","Okay","Good","Strong"][Number(t.confidence||3)]||"Okay")+'</b></div>').join("")||'<div class="empty">No topics yet.</div>')+
      '</div>';
    }).join("")+'</div>':'<div class="card empty">No subjects yet. <button class="btn primary" onclick="openSetup()">Add your first subject</button></div>')+
    '</section>';
}

let seconds=1500,timer=null,selectedMinutes=25;
function sessionPage(){const x=state.currentTask;if(!x)return '<section>'+head("SESSION","Choose what you need.","Pick a learning action and StudySprint will take you there.")+'<div class="card"><button class="btn primary" onclick="view(\'today\')">Back to today</button></div></section>';return '<section>'+head("NEXT SESSION","Study "+esc(x.topic),"This is what StudySprint wants you to work on now: "+esc(x.subject)+" · "+x.minutes+" minutes · exam "+date(x.examDate),'<button class="btn secondary" onclick="view(\'today\')">Back to today</button>')+'<div class="sessiongrid"><div class="card sessionmain"><div class="sessionlabel">YOUR GOAL</div><h2>Understand '+esc(x.topic)+', then prove you can use it.</h2><p>Do not just watch the clock. First learn the idea, then retrieve it, then practise it.</p><div class="sessionactions"><button class="btn primary" onclick="tutorForTask(\'Explain simply\')">Teach me '+esc(x.topic)+'</button><button class="btn secondary" onclick="tutorForTask(\'Practice\')">Practice '+esc(x.topic)+'</button><button class="btn secondary" onclick="tutorForTask(\'Quiz me\')">Quiz me on '+esc(x.topic)+'</button><button class="btn secondary" onclick="startFocusForTask()">Start '+x.minutes+' min focus</button></div></div><div class="card"><h2>What counts as done?</h2><div class="rule"><b>1. Learn</b><span>Get a clear explanation or use your own notes.</span></div><div class="rule"><b>2. Recall</b><span>Explain the idea without looking.</span></div><div class="rule"><b>3. Practise</b><span>Answer questions or solve a problem.</span></div><div class="rule"><b>4. Finish</b><span>Mark the session complete when you can use the idea.</span></div><button class="btn primary wide" onclick="finishCurrentTask()">Mark session complete</button></div></div></section>'}
function progressPage(){
 const topics=state.data.subjects.flatMap(s=>(s.topics||[]).map(t=>({...t,subject:s.name})));
 const attempts=Number(state.data.practice.attempts||0),correct=Number(state.data.practice.correct||0);
 const accuracy=attempts?Math.round(correct/attempts*100):0;
 const completed=state.data.plan.filter(x=>x.done);
 const totalMinutes=state.data.plan.reduce((n,x)=>n+Number(x.minutes||0),0),doneMinutes=completed.reduce((n,x)=>n+Number(x.minutes||0),0);
 const coverage=totalMinutes?Math.round(doneMinutes/totalMinutes*100):0;
 const avgConfidence=topics.length?Math.round(topics.reduce((n,t)=>n+Number(t.confidence||3),0)/topics.length*20):0;
 const weak=topics.filter(t=>Number(t.confidence||3)<=2);
 const readiness=typeof readinessPlus==="function"?readinessPlus().score:Math.round(avgConfidence*.4+accuracy*.35+coverage*.25);
 return '<section>'+head("PROGRESS","See your learning, not just your time.","Progress answers one question: is your knowledge getting stronger? Time helps, but practice evidence is the main signal.")+
 '<div class="stats"><div><small>Readiness</small><b>'+readiness+'%</b><span>learning signal</span></div><div><small>Accuracy</small><b>'+accuracy+'%</b><span>'+attempts+' practice attempt'+(attempts===1?'':'s')+'</span></div><div><small>Plan coverage</small><b>'+coverage+'%</b><span>planned work completed</span></div><div><small>Focus</small><b>'+Number(state.data.focus.minutes||0)+' min</b><span>'+Number(state.data.focus.sessions||0)+' session'+(Number(state.data.focus.sessions||0)===1?'':'s')+'</span></div></div>'+
 '<div class="progressgrid"><div class="card"><div class="cardhead"><div><h2>Topic health</h2><p>Confidence is shown on a simple 1–5 scale.</p></div><button class="btn secondary small" onclick="view(\'subjects\')">Subjects</button></div>'+
 (topics.map(t=>'<div class="progress-topic"><div><b>'+esc(t.name)+'</b><small>'+esc(t.subject)+' · '+topicInsight(t)+'</small></div><strong>'+Number(t.confidence||3)+'/5</strong><i><em style="width:'+Math.max(20,Number(t.confidence||3)*20)+'%"></em></i></div>').join('')||'<div class="empty">Add a subject and topic to start tracking learning.</div>')+
 '</div><div class="stack"><div class="card"><h2>What each number means</h2><div class="rule"><b>Readiness</b><span>Overall signal from confidence, practice, coverage and review health.</span></div><div class="rule"><b>Accuracy</b><span>How often your checked answers are correct.</span></div><div class="rule"><b>Plan coverage</b><span>How much of the scheduled work you have completed.</span></div><div class="rule"><b>Focus</b><span>Optional timer time. It supports studying but does not prove learning.</span></div></div><div class="card"><h2>Needs attention</h2><p class="muted">'+(weak.length?weak.map(t=>esc(t.name)).join(', '):'No weak topics flagged yet.')+'</p><button class="btn primary wide" onclick="view(\'practice\')">Practice now</button></div></div></div>'+
 '</section>';
}
function focusPage(){
 const x=state.currentTask,m=selectedMinutes;
 return `<section>${head("FOCUS",x?"Focus on "+esc(x.topic):"Focus mode.",x?"A distraction-free "+m+"-minute session for "+esc(x.subject)+".":"Use Focus when you want a clean timer without leaving your study plan.")}<div class="focusgrid"><div class="card center">`+
 (x?`<div class="focus-context"><span class="pill">${esc(x.subject)}</span><b>${esc(x.topic)}</b><small>${x.minutes} minutes planned</small></div>`:"")+
 `<div class="clock" id="clock">${Math.floor(seconds/60).toString().padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}</div><div class="choices"><button onclick="timerSet(25)" class="choice ${m===25?"active":""}">25m</button><button onclick="timerSet(45)" class="choice ${m===45?"active":""}">45m</button><button onclick="timerSet(60)" class="choice ${m===60?"active":""}">60m</button></div><button class="btn primary wide" id="timerbtn" onclick="timerToggle()">Start focus</button></div><div class="card"><h2>What to do</h2><div class="rule"><b>1. Recall</b><span>Say what you already know before checking notes.</span></div><div class="rule"><b>2. Learn</b><span>Study one small idea at a time.</span></div><div class="rule"><b>3. Practise</b><span>Use Practice or AI Tutor to test yourself.</span></div><div class="rule"><b>4. Finish</b><span>When the timer ends, the active plan session is marked done.</span></div><div class="focusstat"><b>${state.data.focus.sessions}</b><span>sessions</span><b>${state.data.focus.minutes}</b><span>minutes</span></div></div></div></section>`;
}
function tutorPage(){
 const mode=state.tutorMode||"Explain simply",q=state.tutorQuiz||{};
 const quiz=mode==="Quiz me"?`<div class="tutor-quiz-card"><div class="tutor-quiz-head"><div><span class="pill">QUIZ</span><span class="practice-topic-label">${state.currentTask?esc(state.currentTask.topic):"Study quiz"}</span></div><span class="tutor-quiz-step">Answer here</span></div><div class="tutor-quiz-question">${q.busy&&q.question?'<span class="muted">Checking your answer…</span>':q.busy?'<span class="muted">Creating your question…</span>':q.question?formatPracticeQuestion(q.question):'<span class="muted">Your quiz question will appear here.</span>'}</div>${q.options?.length?`<div class="mcq-options">${q.options.map((o,i)=>`<button class="mcq-option ${q.answer===o?"selected":""}" onclick="chooseTutorQuiz(${i})" ${q.busy||q.result?"disabled":""}>${esc(o)}</button>`).join("")}</div>`:`<textarea id="tutorQuizAnswer" class="tutor-quiz-answer" placeholder="Type your quiz answer here…" oninput="tutorQuizInput(this.value)" ${q.busy||q.result?"disabled":""}>${esc(q.answer||"")}</textarea>`}<div class="practiceactions"><button class="btn primary" onclick="checkTutorQuiz()" ${q.busy||!q.question||!q.answer||q.result?"disabled":""}>Check answer</button><button class="btn secondary" onclick="generateTutorQuiz()" ${q.busy?"disabled":""}>Next question</button></div>${q.result?`<div class="practice-result ${q.result==="correct"?"correct":"wrong"}"><b>${q.result==="correct"?"✓ Correct":"✕ Not quite"}</b><span>${q.result==="correct"?"Good recall. Read the explanation, then try another.":"That one needs another look. Read the explanation, then try again."}</span></div>`:""}${q.feedback?`<div class="feedback"><b>Why</b><div>${practiceFeedback(q.feedback)}</div></div>`:""}</div>`:"";
 return `<section>${head("AI TUTOR","Ask. Upload. Understand.","Get help with a question, a topic, or your own study material. The tutor should teach you, not just hand you an answer.")}<div class="tutorgrid"><div class="card tutorbox"><div class="chat" id="chat"><div class="bubble ai"><b>StudySprint Tutor</b><span>${mode==="Quiz me"?"You answer first. I will only reveal the result and explanation after you submit.":"Ask a question, choose a study mode, or attach a photo/PDF. Your current subjects, exams and active session can be used as context."}</span></div></div>${quiz}<div class="tutor-ask"><div class="tutor-ask-head"><b>Ask the tutor something else</b><span>This box handles questions, explanations, and study material. Attach an image, PDF, TXT, or Markdown file.</span></div><div class="composer"><label class="upload"><input id="tutorFile" type="file" accept="image/*,.pdf,.txt,.md,text/plain,text/markdown" hidden onchange="filePicked()"/>📎 Attach</label><textarea id="tutorInput" placeholder="Ask the tutor something…" aria-label="Ask the tutor" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();askTutor()}"></textarea><button class="btn secondary" onclick="studyPack()">Study pack</button><button class="btn primary" onclick="askTutor()">Send ↗</button></div><div id="fileName" class="filename"></div></div></div><div class="card"><h2>Study modes</h2><button class="mode ${mode==="Explain simply"?"selected":""}" onclick="tutorPrompt(&quot;Explain simply&quot;)"><b>Explain simply</b><span>Break a hard idea into small steps.</span></button><button class="mode ${mode==="Quiz me"?"selected":""}" onclick="tutorPrompt(&quot;Quiz me&quot;)"><b>Quiz me</b><span>You answer first; the tutor checks it after.</span></button><button class="mode ${mode==="Practice"?"selected":""}" onclick="tutorPrompt(&quot;Practice&quot;)"><b>Practice</b><span>Open the dedicated practice screen for answer-first questions.</span></button><button class="mode ${mode==="Revise"?"selected":""}" onclick="tutorPrompt(&quot;Revise&quot;)"><b>Revise</b><span>Turn a weak topic into a short review session.</span></button></div></div></section>`;
}
function filePicked(){const f=document.getElementById("tutorFile")?.files?.[0];const el=document.getElementById("fileName");if(el)el.textContent=f?"Attached: "+f.name:""}
function formatTutorText(text){
  const raw=String(text||"").replace(/\r/g,"").trim();
  const lines=raw.split("\n");
  let html="",inList=false,listType="";
  const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>");
  const closeList=()=>{if(inList){html+=listType==="ol"?"</ol>":"</ul>";inList=false;listType=""}};
  for(const line of lines){
    const t=line.trim();
    if(!t){closeList();continue}
    const h=t.match(/^#{1,3}\s+(.+)$/);
    if(h){closeList();html+="<h3>"+inline(h[1])+"</h3>";continue}
    const bullet=t.match(/^[-*]\s+(.+)$/);
    const num=t.match(/^\d+[.)]\s+(.+)$/);
    if(bullet||num){
      const kind=bullet?"ul":"ol";
      if(!inList||listType!==kind){closeList();html+=kind==="ol"?"<ol>":"<ul>";inList=true;listType=kind}
      html+="<li>"+inline((bullet||num)[1])+"</li>";
      continue
    }
    closeList();
    html+="<p>"+inline(t)+"</p>";
  }
  closeList();
  return html||"<p>Sorry, I could not make a clear answer. Try asking again.</p>"
}
function tutorVisual(text,question=""){let type="";const m=text.match(/^\s*VISUAL:\s*([a-z-]+)\s*$/im);if(m)type=m[1].toLowerCase();
  if(type==="photosynthesis")return '<div class="study-visual"><div class="visual-title">Photosynthesis</div><svg viewBox="0 0 620 300" role="img" aria-label="Photosynthesis diagram"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"/></marker></defs><rect x="250" y="95" width="120" height="150" rx="55" fill="#e9f7e9" stroke="currentColor" stroke-width="3"/><path d="M310 100 C245 55 170 65 125 110 C175 135 240 145 300 125" fill="#d9f2d9" stroke="currentColor" stroke-width="3"/><path d="M315 125 C390 65 475 75 510 125 C450 145 390 150 320 145" fill="#d9f2d9" stroke="currentColor" stroke-width="3"/><path d="M310 240 C300 265 295 280 285 295 M330 240 C340 265 345 280 355 295" stroke="currentColor" stroke-width="4"/><circle cx="310" cy="165" r="32" fill="#fff" stroke="currentColor" stroke-width="2"/><text x="310" y="170" text-anchor="middle" font-size="16">leaf</text><path d="M65 45 L180 90" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><text x="25" y="35" font-size="18">☀ Light</text><path d="M35 210 L225 180" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><text x="15" y="235" font-size="18">CO₂</text><path d="M470 210 L390 185" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><text x="480" y="235" font-size="18">O₂ out</text><path d="M165 275 L250 235" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><text x="105" y="295" font-size="18">H₂O</text><path d="M375 120 L525 75" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><text x="525" y="65" font-size="18">Glucose</text></svg><div class="visual-caption">Light + water + carbon dioxide → glucose + oxygen</div></div>';if(type==="water-cycle")return '<div class="study-visual"><div class="visual-title">Water cycle</div><div class="visual-flow"><span>☀ Evaporation</span><b>→</b><span>☁ Condensation</span><b>→</b><span>🌧 Precipitation</span><b>→</b><span>🌊 Collection</span><b>↺</b></div></div>';if(type==="circuit")return '<div class="study-visual"><div class="visual-title">Simple circuit</div><svg viewBox="0 0 620 180" role="img" aria-label="Simple circuit diagram"><path d="M90 45 H220 M400 45 H530 V135 H90 V45 M220 45 V80 M400 45 V80" fill="none" stroke="currentColor" stroke-width="4"/><path d="M220 80 H260 M360 80 H400" stroke="currentColor" stroke-width="4"/><rect x="260" y="55" width="100" height="50" rx="8" fill="#eef4ff" stroke="currentColor" stroke-width="3"/><text x="310" y="86" text-anchor="middle" font-size="18">bulb</text><text x="115" y="35" font-size="18">battery</text></svg></div>';if(type==="triangle")return '<div class="study-visual"><div class="visual-title">Triangle</div><svg viewBox="0 0 420 250" role="img" aria-label="Triangle diagram"><path d="M210 30 L60 210 L360 210 Z" fill="#eef4ff" stroke="currentColor" stroke-width="4"/><text x="205" y="22" font-size="20">A</text><text x="42" y="225" font-size="20">B</text><text x="365" y="225" font-size="20">C</text></svg></div>';if(type==="cell")return '<div class="study-visual"><div class="visual-title">Cell — simplified view</div><div class="cell-diagram"><div class="cell-core">Nucleus</div><div class="cell-part">Cytoplasm</div><div class="cell-part">Cell membrane</div></div></div>';return ""}
async function tutorPrompt(x){state.tutorMode=x;if(x==="Quiz me"){state.tutorQuiz={question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:false,history:[]};render();generateTutorQuiz();return}if(x==="Practice"){startPractice();return}render();const i=document.getElementById("tutorInput");if(i){i.value=x==="Explain simply"?"Explain this simply":x==="Revise"?"Help me revise this topic with a short recall-first review.":"Help me";await askTutor()}}
async function generateTutorQuiz(){const q=state.tutorQuiz||{};state.tutorQuiz={...q,question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:true};render();const x=state.currentTask;const topic=x?.topic||state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name)?.name||"your current study topics";const subject=x?.subject||state.data.subjects.find(s=>s&&s.name)?.name||"your subject";const previous=(q.history||[]).slice(-12);try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:"Create ONE fresh student-answer-first quiz question about '"+topic+"' for '"+subject+"'. Never reveal the answer in the question or options. Prefer exactly 4 plausible MCQ options. Do not reuse any previous question or wording. Return ONLY:\nTYPE: MCQ\nQUESTION: ...\nOPTIONS:\nA) ...\nB) ...\nC) ...\nD) ...\nANSWER: A\nPrevious questions to avoid: "+JSON.stringify(previous),mode:"Quiz me",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz unavailable.");const raw=String(data.text||"").replace(/\r/g,"").trim();const qm=raw.match(/QUESTION:\s*([\\s\\S]*?)(?=\nOPTIONS:|\nANSWER:|$)/i),om=raw.match(/OPTIONS:\s*([\\s\\S]*?)(?=\nANSWER:|$)/i),am=raw.match(/ANSWER:\s*([A-D])/i);const question=(qm?.[1]||"").trim(),options=(om?.[1]||"").split("\n").map(s=>s.trim()).filter(s=>/^[A-D][.)]\s+/i.test(s)).map(s=>s.replace(/^[A-D][.)]\s+/i,"").trim()).slice(0,4),letter=am?.[1]?.toUpperCase(),correctAnswer=letter?options["ABCD".indexOf(letter)]:"";if(!question||options.length!==4||!correctAnswer)throw new Error("The tutor returned an invalid quiz. Try the next question.");state.tutorQuiz={question,answer:"",feedback:"",result:"",correctAnswer,options,busy:false,history:[...previous,question].slice(-12)};render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}}
function chooseTutorQuiz(i){const o=state.tutorQuiz.options?.[i];if(!o)return;state.tutorQuiz.answer=o;render()}
function tutorQuizInput(value){state.tutorQuiz.answer=String(value||"")}
async function checkTutorQuiz(){const q=state.tutorQuiz,typed=document.getElementById("tutorQuizAnswer")?.value?.trim();const answer=(typed||q.answer||"").trim();if(!q.question||!answer||q.busy||q.result){if(q.question&&!answer)toast("Write your answer first.");return}state.tutorQuiz={...q,answer,busy:true};render();try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:"Evaluate this student's quiz answer. Start exactly with RESULT: CORRECT or RESULT: NEEDS WORK. Then give a small professional explanation: why the answer is correct, or why it is wrong and what the correct reasoning is. Do not reveal the correct answer before the result line. Question: "+q.question+"\nExpected answer: "+q.correctAnswer+"\nStudent answer: "+answer,mode:"Quiz feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:state.currentTask}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz feedback unavailable.");const text=data.text||"",result=practiceResult(text);state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:text,result};const x=state.currentTask;if(result&&x){const topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===x.topic);state.data.practice.attempts++;state.data.practice.evidence=Array.isArray(state.data.practice.evidence)?state.data.practice.evidence:[];state.data.practice.evidence.push({topic:x.topic,subject:x.subject,correct:result==="correct",date:today(),source:"tutor-quiz"});state.data.practice.evidence=state.data.practice.evidence.slice(-200);if(result==="correct"){state.data.practice.correct++;if(topic)topic.confidence=Math.min(5,Number(topic.confidence||3)+1)}else if(result==="wrong"){if(topic)topic.confidence=Math.max(1,Number(topic.confidence||3)-1);state.data.mistakes.push({id:"mistake-"+Date.now(),topic:x.topic,subject:x.subject,question:q.question,answer,feedback:text,date:today(),source:"tutor-quiz"});const reviewDate=add(today(),1),reviewId=x.id+"-mistake-review-"+today();if(!state.data.plan.some(p=>p.id===reviewId)){state.data.plan.push({...x,id:reviewId,date:reviewDate,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+10),done:false,kind:"mistake-review"});state.data.plan.sort((u,v)=>u.date.localeCompare(v.date)||v.priority-u.priority)}}save()}render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}}
async function studyPack(){
 const file=document.getElementById("tutorFile")?.files?.[0], chat=document.getElementById("chat");
 if(!file){toast("Attach a study file first.");return}
 if(file.size>8_000_000){toast("Please attach a study file smaller than 8 MB.");return}
 const prompt="Turn this study material into a compact study pack. Use ONLY the attached material. Return: 1) KEY NOTES — 5-8 bullets; 2) ACTIVE RECALL — 5 fresh questions without answers; 3) WATCH OUT — 3 likely confusions or weak points; 4) NEXT REVIEW — one short recommended review action. Do not invent facts.";
 chat.insertAdjacentHTML("beforeend",'<div class="bubble user">'+esc(prompt)+'<small>Attached: '+esc(file.name)+'</small></div>');
 const previous=Array.from(chat.querySelectorAll(".bubble")).slice(-9,-1).map(b=>({role:b.classList.contains("user")?"user":"assistant",text:b.innerText}));
 let attachment=null;
 try{
  attachment=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=reject;r.readAsDataURL(file)});
  const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:prompt,mode:"Explain simply",attachment,history:previous,context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:state.currentTask}})});
  const data=await res.json(); if(!res.ok)throw new Error(data.error||"Study pack unavailable.");
  const visual=tutorVisual(data.text, prompt);
  const cleanText=String(data.text||"").replace(/^VISUAL:\s*[a-z-]+\s*$/gim,"").trim();
  chat.insertAdjacentHTML("beforeend",'<div class="bubble ai"><b>StudySprint Study Pack</b><span>'+formatTutorText(cleanText)+'</span>'+visual+'</div>');
  const f=document.getElementById("tutorFile");if(f)f.value="";const n=document.getElementById("fileName");if(n)n.textContent="";
 }catch(e){chat.insertAdjacentHTML("beforeend",'<div class="bubble ai"><b>Couldn\'t build the pack yet</b><span>'+esc(e.message)+'</span></div>')}
}
async function askTutor(){const i=document.getElementById("tutorInput"),chat=document.getElementById("chat"),file=document.getElementById("tutorFile")?.files?.[0];if(!i||!chat||(!i.value.trim()&&!file))return;if(file&&file.size>8_000_000){toast("Please attach a study file smaller than 8 MB.");return}const q=i.value.trim()||"Please explain this attached study material.";chat.insertAdjacentHTML("beforeend",`<div class="bubble user">${esc(q)}${file?`<small>Attached: ${esc(file.name)}</small>`:""}</div>`);i.value="";const previous=Array.from(chat.querySelectorAll(".bubble")).slice(-9,-1).map(b=>({role:b.classList.contains("user")?"user":"assistant",text:b.innerText}));let attachment=null;if(file){attachment=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=reject;r.readAsDataURL(file)})}const currentTask=state.currentTask?{subject:state.currentTask.subject,topic:state.currentTask.topic,examDate:state.currentTask.examDate,minutes:state.currentTask.minutes}:null;try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:q,mode:state.tutorMode||"Explain simply",attachment,history:previous,context:{subjects:state.data.subjects.map(s=>({name:s.name,topics:s.topics.map(t=>({name:t.name,confidence:t.confidence}))})),exams:state.data.exams,currentTask}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Tutor unavailable");const visual=tutorVisual(data.text,q);const cleanText=data.text.replace(/^VISUAL:\s*[a-z-]+\s*$/gim,"").trim();chat.insertAdjacentHTML("beforeend",`<div class="bubble ai"><b>StudySprint Tutor</b><span>${formatTutorText(cleanText)}</span>${visual}</div>`);const f=document.getElementById("tutorFile");if(f)f.value="";document.getElementById("fileName").textContent=""}catch(e){chat.insertAdjacentHTML("beforeend",`<div class="bubble ai"><b>Couldn't answer yet</b><span>${esc(e.message)}</span></div>`)} }
function practicePage(){
 const subjects=state.data.subjects.filter(s=>s&&s.name&&Array.isArray(s.topics)&&s.topics.some(t=>t&&t.name));
 const x=state.currentTask, p=state.practice, opts=p.options||[];
 if(!x){
   return '<section>'+head("PRACTICE","Choose a subject.","Practice is built from the subjects and topics in your study plan. Pick a subject to start.")+
   '<div class="practice-subject-grid">'+subjects.map(s=>{
     const topics=s.topics.filter(t=>t&&t.name);
     return '<button class="practice-subject card" onclick="selectPracticeSubject(\''+s.id+'\')"><span class="practice-subject-icon">'+esc((s.name[0]||"S").toUpperCase())+'</span><span><b>'+esc(s.name)+'</b><small>'+topics.length+' topic'+(topics.length===1?"":"s")+'</small></span><strong>→</strong></button>';
   }).join("")+'</div>'+
   (subjects.length?"":'<div class="card empty">Add subjects and topics to your plan first.</div>')+
   '</section>';
 }
 const result=p.result==="correct"?'<div class="practice-result correct"><b>✓ Correct</b><span>Nice work — your answer is correct.</span></div>':p.result==="wrong"?'<div class="practice-result wrong"><b>✕ Not quite</b><span>Use the explanation below, then move to the next question.</span></div>':"";
 const answerBox=p.type==="MCQ"
   ?'<div class="mcq-options">'+opts.map((o,i)=>'<button class="mcq-option '+(p.answer===o?'selected':'')+'" onclick="choosePracticeOption('+i+')" '+(p.busy?'disabled':'')+'>'+esc(o)+'</button>').join("")+'</div>'
   :'<textarea id="practiceAnswer" placeholder="Write your answer..." oninput="practiceAnswerInput(this.value)" '+(p.busy?'disabled':'')+'>'+esc(p.answer||"")+'</textarea>';
 return '<section>'+head("PRACTICE",esc(x.subject)+": "+esc(x.topic),"Fresh questions based on your study plan. Answer first, then check your work.",'<button class="btn secondary" onclick="practiceHome()">Change subject</button>')+
 '<div class="practicegrid"><div class="card practicecard"><div class="practice-meta"><span class="pill">'+(p.type==="MCQ"?"MULTIPLE CHOICE":"SHORT ANSWER")+'</span><span class="practice-topic-label">'+esc(x.topic)+'</span></div><div class="practiceq">'+
 (p.busy&&p.question?'<span class="muted">Checking your answer…</span>':p.busy?'<span class="muted">Creating a fresh question…</span>':p.question?formatPracticeQuestion(p.question):'<span class="muted">Question ready. Write your answer below.</span>')+
 '</div>'+answerBox+
 '<div class="practiceactions"><button class="btn primary" onclick="checkPractice()" ${p.busy||!p.question?"disabled":""}>Check answer</button><button class="btn secondary" onclick="generatePractice()" '+(p.busy?'disabled':'')+'>Next question</button></div>'+
 result+(p.feedback?'<div class="feedback"><b>Explanation</b><div>'+practiceFeedback(p.feedback)+'</div></div>':"")+
 '</div><div class="card practice-side"><h2>How practice works</h2><div class="rule"><b>1. Answer</b><span>Choose an option or write your own answer.</span></div><div class="rule"><b>2. Check</b><span>Get a clear result and explanation.</span></div><div class="rule"><b>3. Learn</b><span>See what you got right and what to improve.</span></div><div class="rule"><b>4. Continue</b><span>Get a genuinely new question.</span></div><button class="btn secondary wide" onclick="practiceHome()">Switch subject</button></div></div></section>'
}
function practiceHome(){state.currentTask=null;state.practice={question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:false,history:[]};state.view="practice";render()}
function selectPracticeSubject(subjectId){
 const s=state.data.subjects.find(a=>a.id===subjectId);if(!s)return;
 const topics=(s.topics||[]).filter(t=>t&&t.name);
 const planTasks=state.data.plan.filter(a=>a.subject===s.name&&a.topic);
 let x=planTasks.find(a=>!a.done&&a.date>=today())||planTasks.find(a=>!a.done)||planTasks[0];
 if(!x){
   const t=topics[0];
   x={id:"practice-"+s.id+"-"+t.id,subject:s.name,topic:t.name,minutes:t.minutes||30,priority:50,examDate:add(new Date(),14),date:today(),done:false};
 }
 state.currentTask=x;state.practice={question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:false,history:[]};state.view="practice";render();generatePractice();
}
function practiceAnswerInput(value){state.practice.answer=String(value||"")}
function choosePracticeOption(i){
 const o=state.practice.options?.[i];if(!o)return;
 state.practice.answer=o;render();
}
function reviewPage(){
 const done=state.data.plan.filter(x=>x.done),weak=state.data.subjects.flatMap(s=>s.topics||[]).filter(t=>t&&t.confidence<=2),mistakes=state.data.mistakes||[];
 return '<section>'+head("REVIEW","Fix what is still weak.","Review is not another dashboard. It tells you what deserves another retrieval attempt and why.")+
 '<div class="review"><div class="card"><span class="metric-label">COMPLETED</span><b class="big">'+done.length+'</b><h2>Study sessions</h2><p>Finished sessions, not proof of mastery.</p></div><div class="card"><span class="metric-label">NEEDS PRACTICE</span><b class="big">'+weak.length+'</b><h2>Weak topics</h2><p>'+(weak.map(t=>esc(t.name)).join(", ")||"Nothing flagged right now.")+'</p></div><div class="card"><span class="metric-label">SAVED</span><b class="big">'+mistakes.length+'</b><h2>Mistakes</h2><p>Questions worth revisiting.</p></div></div>'+
 '<div class="reviewgrid"><div class="card advice"><div class="cardhead"><div><h2>Recent mistakes</h2><p>Use these to guide your next practice session.</p></div><button class="btn secondary small" onclick="view(\'practice\')">Practice</button></div>'+
 (mistakes.slice(-8).reverse().map(m=>'<div class="mistake"><div><b>'+esc(m.topic)+'</b><small>'+esc(m.subject)+' · '+date(m.date)+'</small></div><span>'+esc(m.question)+'</span></div>').join("")||'<div class="empty">No mistakes saved yet. Complete a practice question and anything you miss will appear here.</div>')+
 '</div><div class="card advice"><h2>Why this comes back</h2><p>One correct answer or one completed session does not prove long-term mastery.</p><div class="rule"><b>Weak topic</b><span>Lower-confidence topics stay visible for extra practice.</span></div><div class="rule"><b>Wrong answer</b><span>A mistake is saved and a focused review is scheduled for a later day.</span></div><div class="rule"><b>Completed topic</b><span>Finished work can return later so you can prove you still remember it.</span></div></div></div>'+
 '</section>';
}
function setup(){
  if(!state.data.subjects.length){
    state.data.subjects=[{id:"subject-"+Date.now(),name:"",topics:[{id:"topic-"+Date.now(),name:"",confidence:3,minutes:30}]}];
    state.data.exams=[{id:"exam-"+Date.now(),subjectId:state.data.subjects[0].id,name:"",date:add(new Date(),14)}];
  }
  return '<div class="modal-backdrop" onclick="if(event.target===this)closeSetup()"><div class="modal setup-modal">'+
    '<div class="modalhead"><div><div class="kicker">BUILD YOUR PLAN</div><h2>Set up StudySprint in 3 steps.</h2><p>Tell us what you need to learn. Your practice results can improve the plan later.</p></div><button class="close" onclick="closeSetup()">×</button></div>'+
    '<div class="setup-guide"><div><b>01 · Subjects</b><span>What are you preparing for?</span></div><div><b>02 · Confidence</b><span>Mark what feels weak or strong.</span></div><div><b>03 · Time + dates</b><span>Set daily time and optional test dates.</span></div></div>'+
    '<label>Daily study time<input id="mins" type="number" min="20" max="600" value="'+state.data.availableMinutes+'"></label>'+
    '<div class="setup-list">'+state.data.subjects.map(subjectEditor).join("")+'</div>'+
    '<div class="setup-actions"><button class="btn secondary" onclick="addSubject()">+ Add another subject</button></div>'+
    '<button class="btn primary wide" onclick="saveSetup()">Build my plan</button>'+
    '</div></div>';
}

function subjectEditor(s,si){
  const e=state.data.exams.find(x=>x.subjectId===s.id)||{id:"exam-"+s.id,subjectId:s.id,name:"",date:add(new Date(),14)};
  const topicInputs=(s.topics||[]).map((t,ti)=>`
    <div class="quick-topic">
      <input data-topic-name="${s.id}|${t.id}" value="${esc(t.name||"")}" placeholder="Topic ${ti+1} (e.g. Quadratics)">
      <select data-conf="${s.id}|${t.id}">
        <option value="1" ${t.confidence===1?"selected":""}>Very weak</option>
        <option value="2" ${t.confidence===2?"selected":""}>Weak</option>
        <option value="3" ${t.confidence===3?"selected":""}>Okay</option>
        <option value="4" ${t.confidence===4?"selected":""}>Good</option>
        <option value="5" ${t.confidence===5?"selected":""}>Strong</option>
      </select>
      <button class="icon danger" onclick="removeTopic('${s.id}','${t.id}')" title="Remove topic">×</button>
    </div>`).join("");
  return `
    <div class="editor quick-editor">
      <div class="editorhead">
        <input data-subject-name="${s.id}" value="${esc(s.name||"")}" placeholder="Subject name (e.g. Mathematics)">
        <button class="danger text" onclick="removeSubject('${s.id}')">Remove</button>
      </div>
      <label>Topics</label>
      <div class="quick-topics">${topicInputs}</div>
      <button class="text add-topic" onclick="addTopic('${s.id}')">+ Add topic</button>
      <div class="exam-simple">
        <div><label>Test date <span class="muted">(optional)</span></label><input data-exam-date="${e.id}" type="date" value="${e.date}"></div>
        <div><label>Test name <span class="muted">(optional)</span></label><input data-exam-name="${e.id}" value="${esc(e.name||"")}" placeholder="e.g. Biology exam"></div>
      </div>
    </div>`;
}

function captureSetupDraft(){
  if(!state.modal)return;
  const mins=document.getElementById("mins");
  if(mins)state.data.availableMinutes=Math.max(20,Math.min(600,Number(mins.value||state.data.availableMinutes||90)));
  for(const s of state.data.subjects){
    const nameEl=document.querySelector('[data-subject-name="'+s.id+'"]');
    if(nameEl)s.name=nameEl.value;
    for(const t of (s.topics||[])){
      const key=s.id+"|"+t.id;
      const nameEl=document.querySelector('[data-topic-name="'+key+'"]');
      const confEl=document.querySelector('[data-conf="'+key+'"]');
      if(nameEl)t.name=nameEl.value;
      if(confEl)t.confidence=Number(confEl.value||t.confidence||3);
    }
    const e=state.data.exams.find(x=>x.subjectId===s.id);
    if(e){
      const nameEl=document.querySelector('[data-exam-name="'+e.id+'"]');
      const dateEl=document.querySelector('[data-exam-date="'+e.id+'"]');
      if(nameEl)e.name=nameEl.value;
      if(dateEl)e.date=dateEl.value;
    }
  }
}

function addSubject(){
  captureSetupDraft();
  const id="subject-"+Date.now();
  const topicId="topic-"+Date.now()+"-1";
  const examId="exam-"+Date.now();
  state.data.subjects.push({id,name:"",topics:[{id:topicId,name:"",confidence:3,minutes:30}]});
  state.data.exams.push({id:examId,subjectId:id,name:"",date:add(new Date(),14)});
  save();render();
}

function openSetup(){state.modal=true;render()}function closeSetup(){state.modal=false;render()}
function removeSubject(id){captureSetupDraft();if(state.data.subjects.length<=1){toast("Keep at least one subject.");return}state.data.subjects=state.data.subjects.filter(s=>s.id!==id);state.data.exams=state.data.exams.filter(e=>e.subjectId!==id);save();render()}
function addTopic(sid){captureSetupDraft();const s=state.data.subjects.find(x=>x.id===sid);if(s)s.topics.push({id:"topic-"+Date.now(),name:"",confidence:3,minutes:30});save();render()}
function removeTopic(sid,tid){captureSetupDraft();const s=state.data.subjects.find(x=>x.id===sid);if(!s)return;if(s.topics.length<=1){toast("Keep at least one topic.");return}s.topics=s.topics.filter(t=>t.id!==tid);save();render()}
function moveSubject(i,delta){captureSetupDraft();const j=i+delta;if(j<0||j>=state.data.subjects.length)return;[state.data.subjects[i],state.data.subjects[j]]=[state.data.subjects[j],state.data.subjects[i]];save();render()}
function moveTopic(sid,i,delta){captureSetupDraft();const s=state.data.subjects.find(x=>x.id===sid),j=i+delta;if(!s||j<0||j>=s.topics.length)return;[s.topics[i],s.topics[j]]=[s.topics[j],s.topics[i]];save();render()}
function resetDemo(){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(BACKUP_KEY);state.data=load();save();render()}
function saveSetup(){
  state.data.availableMinutes=Math.max(20,Math.min(600,Number(document.getElementById("mins")?.value||90)));
  for(const s of state.data.subjects){
    const n=document.querySelector('[data-subject-name="'+s.id+'"]');
    s.name=n?.value.trim()||"";
    if(!s.name){toast("Add a subject name first.");return}
    s.topics=(s.topics||[]).filter(Boolean);
    for(const t of s.topics){
      const key=s.id+"|"+t.id;
      const tn=document.querySelector('[data-topic-name="'+key+'"]');
      const co=document.querySelector('[data-conf="'+key+'"]');
      t.name=tn?.value.trim()||"";
      if(!t.name){toast("Add a topic name for "+s.name+".");return}
      t.confidence=Number(co?.value||3);
      t.minutes=30;
    }
    const e=state.data.exams.find(x=>x.subjectId===s.id);
    if(e){
      e.name=document.querySelector('[data-exam-name="'+e.id+'"]')?.value.trim()||s.name+" test";
      e.date=document.querySelector('[data-exam-date="'+e.id+'"]')?.value||add(new Date(),14);
      if(e.date<today()){toast("Choose a test date today or later.");return}
    }
  }
  state.modal=false;
  regen();
  toast("Plan ready. Your next step is waiting.");
}

function loadExample(){
  const n=new Date();
  state.data={...emptyData(),availableMinutes:90,
    subjects:[{id:"math",name:"Mathematics",topics:[{id:"quad",name:"Quadratics",confidence:2,minutes:30},{id:"linear",name:"Linear equations",confidence:3,minutes:30}]},
      {id:"bio",name:"Biology",topics:[{id:"cells",name:"Cell biology",confidence:2,minutes:30}]}],
    exams:[{id:"e1",subjectId:"math",name:"Math test",date:add(n,7)},{id:"e2",subjectId:"bio",name:"Biology test",date:add(n,12)}],
    plan:[],focus:{sessions:0,minutes:0},mistakes:[],practice:{attempts:0,correct:0}};
  state.modal=false;regen();toast("Example ready. Edit it with your own subjects.");
}

function regen(){const old=new Map(state.data.plan.map(x=>[x.id+"|"+x.date,x.done]));const fresh=StudySprintCore.makePlan(state.data.subjects,state.data.exams,state.data.availableMinutes,new Date(),{mistakes:state.data.mistakes,evidence:state.data.practice.evidence});fresh.forEach(x=>{if(old.get(x.id+"|"+x.date))x.done=true});state.data.plan=fresh;save();render()}
function toggle(id,d){const x=state.data.plan.find(a=>a.id===id&&a.date===d);if(x){x.done=!x.done;save();render()}}
function startNext(){const open=state.data.plan.filter(a=>!a.done),evidence={mistakes:state.data.mistakes,evidence:state.data.practice.evidence};const x=open.sort((a,b)=>StudySprintCore.adaptiveScore(b,evidence)-StudySprintCore.adaptiveScore(a,evidence))[0];if(x)startTask(x.id,x.date);else toast("No unfinished sessions. Nice.")}
function startTask(id,d){const x=state.data.plan.find(a=>a.id===id&&a.date===d);if(!x)return;state.currentTask=x;selectedMinutes=Math.min(60,Math.max(25,x.minutes));seconds=selectedMinutes*60;state.practice={question:"",answer:"",feedback:"",busy:false};state.view="session";render()}
function startPractice(){let x=state.currentTask;if(!x){x=state.data.plan.find(a=>!a.done&&a.date===today())||state.data.plan.find(a=>!a.done);if(x)state.currentTask=x}if(!state.currentTask){toast("Build a study plan first.");return}state.practice={question:"",answer:"",feedback:"",busy:false};state.view="practice";render();generatePractice()}async function checkPractice(){
 const x=state.currentTask,typed=document.getElementById("practiceAnswer")?.value?.trim(),a=(typed||state.practice.answer||"").trim();if(!x||!state.practice.question||!a){toast("Write your answer first.");return}
 state.practice={...state.practice,answer:a,busy:true};render();
 try{
  const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,
   message:"Evaluate the student's answer. Start exactly with RESULT: CORRECT or RESULT: NEEDS WORK. Then give a small professional explanation in 2-4 short paragraphs or bullets: say what was correct, why it is correct, or why it is wrong and what the correct reasoning is. Do not be repetitive. Question: "+state.practice.question+"\nExpected answer: "+state.practice.correctAnswer+"\nStudent answer: "+a,
   mode:"Practice feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}
  })});
  const data=await res.json();if(!res.ok)throw new Error(data.error||"Feedback unavailable.");
  const text=data.text||"",result=practiceResult(text);
  if(!result)throw new Error("The tutor returned feedback without a clear result. Your attempt was not counted; try again.");
  const topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===x.topic);
  state.data.practice.attempts++;
  state.data.practice.evidence=Array.isArray(state.data.practice.evidence)?state.data.practice.evidence:[];
  state.data.practice.evidence.push({topic:x.topic,subject:x.subject,correct:result==="correct",date:today(),source:"practice"});
  state.data.practice.evidence=state.data.practice.evidence.slice(-200);
  if(result==="correct"){
   state.data.practice.correct++;
   if(topic)topic.confidence=Math.min(5,Number(topic.confidence||3)+1);
  }else{
   if(topic)topic.confidence=Math.max(1,Number(topic.confidence||3)-1);
   state.data.mistakes.push({id:"mistake-"+Date.now(),topic:x.topic,subject:x.subject,question:state.practice.question,answer:a,feedback:text,date:today()});
   const reviewDate=add(today(),1),reviewId=x.id+"-mistake-review-"+today();
   if(!state.data.plan.some(p=>p.id===reviewId)){state.data.plan.push({...x,id:reviewId,date:reviewDate,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+10),done:false,kind:"mistake-review"});state.data.plan.sort((u,v)=>u.date.localeCompare(v.date)||v.priority-u.priority)}
  }
  state.practice={...state.practice,busy:false,feedback:text,result};save();render();
 }catch(e){state.practice={...state.practice,busy:false,feedback:e.message,result:""};render()}
}
function startFocusForTask(){const x=state.currentTask;if(!x)return;selectedMinutes=Math.min(60,Math.max(25,x.minutes));seconds=selectedMinutes*60;state.view="focus";render()}
async function tutorForTask(mode){ const x=state.currentTask;if(!x)return; if(mode==="Practice"){startPractice();return} if(mode==="Quiz me"){state.tutorMode="Quiz me";state.tutorQuiz={question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:false,history:[]};state.view="tutor";render();generateTutorQuiz();return} state.tutorMode="Explain simply";state.view="tutor";render(); const i=document.getElementById("tutorInput");if(i){i.value="Explain "+x.topic+" from "+x.subject+" simply, then give me one example.";await askTutor()} }
function finishCurrentTask(){const x=state.currentTask;if(!x)return;const item=state.data.plan.find(a=>a.id===x.id&&a.date===x.date);if(item){item.done=true;const reviewDay=new Date(x.date+"T00:00:00");reviewDay.setDate(reviewDay.getDate()+3);const rd=localDate(reviewDay);if(rd<x.examDate&&!state.data.plan.some(p=>p.id===x.id+"-review"&&p.date===rd))state.data.plan.push({...x,id:x.id+"-review",date:rd,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+5),done:false,kind:"review"});state.data.plan.sort((a,b)=>a.date.localeCompare(b.date)||b.priority-a.priority)}save();state.view="today";state.currentTask=null;render();toast("Session complete. A later review is scheduled.")}
function timerSet(m){clearInterval(timer);timer=null;selectedMinutes=m;seconds=m*60;render()}
function timerToggle(){const b=document.getElementById("timerbtn");if(timer){clearInterval(timer);timer=null;b.textContent="Resume focus";return}b.textContent="Pause focus";timer=setInterval(()=>{seconds--;const c=document.getElementById("clock");if(c)c.textContent=Math.floor(seconds/60).toString().padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");if(seconds<=0){clearInterval(timer);timer=null;state.data.focus.sessions++;state.data.focus.minutes+=selectedMinutes;save();if(state.currentTask){finishCurrentTask()}else{toast("Focus session complete — time logged.");render()}}},1000)}
function openTutor(){state.view="tutor";state.modal=false;render()}function view(v){state.view=v;state.modal=false;render()}function toast(m){state.toast=m;render();setTimeout(()=>{state.toast="";render()},2200)}
function topicInsight(t){const c=Number(t?.confidence||3);if(c<=1)return "Needs immediate practice";if(c===2)return "Needs another retrieval attempt";if(c===3)return "Still building";if(c===4)return "Looking strong";return "Strong and ready for a check"}
function render(){const root=document.getElementById("app");if(!root)return;try{let c=state.view==="today"?todayPage():state.view==="plan"?planPage():state.view==="subjects"?subjectsPage():state.view==="session"?sessionPage():state.view==="practice"?practicePage():state.view==="focus"?focusPage():state.view==="review"?reviewPage():state.view==="progress"?progressPage():state.view==="tutor"?tutorPage():tutorPage();root.innerHTML=shell(c)}catch(e){console.error(e);state.view="today";try{root.innerHTML=shell('<section><div class="card"><h1>StudySprint</h1><p>That page hit a display error, but your saved subjects and progress are still here.</p><button class="btn primary" onclick="view(\'today\')">Back to Today</button></div></section>')}catch(_){root.innerHTML='<section class="welcome"><div class="card"><h1>StudySprint</h1><p>Your saved study data is still stored on this device.</p><button class="btn primary" onclick="location.reload()">Reload StudySprint</button></div></section>'}}}render();
// Final quality overrides: deterministic grading, fresher questions, topic rotation.
function resetPracticeState(){state.practice={question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:false,history:[],topicCursor:0}}
function practiceTopicForCurrent(){const base=state.currentTask;if(!base)return base;const subject=state.data.subjects.find(s=>s&&s.name===base.subject);const topics=(subject?.topics||[]).filter(t=>t&&t.name);const cursor=Number(state.practice.topicCursor||0);const topic=topics.length?topics[cursor%topics.length].name:base.topic;state.practice.topicCursor=topics.length?(cursor+1)%topics.length:cursor;return {...base,topic}}
async function generatePractice(){
 const base=state.currentTask;if(!base)return;const x=practiceTopicForCurrent();state.currentTask=x;const previous=state.practice.history||[];state.practice={...state.practice,question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:true};render();
 try{
  const prompt="Generate ONE genuinely fresh school practice question for the exact topic '"+x.topic+"' in '"+x.subject+"'. The student must answer first. NEVER reveal the answer in the question or options. Prefer exactly 4 plausible MCQ options when suitable. Make wording, examples, values and scenarios meaningfully different from every previous question. Return ONLY TYPE: MCQ, QUESTION, OPTIONS A-D, ANSWER; or TYPE: SHORT and omit options. Previous questions: "+JSON.stringify(previous.slice(-20));
  let parsed=null;
  for(let attempt=0;attempt<3&&!parsed;attempt++){
   const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:prompt+"\nFreshness attempt: "+attempt,mode:"Practice",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Practice generator unavailable.");
   const raw=String(data.text||"").replace(/\r/g,"").replace(/^```[a-z]*\s*/i,"").replace(/```$/i,"").trim();
   const type=(raw.match(/TYPE\s*:\s*(MCQ|SHORT)/i)||[])[1]?.toUpperCase()||"SHORT";
   const qm=raw.match(/QUESTION\s*:\s*([\s\S]*?)(?=\n\s*OPTIONS\s*:|\n\s*ANSWER\s*:|$)/i),om=raw.match(/OPTIONS\s*:\s*([\s\S]*?)(?=\n\s*ANSWER\s*:|$)/i),am=raw.match(/ANSWER\s*:\s*([^\n]+)/i);
   const question=(qm?.[1]||"").trim();
   const options=(om?.[1]||"").split("\n").map(v=>v.trim()).filter(v=>/^[A-D][.)]\s+/i.test(v)).map(v=>v.replace(/^[A-D][.)]\s+/i,"").trim()).filter(Boolean).slice(0,4);
   const answerRaw=(am?.[1]||"").trim(),letter=(answerRaw.match(/^([A-D])(?:[.)]|\s|$)/i)||[])[1]?.toUpperCase(),correctAnswer=type==="MCQ"&&letter?options["ABCD".indexOf(letter)]||"":answerRaw;
   const normalized=question.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
   const duplicate=previous.some(v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g," ").trim()===normalized);
   if(question&&!duplicate&&(type!=="MCQ"||(options.length===4&&correctAnswer)))parsed={question,answer:"",feedback:"",result:"",correctAnswer,type,options,busy:false,history:[...previous,question].slice(-20),topicCursor:state.practice.topicCursor};
  }
  if(!parsed)throw new Error("I could not create a genuinely new question yet. Tap Next question to try again.");
  state.practice=parsed;save();render();
 }catch(e){state.practice={...state.practice,busy:false,feedback:e.message};render()}
}
