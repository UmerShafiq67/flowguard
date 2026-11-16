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
  const mobileNav=[["today","Today","⌂"],["plan","Plan","◷"],["subjects","Subjects","▦"],["focus","Focus","◉"],["practice","Practice","✎"],["review","Review","✓"],["progress","Progress","◌"],["tutor","Tutor","✦"],["account","Account","◎"]];
  return `<header class="top"><button class="brand" onclick="view('today')"><span class="logo">S</span>StudySprint</button><div class="topright"><span class="saved">● Saved locally · backup protected</span><button class="ghost" onclick="openSetup()">Set up my plan</button></div></header><div class="layout"><aside class="side">${nav("today","Today","⌂")}${nav("plan","My plan","◷")}${nav("subjects","Subjects","▦")}${nav("focus","Focus","◉")}${nav("practice","Practice","✎")}${nav("review","Review","✓")}${nav("account","Account","◎")}<div class="sidefoot"><b>StudySprint</b><span>Built around learning evidence — learn, practise, review, adapt.</span></div></aside><main class="main view-${state.view}">${c}</main></div><nav class="mobile-nav" aria-label="StudySprint pages">${mobileNav.map(([v,t,i])=>nav(v,t,i)).join("")}</nav><div class="toast ${state.toast?"show":""}">${esc(state.toast)}</div>${state.modal?setup():""}`}
function head(k,t,p,a=""){
  const guides={TODAY:["Your starting point","See what to study today, why it matters, and the next action StudySprint recommends."],PLAN:["Your roadmap","See the full schedule StudySprint built from your subjects, confidence, available time, and exam dates."],SUBJECTS:["Your learning map","Add subjects and topics. Confidence here helps StudySprint decide what needs more attention."],FOCUS:["Deep-work timer","Use Focus for one distraction-free study session and record the time you complete."],PRACTICE:["Prove what you know","Answer fresh questions. Your results become learning evidence that can change what comes next."],REVIEW:["Fix what is weak","Return to mistakes, weak topics, and work that needs another retrieval attempt."],PROGRESS:["Your learning evidence","See streaks, accuracy, focus, plan coverage, topic health, and the signals behind progress."],"AI TUTOR":["Learn with guidance","Ask for explanations, practice, quizzes, or revision with context from your study plan."],ACCOUNT:["Your account & sync","Manage sign-in, cloud backup, and data portability. StudySprint also works locally."],SESSION:["Your next study action","Follow the recommended learn → recall → practice loop for the topic StudySprint chose."]};
  const g=guides[String(k).toUpperCase()];
  return `<div class="head"><div><div class="kicker">${k}</div><h1>${t}</h1><p>${p}</p>${g?`<div class="page-guide"><span>WHAT THIS PAGE DOES</span><b>${g[0]}</b><small>${g[1]}</small></div>`:""}</div>${a}</div>`;
}
function onboardingPage(){
  return '<section class="welcome">'+
    '<div class="welcome-hero">'+
      '<div class="welcome-copy">'+
        '<span class="hero-badge"><i></i> ADAPTIVE STUDY ENGINE</span>'+
        '<h1>Study smarter.<br><em>Know what to do next.</em></h1>'+
        '<p>StudySprint turns your subjects, deadlines, confidence, and practice results into one living study plan — so you spend less time planning and more time actually learning.</p>'+
        '<div class="welcome-actions"><button class="btn primary" onclick="openSetup()">Build my study plan <span>→</span></button><span class="hero-note">Free to start · local-first · works offline</span></div>'+
      '</div>'+
      '<div class="welcome-orbit" aria-hidden="true"><div class="orbit-ring r1"></div><div class="orbit-ring r2"></div><div class="orbit-core"><span>S</span><small>LEARN</small></div><div class="orbit-dot d1"></div><div class="orbit-dot d2"></div><div class="orbit-dot d3"></div></div>'+
    '</div>'+
    '<div class="welcome-steps"><div><span>01</span><b>Tell it what matters</b><small>Subjects, topics, confidence and exam dates.</small></div><div><span>02</span><b>Prove what you know</b><small>Practice questions create real learning evidence.</small></div><div><span>03</span><b>Let the plan adapt</b><small>Weak and urgent topics rise when they need you.</small></div></div>'+
    '<div class="welcome-proof"><div><span class="proof-icon">↗</span><div><b>Adaptive, not static</b><small>Your next session changes as your evidence changes.</small></div></div><div><span class="proof-icon">✓</span><div><b>Built around retrieval</b><small>Practice and review matter more than simply running a timer.</small></div></div><div><span class="proof-icon">⌁</span><div><b>Your data stays yours</b><small>Local-first storage, exportable backups, optional cloud sync.</small></div></div></div>'+
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
function todayPage(){
  const ready=state.data.subjects.length&&state.data.plan.length;
  if(!ready)return onboardingPage();
  const tasks=state.data.plan.filter(x=>x.date===today()),
    next=state.data.plan.filter(x=>!x.done&&x.date>=today()).sort((a,b)=>b.priority-a.priority).slice(0,4),
    ex=state.data.exams.filter(e=>e&&e.date).map(e=>({...e,days:StudySprintCore.daysUntil(e.date)})).sort((a,b)=>a.days-b.days),
    readiness=StudySprintCore.readiness(state.data.subjects,state.data.exams,state.data.plan);
  const todayMinutes=tasks.reduce((a,x)=>a+Number(x.minutes||0),0);
  const completedMinutes=tasks.filter(x=>x.done).reduce((a,x)=>a+Number(x.minutes||0),0);
  const progress=todayMinutes?Math.min(100,Math.round(completedMinutes/todayMinutes*100)):0;
  const remaining=Math.max(0,todayMinutes-completedMinutes);
  return '<section>'+
    head("TODAY","Your adaptive study coach.","StudySprint does more than schedule time: it uses your practice results and topic confidence to decide what deserves attention next.",'<button class="btn primary" onclick="startNext()">Start next</button>')+
    '<div class="stats"><div><small>Today</small><b>'+progress+'%</b><span>today progress</span></div><div><small>Time</small><b>'+completedMinutes+' / '+todayMinutes+' min</b><span>'+remaining+' min remaining</span></div><div><small>Subjects</small><b>'+state.data.subjects.length+'</b><span>in your plan</span></div><div><small>Topics</small><b>'+state.data.subjects.reduce((n,s)=>n+(s.topics||[]).length,0)+'</b><span>to work through</span></div></div>'+
    '<div class="cols"><div class="card"><div class="cardhead"><div><h2>Today</h2><p>Start at the top. That is all you need to decide.</p></div><span class="pill">'+date(today())+'</span></div>'+
    (tasks.length?tasks.map(task).join(""):'<div class="empty">Nothing is scheduled today. <button class="text" onclick="regen()">Refresh my plan</button></div>')+
    '</div><div class="stack"><div class="card"><div class="cardhead"><h2>Coming next</h2><button class="text" onclick="view(&quot;plan&quot;)">See plan</button></div>'+
    (next.map(x=>'<div class="mini"><i></i><div><b>'+esc(x.topic)+'</b><small>'+esc(x.subject)+' · '+date(x.date)+' · '+x.minutes+'m</small></div></div>').join("")||'<div class="empty">You are caught up.</div>')+
    '</div><div class="card dark"><div class="kicker">NEXT EXAM</div>'+
    (ex[0]?'<div class="exam"><div><b>'+esc(ex[0].name)+'</b><small>'+date(ex[0].date)+'</small></div><strong>'+ex[0].days+'d</strong></div>':'<div class="empty">No exam date yet.</div>')+
    '</div></div></div>'+
    '<div class="callout"><b>Today at a glance.</b><span>'+(tasks.length?'Complete a session and your progress will update automatically.':'Nothing is scheduled today yet.')+'</span></div>'+
    '</section>';
}
function task(x){return `<div class="task ${x.done?"done":""}"><button class="check" onclick="toggle('${x.id}','${x.date}')">${x.done?"✓":""}</button><div class="grow"><small>${esc(x.subject)}</small><b>${esc(x.topic)}</b><span>${x.minutes} min · priority ${x.priority}/100 · exam ${date(x.examDate)}</span></div><button class="btn small" onclick="startTask('${x.id}','${x.date}')">${x.done?"Review":"Start"}</button></div>`}
function planPage(){const groups={};state.data.plan.forEach(x=>(groups[x.date]??=[]).push(x));return `<section>${head("PLAN","Your complete study plan.","StudySprint chooses the next useful action from exam urgency, confidence, completed work and spaced review.",`<button class="btn secondary" onclick="regen()">Regenerate</button>`)}<div class="days">${Object.keys(groups).sort().map(d=>`<div class="day card"><div class="dayhead"><b>${d===today()?"Today":date(d)}</b><span>${groups[d].reduce((a,x)=>a+x.minutes,0)} min</span></div>${groups[d].map(task).join("")}</div>`).join("")}</div></section>`}
function subjectsPage(){
  const subjects=state.data.subjects.filter(s=>s&&s.name);
  return '<section>'+head("SUBJECTS","Your subjects.","Keep this list simple. Each subject contains the topics you actually need to learn.",'<button class="btn primary" onclick="openSetup()">Edit subjects</button>')+
    (subjects.length?'<div class="subjectgrid">'+subjects.map(s=>{
      const topics=(s.topics||[]).filter(t=>t&&t.name);
      return '<div class="card"><div class="subject"><span>'+esc(s.name[0]||"S")+'</span><div><h2>'+esc(s.name)+'</h2><small>'+topics.length+' topic'+(topics.length===1?"":"s")+'</small></div></div>'+
      (topics.map(t=>'<div class="topic"><span>'+esc(t.name)+'</span><b class="c'+Number(t.confidence||3)+'">'+(["","Very weak","Weak","Okay","Good","Strong"][Number(t.confidence||3)]||"Okay")+'</b></div>').join("")||'<div class="empty">No topics yet.</div>')+
      '</div>';
    }).join("")+'</div>':'<div class="card empty">No subjects yet. <button class="btn primary" onclick="openSetup()">Add your first subject</button></div>')+
    '</section>';
}

let seconds=1500,timer=null,selectedMinutes=25;
function sessionPage(){const x=state.currentTask;if(!x)return '<section>'+head("SESSION","Choose what you need.","Pick a learning action and StudySprint will take you there.")+'<div class="card"><button class="btn primary" onclick="view(\'today\')">Back to today</button></div></section>';return '<section>'+head("NEXT SESSION","Study "+esc(x.topic),"This is what StudySprint wants you to work on now: "+esc(x.subject)+" · "+x.minutes+" minutes · exam "+date(x.examDate),'<button class="btn secondary" onclick="view(\'today\')">Back to today</button>')+'<div class="sessiongrid"><div class="card sessionmain"><div class="sessionlabel">YOUR GOAL</div><h2>Understand '+esc(x.topic)+', then prove you can use it.</h2><p>Do not just watch the clock. First learn the idea, then retrieve it, then practise it.</p><div class="sessionactions"><button class="btn primary" onclick="tutorForTask(\'Explain simply\')">Teach me '+esc(x.topic)+'</button><button class="btn secondary" onclick="tutorForTask(\'Practice\')">Practice '+esc(x.topic)+'</button><button class="btn secondary" onclick="tutorForTask(\'Quiz me\')">Quiz me on '+esc(x.topic)+'</button><button class="btn secondary" onclick="startFocusForTask()">Start '+x.minutes+' min focus</button></div></div><div class="card"><h2>What counts as done?</h2><div class="rule"><b>1. Learn</b><span>Get a clear explanation or use your own notes.</span></div><div class="rule"><b>2. Recall</b><span>Explain the idea without looking.</span></div><div class="rule"><b>3. Practise</b><span>Answer questions or solve a problem.</span></div><div class="rule"><b>4. Finish</b><span>Mark the session complete when you can use the idea.</span></div><button class="btn primary wide" onclick="finishCurrentTask()">Mark session complete</button></div></div></section>'}
function focusPage(){
 const x=state.currentTask,m=selectedMinutes;
 return `<section>${head("FOCUS",x?"Focus on "+esc(x.topic):"Focus mode.",x?"A distraction-free "+m+"-minute session for "+esc(x.subject)+".":"Use Focus when you want a clean timer without leaving your study plan.")}<div class="focusgrid"><div class="card center">`+
 (x?`<div class="focus-context"><span class="pill">${esc(x.subject)}</span><b>${esc(x.topic)}</b><small>${x.minutes} minutes planned</small></div>`:"")+
 `<div class="clock" id="clock">${Math.floor(seconds/60).toString().padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}</div><div class="choices"><button onclick="timerSet(25)" class="choice ${m===25?"active":""}">25m</button><button onclick="timerSet(45)" class="choice ${m===45?"active":""}">45m</button><button onclick="timerSet(60)" class="choice ${m===60?"active":""}">60m</button></div><button class="btn primary wide" id="timerbtn" onclick="timerToggle()">Start focus</button></div><div class="card"><h2>What to do</h2><div class="rule"><b>1. Recall</b><span>Say what you already know before checking notes.</span></div><div class="rule"><b>2. Learn</b><span>Study one small idea at a time.</span></div><div class="rule"><b>3. Practise</b><span>Use Practice or AI Tutor to test yourself.</span></div><div class="rule"><b>4. Finish</b><span>When the timer ends, the active plan session is marked done.</span></div><div class="focusstat"><b>${state.data.focus.sessions}</b><span>sessions</span><b>${state.data.focus.minutes}</b><span>minutes</span></div></div></div></section>`;
}
function tutorPage(){
 const mode=state.tutorMode||"Explain simply",q=state.tutorQuiz||{};
 const quiz=mode==="Quiz me"?`<div class="tutor-quiz-card"><div class="practice-meta"><span class="pill">QUIZ</span><span class="practice-topic-label">${state.currentTask?esc(state.currentTask.topic):"Study quiz"}</span></div><div class="tutor-quiz-question">${q.busy?'<span class="muted">Creating your question…</span>':q.question?formatPracticeQuestion(q.question):'<span class="muted">Choose Quiz me to start.</span>'}</div>${q.options?.length?`<div class="mcq-options">${q.options.map((o,i)=>`<button class="mcq-option ${q.answer===o?"selected":""}" onclick="chooseTutorQuiz(${i})" ${q.busy||q.result?"disabled":""}>${esc(o)}</button>`).join("")}</div>`:`<textarea id="tutorQuizAnswer" class="tutor-quiz-answer" placeholder="Write your answer..." ${q.busy||q.result?"disabled":""}>${esc(q.answer||"")}</textarea>`}<div class="practiceactions"><button class="btn primary" onclick="checkTutorQuiz()" ${q.busy||!q.question||!q.answer||q.result?"disabled":""}>Check answer</button><button class="btn secondary" onclick="generateTutorQuiz()" ${q.busy?"disabled":""}>Next question</button></div>${q.result?`<div class="practice-result ${q.result==="correct"?"correct":"wrong"}"><b>${q.result==="correct"?"✓ Correct":"✕ Not quite"}</b><span>${q.result==="correct"?"Good recall. Read the explanation, then try another.":"That one needs another look. Read the explanation, then try again."}</span></div>`:""}${q.feedback?`<div class="feedback"><b>Why</b><div>${practiceFeedback(q.feedback)}</div></div>`:""}</div>`:"";
 return `<section>${head("AI TUTOR","Ask. Upload. Understand.","Get help with a question, a topic, or your own study material. The tutor should teach you, not just hand you an answer.")}<div class="tutorgrid"><div class="card tutorbox"><div class="chat" id="chat"><div class="bubble ai"><b>StudySprint Tutor</b><span>${mode==="Quiz me"?"You answer first. I will only reveal the result and explanation after you submit.":"Ask a question, choose a study mode, or attach a photo/PDF. Your current subjects, exams and active session can be used as context."}</span></div></div>${quiz}<div class="composer"><label class="upload"><input id="tutorFile" type="file" accept="image/*,.pdf" hidden onchange="filePicked()"/>📎 Attach</label><textarea id="tutorInput" placeholder="Ask me about a topic, homework question, or exam..."></textarea><button class="btn primary" onclick="askTutor()">Send</button></div><div id="fileName" class="filename"></div></div><div class="card"><h2>Study modes</h2><button class="mode ${mode==="Explain simply"?"selected":""}" onclick="tutorPrompt(&quot;Explain simply&quot;)"><b>Explain simply</b><span>Break a hard idea into small steps.</span></button><button class="mode ${mode==="Quiz me"?"selected":""}" onclick="tutorPrompt(&quot;Quiz me&quot;)"><b>Quiz me</b><span>You answer first; the tutor checks it after.</span></button><button class="mode ${mode==="Practice"?"selected":""}" onclick="tutorPrompt(&quot;Practice&quot;)"><b>Practice</b><span>Generate questions and check mistakes.</span></button><button class="mode ${mode==="Revise"?"selected":""}" onclick="tutorPrompt(&quot;Revise&quot;)"><b>Revise</b><span>Turn a weak topic into a short review session.</span></button></div></div></section>`;
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
function tutorPrompt(x){state.tutorMode=x;if(x==="Quiz me"){state.tutorQuiz={question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:false,history:[]};render();generateTutorQuiz();return}render();const i=document.getElementById("tutorInput");if(i){i.value=x==="Explain simply"?"Explain this simply":x==="Practice"?"Give me practice questions":"Help me revise";i.focus()}}
async function generateTutorQuiz(){const q=state.tutorQuiz||{};state.tutorQuiz={...q,question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:true};render();const x=state.currentTask;const topic=x?.topic||state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name)?.name||"your current study topics";const subject=x?.subject||state.data.subjects.find(s=>s&&s.name)?.name||"your subject";const previous=(q.history||[]).slice(-12);try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Create ONE fresh student-answer-first quiz question about '"+topic+"' for '"+subject+"'. Never reveal the answer in the question or options. Prefer exactly 4 plausible MCQ options. Do not reuse any previous question or wording. Return ONLY:\nTYPE: MCQ\nQUESTION: ...\nOPTIONS:\nA) ...\nB) ...\nC) ...\nD) ...\nANSWER: A\nPrevious questions to avoid: "+JSON.stringify(previous),mode:"Quiz me",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz unavailable.");const raw=String(data.text||"").replace(/\r/g,"").trim();const qm=raw.match(/QUESTION:\s*([\\s\\S]*?)(?=\nOPTIONS:|\nANSWER:|$)/i),om=raw.match(/OPTIONS:\s*([\\s\\S]*?)(?=\nANSWER:|$)/i),am=raw.match(/ANSWER:\s*([A-D])/i);const question=(qm?.[1]||"").trim(),options=(om?.[1]||"").split("\n").map(s=>s.trim()).filter(s=>/^[A-D][.)]\s+/i.test(s)).map(s=>s.replace(/^[A-D][.)]\s+/i,"").trim()).slice(0,4),letter=am?.[1]?.toUpperCase(),correctAnswer=letter?options["ABCD".indexOf(letter)]:"";if(!question||options.length!==4||!correctAnswer)throw new Error("The tutor returned an invalid quiz. Try the next question.");state.tutorQuiz={question,answer:"",feedback:"",result:"",correctAnswer,options,busy:false,history:[...previous,question].slice(-12)};render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}}
function chooseTutorQuiz(i){const o=state.tutorQuiz.options?.[i];if(!o)return;state.tutorQuiz.answer=o;render()}
async function checkTutorQuiz(){const q=state.tutorQuiz;if(!q.question||!q.answer||q.busy||q.result)return;state.tutorQuiz={...q,busy:true};render();try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Evaluate this student's quiz answer. Start exactly with RESULT: CORRECT or RESULT: NEEDS WORK. Then give a small professional explanation: why the answer is correct, or why it is wrong and what the correct reasoning is. Do not reveal the correct answer before the result line. Question: "+q.question+"\nExpected answer: "+q.correctAnswer+"\nStudent answer: "+q.answer,mode:"Quiz feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:state.currentTask}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz feedback unavailable.");const text=data.text||"",result=practiceResult(text);state.tutorQuiz={...q,busy:false,feedback:text,result};render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}}
async function askTutor(){const i=document.getElementById("tutorInput"),chat=document.getElementById("chat"),file=document.getElementById("tutorFile")?.files?.[0];if(!i||!chat||(!i.value.trim()&&!file))return;if(file&&file.size>8_000_000){toast("Please attach a file smaller than 8 MB.");return}const q=i.value.trim()||"Please explain this attached study material.";chat.insertAdjacentHTML("beforeend",`<div class="bubble user">${esc(q)}${file?`<small>Attached: ${esc(file.name)}</small>`:""}</div>`);i.value="";const previous=Array.from(chat.querySelectorAll(".bubble")).slice(-9,-1).map(b=>({role:b.classList.contains("user")?"user":"assistant",text:b.innerText}));let attachment=null;if(file){attachment=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=reject;r.readAsDataURL(file)})}const currentTask=state.currentTask?{subject:state.currentTask.subject,topic:state.currentTask.topic,examDate:state.currentTask.examDate,minutes:state.currentTask.minutes}:null;try{const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:window.studySprintDeviceId?window.studySprintDeviceId():null,message:q,mode:state.tutorMode||"Explain simply",attachment,history:previous,context:{subjects:state.data.subjects.map(s=>({name:s.name,topics:s.topics.map(t=>({name:t.name,confidence:t.confidence}))})),exams:state.data.exams,currentTask}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Tutor unavailable");const visual=tutorVisual(data.text,q);const cleanText=data.text.replace(/^VISUAL:\s*[a-z-]+\s*$/gim,"").trim();chat.insertAdjacentHTML("beforeend",`<div class="bubble ai"><b>StudySprint Tutor</b><span>${formatTutorText(cleanText)}</span>${visual}</div>`);const f=document.getElementById("tutorFile");if(f)f.value="";document.getElementById("fileName").textContent=""}catch(e){chat.insertAdjacentHTML("beforeend",`<div class="bubble ai"><b>Couldn't answer yet</b><span>${esc(e.message)}</span></div>`)} }
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
   :'<textarea id="practiceAnswer" placeholder="Write your answer..." '+(p.busy?'disabled':'')+'>'+esc(p.answer||"")+'</textarea>';
 return '<section>'+head("PRACTICE",esc(x.subject)+": "+esc(x.topic),"Fresh questions based on your study plan. Answer first, then check your work.",'<button class="btn secondary" onclick="practiceHome()">Change subject</button>')+
 '<div class="practicegrid"><div class="card practicecard"><div class="practice-meta"><span class="pill">'+(p.type==="MCQ"?"MULTIPLE CHOICE":"SHORT ANSWER")+'</span><span class="practice-topic-label">'+esc(x.topic)+'</span></div><div class="practiceq">'+
 (p.busy?'<span class="muted">Creating a fresh question…</span>':p.question?formatPracticeQuestion(p.question):'<span class="muted">Ready when you are.</span>')+
 '</div>'+answerBox+
 '<div class="practiceactions"><button class="btn primary" onclick="checkPractice()" '+(p.busy||!p.question||!p.answer?'disabled':'')+'>Check answer</button><button class="btn secondary" onclick="generatePractice()" '+(p.busy?'disabled':'')+'>Next question</button></div>'+
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
function choosePracticeOption(i){
 const o=state.practice.options?.[i];if(!o)return;
 state.practice.answer=o;render();
}
function reviewPage(){
 const done=state.data.plan.filter(x=>x.done),weak=state.data.subjects.flatMap(s=>s.topics||[]).filter(t=>t&&t.confidence<=2),mistakes=state.data.mistakes||[];
 return '<section>'+head("REVIEW","Review what needs another look.","StudySprint keeps weak topics and mistakes visible so your next review is focused, not random.")+
 '<div class="review"><div class="card"><span class="metric-label">COMPLETED</span><b class="big">'+done.length+'</b><h2>Study sessions</h2><p>Sessions you have finished.</p></div><div class="card"><span class="metric-label">NEEDS PRACTICE</span><b class="big">'+weak.length+'</b><h2>Weak topics</h2><p>'+(weak.map(t=>esc(t.name)).join(", ")||"Nothing flagged right now.")+'</p></div><div class="card"><span class="metric-label">SAVED</span><b class="big">'+mistakes.length+'</b><h2>Mistakes</h2><p>Questions worth revisiting.</p></div></div>'+
 '<div class="reviewgrid"><div class="card advice"><div class="cardhead"><div><h2>Recent mistakes</h2><p>Use these to guide your next practice session.</p></div><button class="btn secondary small" onclick="view(\'practice\')">Practice</button></div>'+
 (mistakes.slice(-8).reverse().map(m=>'<div class="mistake"><div><b>'+esc(m.topic)+'</b><small>'+esc(m.subject)+' · '+date(m.date)+'</small></div><span>'+esc(m.question)+'</span></div>').join("")||'<div class="empty">No mistakes saved yet. Complete a practice question and anything you miss will appear here.</div>')+
 '</div><div class="card advice"><h2>Your review system</h2><p>StudySprint does not treat one session as mastery.</p><div class="rule"><b>Weak topic</b><span>Lower-confidence topics stay visible for extra practice.</span></div><div class="rule"><b>Wrong answer</b><span>A mistake is saved and a focused review is scheduled for a later day.</span></div><div class="rule"><b>Completed topic</b><span>Finished work can return later so you can prove you still remember it.</span></div></div></div>'+
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
function resetDemo(){localStorage.removeItem("studysprint");state.data=load();save();render()}
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
function startPractice(){let x=state.currentTask;if(!x){x=state.data.plan.find(a=>!a.done&&a.date===today())||state.data.plan.find(a=>!a.done);if(x)state.currentTask=x}if(!state.currentTask){toast("Build a study plan first.");return}state.practice={question:"",answer:"",feedback:"",busy:false};state.view="practice";render();generatePractice()}
async function generatePractice(){
 const x=state.currentTask;if(!x)return;
 const previous=state.practice.history||[];
 state.practice={question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:true,history:previous};render();
 try{
  const seed=Date.now()+"-"+Math.random().toString(36).slice(2,10);
  const prompt="Generate ONE genuinely fresh school practice question for the exact topic '"+x.topic+"' in '"+x.subject+"'. This is an answer-first student exercise. The student must supply the answer; NEVER reveal the answer in the question or options. Prefer MCQ with exactly 4 plausible, distinct options when suitable. Make the wording, example, values, names and scenario meaningfully different from every previous question. Unique seed: "+seed+". Return ONLY:\nTYPE: MCQ\nQUESTION: ...\nOPTIONS:\nA) ...\nB) ...\nC) ...\nD) ...\nANSWER: A\nFor a short-answer question use TYPE: SHORT and omit OPTIONS. If the prompt refers to a bolded word, mark exactly the target with **double asterisks**. If it refers to an underlined word, mark exactly the target with __double underscores__. Never reveal the answer anywhere except the final ANSWER line. Previous questions to avoid: "+JSON.stringify(previous.slice(-20));
  const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt,mode:"Practice",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});
  const data=await res.json();if(!res.ok)throw new Error(data.error||"Practice generator unavailable.");
  const raw=String(data.text||"").replace(/\r/g,"").replace(/^\`\`\`[a-z]*\s*/i,"").replace(/\`\`\`$/,"").trim();
  const type=(raw.match(/TYPE\s*:\s*(MCQ|SHORT)/i)||[])[1]?.toUpperCase()||"SHORT";
  const qm=raw.match(/QUESTION\s*:\s*([\s\S]*?)(?=\n\s*OPTIONS\s*:|\n\s*ANSWER\s*:|$)/i);
  const om=raw.match(/OPTIONS\s*:\s*([\s\S]*?)(?=\n\s*ANSWER\s*:|$)/i);
  const am=raw.match(/ANSWER\s*:\s*([^\n]+)/i);
  const question=(qm?.[1]||"").trim();
  const options=(om?.[1]||"").split("\n").map(s=>s.trim()).filter(Boolean).filter(s=>/^[A-D][.)]\s+/i.test(s)).map(s=>s.replace(/^[A-D][.)]\s+/i,"").trim()).filter(Boolean).slice(0,4);
  const answerRaw=(am?.[1]||"").trim(),letter=(answerRaw.match(/^([A-D])(?:[.)]|\s|$)/i)||[])[1]?.toUpperCase();
  const correctAnswer=type==="MCQ"&&letter?options["ABCD".indexOf(letter)]||"":answerRaw;
  if(!question)throw new Error("The tutor returned no question. Try Next question.");
  if(type==="MCQ"&&(options.length!==4||!correctAnswer))throw new Error("The tutor returned an invalid multiple-choice question. Try Next question.");
  state.practice={question,answer:"",feedback:"",result:"",correctAnswer,type,options,busy:false,history:[...previous,question].slice(-20)};
  save();render();
 }catch(e){state.practice={...state.practice,busy:false,feedback:e.message};render()}
}
async function checkPractice(){
 const x=state.currentTask,a=state.practice.answer?.trim();if(!x||!state.practice.question||!a){toast("Choose an answer first.");return}
 state.practice={...state.practice,answer:a,busy:true};render();
 try{
  const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   message:"Evaluate the student's answer. Start exactly with RESULT: CORRECT or RESULT: NEEDS WORK. Then give a small professional explanation in 2-4 short paragraphs or bullets: say what was correct, why it is correct, or why it is wrong and what the correct reasoning is. Do not be repetitive. Question: "+state.practice.question+"\nExpected answer: "+state.practice.correctAnswer+"\nStudent answer: "+a,
   mode:"Practice feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}
  })});
  const data=await res.json();if(!res.ok)throw new Error(data.error||"Feedback unavailable.");
  const text=data.text||"",result=practiceResult(text);
  const topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===x.topic);
  state.data.practice.attempts++;
  state.data.practice.evidence=Array.isArray(state.data.practice.evidence)?state.data.practice.evidence:[];
  state.data.practice.evidence.push({topic:x.topic,subject:x.subject,correct:result==="correct",date:today()});
  state.data.practice.evidence=state.data.practice.evidence.slice(-200);
  if(result==="correct"){
   state.data.practice.correct++;
   if(topic)topic.confidence=Math.min(5,Number(topic.confidence||3)+1);
  }else if(result==="wrong"){
   if(topic)topic.confidence=Math.max(1,Number(topic.confidence||3)-1);
   state.data.mistakes.push({id:"mistake-"+Date.now(),topic:x.topic,subject:x.subject,question:state.practice.question,answer:a,feedback:text,date:today()});
   const reviewDate=add(today(),1),reviewId=x.id+"-mistake-review-"+today();
   if(!state.data.plan.some(p=>p.id===reviewId)){state.data.plan.push({...x,id:reviewId,date:reviewDate,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+10),done:false,kind:"mistake-review"});state.data.plan.sort((u,v)=>u.date.localeCompare(v.date)||v.priority-u.priority)}
  }
  state.practice={...state.practice,busy:false,feedback:text,result};save();render();
 }catch(e){state.practice={...state.practice,busy:false,feedback:e.message,result:""};render()}
}
function startFocusForTask(){const x=state.currentTask;if(!x)return;selectedMinutes=Math.min(60,Math.max(25,x.minutes));seconds=selectedMinutes*60;state.view="focus";render()}
function tutorForTask(mode){const x=state.currentTask;if(!x)return;if(mode==="Practice"){startPractice();return}state.tutorMode=mode;state.view="tutor";render();const i=document.getElementById("tutorInput");if(i){i.value=mode==="Explain simply"?"Explain "+x.topic+" from "+x.subject+" simply, then give me one example.":mode==="Practice"?"Give me practice questions on "+x.topic+" from "+x.subject+". Start easy and get harder.":"Quiz me on "+x.topic+" from "+x.subject+". Do not reveal the answer until I try.";i.focus()}}
function finishCurrentTask(){const x=state.currentTask;if(!x)return;const item=state.data.plan.find(a=>a.id===x.id&&a.date===x.date);if(item){item.done=true;const reviewDay=new Date(x.date+"T00:00:00");reviewDay.setDate(reviewDay.getDate()+3);const rd=localDate(reviewDay);if(rd<x.examDate&&!state.data.plan.some(p=>p.id===x.id+"-review"&&p.date===rd))state.data.plan.push({...x,id:x.id+"-review",date:rd,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+5),done:false,kind:"review"});state.data.plan.sort((a,b)=>a.date.localeCompare(b.date)||b.priority-a.priority)}save();state.view="today";state.currentTask=null;render();toast("Session complete. A later review is scheduled.")}
function timerSet(m){clearInterval(timer);timer=null;selectedMinutes=m;seconds=m*60;render()}
function timerToggle(){const b=document.getElementById("timerbtn");if(timer){clearInterval(timer);timer=null;b.textContent="Resume focus";return}b.textContent="Pause focus";timer=setInterval(()=>{seconds--;const c=document.getElementById("clock");if(c)c.textContent=Math.floor(seconds/60).toString().padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");if(seconds<=0){clearInterval(timer);timer=null;state.data.focus.sessions++;state.data.focus.minutes+=selectedMinutes;if(state.currentTask){const x=state.data.plan.find(a=>a.id===state.currentTask.id&&a.date===state.currentTask.date);if(x)x.done=true}save();b.textContent="Session complete";toast("Focus session complete — task marked done.")}},1000)}
function view(v){state.view=v;state.modal=false;render()}function toast(m){state.toast=m;render();setTimeout(()=>{state.toast="";render()},2200)}
function topicInsight(t){const c=Number(t?.confidence||3);if(c<=1)return "Needs immediate practice";if(c===2)return "Needs another retrieval attempt";if(c===3)return "Still building";if(c===4)return "Looking strong";return "Strong and ready for a check"}
function render(){const root=document.getElementById("app");if(!root)return;try{let c=state.view==="today"?todayPage():state.view==="plan"?planPage():state.view==="subjects"?subjectsPage():state.view==="session"?sessionPage():state.view==="practice"?practicePage():state.view==="focus"?focusPage():state.view==="review"?reviewPage():tutorPage();root.innerHTML=shell(c)}catch(e){console.error(e);state.view="today";try{root.innerHTML=shell('<section><div class="card"><h1>StudySprint</h1><p>That page hit a display error, but your saved subjects and progress are still here.</p><button class="btn primary" onclick="view(\'today\')">Back to Today</button></div></section>')}catch(_){root.innerHTML='<section class="welcome"><div class="card"><h1>StudySprint</h1><p>Your saved study data is still stored on this device.</p><button class="btn primary" onclick="location.reload()">Reload StudySprint</button></div></section>'}}}render();
// Final quality overrides: deterministic grading, fresher questions, topic rotation.
function resetPracticeState(){state.practice={question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:false,history:[],topicCursor:0}}
function practiceTopicForCurrent(){const base=state.currentTask;if(!base)return base;const subject=state.data.subjects.find(s=>s&&s.name===base.subject);const topics=(subject?.topics||[]).filter(t=>t&&t.name);const cursor=Number(state.practice.topicCursor||0);const topic=topics.length?topics[cursor%topics.length].name:base.topic;state.practice.topicCursor=topics.length?(cursor+1)%topics.length:cursor;return {...base,topic}}
async function generatePractice(){
 const base=state.currentTask;if(!base)return;const x=practiceTopicForCurrent();state.currentTask=x;const previous=state.practice.history||[];state.practice={...state.practice,question:"",answer:"",feedback:"",result:"",correctAnswer:"",type:"SHORT",options:[],busy:true};render();
 try{
  const prompt="Generate ONE genuinely fresh school practice question for the exact topic '"+x.topic+"' in '"+x.subject+"'. The student must answer first. NEVER reveal the answer in the question or options. Prefer exactly 4 plausible MCQ options when suitable. Make wording, examples, values and scenarios meaningfully different from every previous question. Return ONLY TYPE: MCQ, QUESTION, OPTIONS A-D, ANSWER; or TYPE: SHORT and omit options. Previous questions: "+JSON.stringify(previous.slice(-20));
  let parsed=null;
  for(let attempt=0;attempt<3&&!parsed;attempt++){
   const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:prompt+"\nFreshness attempt: "+attempt,mode:"Practice",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});
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
async function checkPractice(){
 const x=state.currentTask,a=String(state.practice.answer||"").trim();if(!x||!state.practice.question||!a){toast("Choose an answer first.");return}state.practice={...state.practice,answer:a,busy:true};render();
 try{
  let result=state.practice.type==="MCQ"?(a.toLowerCase()===String(state.practice.correctAnswer||"").trim().toLowerCase()?"correct":"wrong"):"";
  const instruction=result==="correct"?"Start exactly with RESULT: CORRECT. Then give a short professional explanation of why the answer is correct.":result==="wrong"?"Start exactly with RESULT: NEEDS WORK. Then give a short professional explanation of why the answer is wrong and the correct reasoning.":"Evaluate the student's short answer. Start exactly with RESULT: CORRECT or RESULT: NEEDS WORK, then explain briefly and professionally why it is right or wrong and the correct reasoning when needed.";
  const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:instruction+"\nQuestion: "+state.practice.question+"\nExpected answer: "+state.practice.correctAnswer+"\nStudent answer: "+a,mode:"Practice feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});
  const data=await res.json();if(!res.ok)throw new Error(data.error||"Feedback unavailable.");const text=data.text||"";if(!result)result=practiceResult(text);if(!result)throw new Error("The tutor could not grade that answer. Try again.");
  const topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===x.topic);state.data.practice.attempts++;
  if(result==="correct"){state.data.practice.correct++;if(topic)topic.confidence=Math.min(5,Number(topic.confidence||3)+1)}else{if(topic)topic.confidence=Math.max(1,Number(topic.confidence||3)-1);state.data.mistakes.push({id:"mistake-"+Date.now(),topic:x.topic,subject:x.subject,question:state.practice.question,answer:a,feedback:text,date:today()});const reviewDate=add(today(),1),reviewId=x.id+"-mistake-review-"+today();if(!state.data.plan.some(p=>p.id===reviewId)){state.data.plan.push({...x,id:reviewId,date:reviewDate,minutes:Math.min(20,Math.max(15,Math.round(x.minutes/3))),priority:Math.min(100,x.priority+10),done:false,kind:"mistake-review"});state.data.plan.sort((u,v)=>u.date.localeCompare(v.date)||v.priority-u.priority)}}
  state.practice={...state.practice,busy:false,feedback:text,result};save();render();
 }catch(e){state.practice={...state.practice,busy:false,feedback:e.message,result:""};render()}
}
async function generateTutorQuiz(){
 const q=state.tutorQuiz||{},x=state.currentTask;state.tutorQuiz={...q,question:"",answer:"",feedback:"",result:"",correctAnswer:"",options:[],busy:true};render();const topic=x?.topic||state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name)?.name||"your current study topics";const subject=x?.subject||state.data.subjects.find(s=>s&&s.name)?.name||"your subject";const previous=q.history||[];
 try{let parsed=null;for(let attempt=0;attempt<3&&!parsed;attempt++){const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Create ONE fresh student-answer-first MCQ about '"+topic+"' for '"+subject+"'. Exactly 4 plausible options. NEVER reveal the answer in the question or options. Return ONLY TYPE: MCQ, QUESTION, OPTIONS A-D, ANSWER. Do not reuse these previous questions: "+JSON.stringify(previous)+"\nFreshness attempt: "+attempt,mode:"Quiz me",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:x}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz unavailable.");const raw=String(data.text||"").replace(/\r/g,"").trim();const qm=raw.match(/QUESTION\s*:\s*([\s\S]*?)(?=\n\s*OPTIONS\s*:|\n\s*ANSWER\s*:|$)/i),om=raw.match(/OPTIONS\s*:\s*([\s\S]*?)(?=\n\s*ANSWER\s*:|$)/i),am=raw.match(/ANSWER\s*:\s*([A-D])/i);const question=(qm?.[1]||"").trim(),options=(om?.[1]||"").split("\n").map(v=>v.trim()).filter(v=>/^[A-D][.)]\s+/i.test(v)).map(v=>v.replace(/^[A-D][.)]\s+/i,"").trim()).filter(Boolean).slice(0,4),letter=am?.[1]?.toUpperCase(),correctAnswer=letter?options["ABCD".indexOf(letter)]:"";const normalized=question.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();if(question&&options.length===4&&correctAnswer&&!previous.some(v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g," ").trim()===normalized))parsed={question,answer:"",feedback:"",result:"",correctAnswer,options,busy:false,history:[...previous,question].slice(-12)}}if(!parsed)throw new Error("I could not create a genuinely new quiz yet. Tap Next question to try again.");state.tutorQuiz=parsed;render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}
}
async function checkTutorQuiz(){
 const q=state.tutorQuiz;if(!q.question||!q.answer||q.busy||q.result)return;state.tutorQuiz={...q,busy:true};render();
 try{const result=String(q.answer).trim().toLowerCase()===String(q.correctAnswer||"").trim().toLowerCase()?"correct":"wrong";const instruction=result==="correct"?"Start exactly with RESULT: CORRECT. Then give a small professional explanation in 1-2 short paragraphs explaining why the student's choice is correct.":"Start exactly with RESULT: NEEDS WORK. Then give a small professional explanation in 1-2 short paragraphs explaining why the student's choice is wrong and what the correct reasoning is.";const res=await fetch(API_BASE+"/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:instruction+"\nQuestion: "+q.question+"\nExpected answer: "+q.correctAnswer+"\nStudent answer: "+q.answer,mode:"Quiz feedback",context:{subjects:state.data.subjects,exams:state.data.exams,currentTask:state.currentTask}})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Quiz feedback unavailable.");const text=data.text||"",topic=state.data.subjects.flatMap(s=>s.topics||[]).find(t=>t&&t.name===state.currentTask?.topic);state.data.practice.attempts++;if(result==="correct"){state.data.practice.correct++;if(topic)topic.confidence=Math.min(5,Number(topic.confidence||3)+1)}else{if(topic)topic.confidence=Math.max(1,Number(topic.confidence||3)-1);state.data.mistakes.push({id:"tutor-mistake-"+Date.now(),topic:state.currentTask?.topic||"Quiz",subject:state.currentTask?.subject||"Study",question:q.question,answer:q.answer,feedback:text,date:today()})}state.tutorQuiz={...q,busy:false,feedback:text,result};save();render()}catch(e){state.tutorQuiz={...state.tutorQuiz,busy:false,feedback:e.message};render()}
}
function startFocusForTask(){const x=state.currentTask;if(!x)return;selectedMinutes=Math.min(60,Math.max(15,Number(x.minutes)||30));seconds=selectedMinutes*60;state.view="focus";render()}
function focusPage(){const x=state.currentTask,m=selectedMinutes;return `<section>${head("FOCUS",x?"Focus on "+esc(x.topic):"Focus mode.",x?"A distraction-free "+m+"-minute session for "+esc(x.subject)+".":"Use Focus when you want a clean timer without leaving your study plan.")}<div class="focusgrid"><div class="card center">${x?`<div class="focus-context"><span class="pill">${esc(x.subject)}</span><b>${esc(x.topic)}</b><small>${x.minutes} minutes planned · timer set to ${m} minutes</small></div>`:""}<div class="clock" id="clock">${Math.floor(seconds/60).toString().padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}</div><div class="choices"><button onclick="timerSet(25)" class="choice ${m===25?"active":""}">25m</button><button onclick="timerSet(45)" class="choice ${m===45?"active":""}">45m</button><button onclick="timerSet(60)" class="choice ${m===60?"active":""}">60m</button>${![25,45,60].includes(m)?`<button onclick="timerSet(${m})" class="choice active">${m}m plan</button>`:""}</div><button class="btn primary wide" id="timerbtn" onclick="timerToggle()">Start focus</button></div><div class="card"><h2>What to do</h2><div class="rule"><b>1. Recall</b><span>Say what you already know before checking notes.</span></div><div class="rule"><b>2. Learn</b><span>Study one small idea at a time.</span></div><div class="rule"><b>3. Practise</b><span>Use Practice or AI Tutor to test yourself.</span></div><div class="rule"><b>4. Finish</b><span>When the timer ends, the active plan session is marked done.</span></div><div class="focusstat"><b>${state.data.focus.sessions}</b><span>sessions</span><b>${state.data.focus.minutes}</b><span>minutes</span></div></div></div></section>`}

/* MAXI ADAPTIVE ENGINE — turns StudySprint from a timetable into a learning system. */
function learningSnapshot(){
  const topics=state.data.subjects.flatMap(s=>(s.topics||[]).map(t=>({...t,subject:s.name})));
  const attempts=Number(state.data.practice.attempts||0),correct=Number(state.data.practice.correct||0);
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  const weak=topics.filter(t=>Number(t.confidence||3)<=2);
  return {topics,attempts,correct,accuracy,weak};
}
function adaptiveScore(task){
  const t=state.data.subjects.flatMap(s=>s.topics||[]).find(x=>x&&x.name===task.topic);
  const c=Number(t?.confidence||task.confidence||3),days=Math.max(1,StudySprintCore.daysUntil(task.examDate));
  return Math.round((6-c)*22+Math.min(55,Math.round(110/days))+Math.min(15,Number(task.minutes||30)/12));
}
function adaptiveReason(task){
  const t=state.data.subjects.flatMap(s=>s.topics||[]).find(x=>x&&x.name===task.topic);
  const c=Number(t?.confidence||task.confidence||3),days=Math.max(1,StudySprintCore.daysUntil(task.examDate));
  if(c<=2)return 'Low confidence is the strongest signal, so this topic gets attention before easier work.';
  if(days<=3)return 'Your exam is close, so this topic is being moved forward for focused preparation.';
  if(c===3)return 'Your confidence is still developing, so StudySprint is using recall and practice to strengthen it.';
  return 'This topic is already strong, so it is being maintained without taking priority from weaker work.';
}
function todayPage(){
  if(!state.data.subjects.length||!state.data.plan.length)return onboardingPage();
  const tasks=state.data.plan.filter(x=>x.date===today()), all=learningSnapshot();
  const next=state.data.plan.filter(x=>!x.done).sort((a,b)=>adaptiveScore(b)-adaptiveScore(a))[0];
  const todayMinutes=tasks.reduce((n,x)=>n+Number(x.minutes||0),0), completedMinutes=tasks.filter(x=>x.done).reduce((n,x)=>n+Number(x.minutes||0),0);
  const progress=todayMinutes?Math.min(100,Math.round(completedMinutes/todayMinutes*100)):0;
  const exams=state.data.exams.filter(e=>e&&e.date).map(e=>({...e,days:StudySprintCore.daysUntil(e.date)})).sort((a,b)=>a.days-b.days);
  return '<section>'+
    head('TODAY','Your adaptive study coach.','One place to see what matters, why it matters, and what to do next.','<button class="btn primary" onclick="startNext()">Start next</button>')+
    '<div class="stats"><div><small>TODAY</small><b>'+progress+'%</b><span>session progress</span></div><div><small>ACCURACY</small><b>'+all.accuracy+'%</b><span>practice evidence</span></div><div><small>WEAK</small><b>'+all.weak.length+'</b><span>topics needing help</span></div><div><small>EXAM</small><b>'+(exams[0]?exams[0].days+'d':'—')+'</b><span>'+(exams[0]?'nearest exam':'no exam date')+'</span></div></div>'+
    '<div class="card adaptive-hero"><div class="kicker">WHY THIS IS NEXT</div><h2>'+(next?esc(next.topic):'You are caught up.')+'</h2><p>'+(next?esc(adaptiveReason(next)):'Complete a practice question and StudySprint will start learning from your results.')+'</p>'+(next?'<div class="adaptive-signals"><span>Weakness <b>'+(Number(next.confidence||3)<=2?'HIGH':'LOW')+'</b></span><span>Urgency <b>'+(StudySprintCore.daysUntil(next.examDate)<=3?'HIGH':'NORMAL')+'</b></span><span>Action <b>LEARN + PRACTISE</b></span></div>':'')+'</div>'+
    '<div class="cols"><div class="card"><div class="cardhead"><div><h2>Today</h2><p>Do the first useful thing. The rest can wait.</p></div><span class="pill">'+date(today())+'</span></div>'+(tasks.length?tasks.map(task).join(''):'<div class="empty">Nothing scheduled today. <button class="text" onclick="regen()">Refresh my plan</button></div>')+'</div>'+
    '<div class="stack"><div class="card"><div class="cardhead"><h2>Learning signals</h2><span class="pill">LIVE</span></div>'+(all.topics.slice().sort((a,b)=>Number(a.confidence||3)-Number(b.confidence||3)).slice(0,5).map(t=>'<div class="signal"><div><b>'+esc(t.name)+'</b><small>'+esc(t.subject)+'</small></div><strong>'+Number(t.confidence||3)+'/5</strong></div>').join('')||'<div class="empty">Add topics to start building learning evidence.</div>')+'</div>'+
    '<div class="card dark"><div class="kicker">STUDY LOOP</div><div class="loop"><b>Learn</b><span>→</span><b>Recall</b><span>→</span><b>Practise</b><span>→</span><b>Review</b></div><p>Your answers change what comes next.</p></div></div></div>'+
    '<div class="callout"><b>Minutes are not mastery.</b><span>StudySprint cares more about what you can recall and use than how long a timer ran.</span></div></section>';
}