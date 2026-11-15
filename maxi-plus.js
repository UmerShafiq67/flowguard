/* StudySprint MAXI+ layer — adaptive decisions, exam readiness, and high-value shortcuts. */
(function(){
  function allTopics(){
    return state.data.subjects.flatMap(s=>(s.topics||[]).filter(t=>t&&t.name).map(t=>({...t,subject:s.name})));
  }
  function topicByName(name){return allTopics().find(t=>t.name===name)}
  function dueReviews(){
    const now=today();
    return state.data.plan.filter(x=>x&&!x.done&&x.date<=now&&x.kind==="review").sort((a,b)=>adaptiveScore(b)-adaptiveScore(a));
  }
  function readinessPlus(){
    const topics=allTopics(), attempts=Number(state.data.practice.attempts||0), correct=Number(state.data.practice.correct||0);
    const accuracy=attempts?correct/attempts:0;
    const mastery=topics.length?topics.reduce((n,t)=>n+(Number(t.confidence||3)/5),0)/topics.length:0;
    const due=dueReviews().length;
    const plan=state.data.plan, completed=plan.filter(x=>x.done).length, total=plan.length;
    const coverage=total?completed/total:0;
    const evidence=Math.min(1,attempts/10);
    const reviewHealth=due?Math.max(0,1-due/8):1;
    const score=Math.round((mastery*.42+accuracy*.23+coverage*.18+evidence*.10+reviewHealth*.07)*100);
    return {score,accuracy:Math.round(accuracy*100),mastery:Math.round(mastery*100),coverage:Math.round(coverage*100),due,evidence:Math.round(evidence*100),topics:topics.length};
  }
  function readinessLabel(n){return n>=85?"Strong":n>=70?"On track":n>=50?"Building":"Needs work"}
  function bestTaskForMinutes(mins){
    const candidates=state.data.plan.filter(x=>!x.done).map(x=>({...x,score:adaptiveScore(x)+Math.max(0,25-Math.abs(Number(x.minutes||30)-mins))}));
    return candidates.sort((a,b)=>b.score-a.score)[0]||state.data.plan.find(x=>!x.done);
  }
  window.startQuickStudy=function(mins){
    const x=bestTaskForMinutes(Number(mins)||20);
    if(!x){toast("You are caught up. Add another topic or practice a weak one.");return}
    state.currentTask={...x,minutes:Math.min(Number(mins)||20,Math.max(15,Number(x.minutes)||30))};
    state.view="session";render();
  };
  window.showExamReadiness=function(){state.view="review";render();setTimeout(()=>document.getElementById("readinessCard")?.scrollIntoView({behavior:"smooth",block:"start"}),30)}
  function readinessCard(){
    const r=readinessPlus();
    return '<div class="card readiness-card" id="readinessCard"><div class="readiness-top"><div><div class="kicker">EXAM READINESS</div><h2>'+r.score+'% · '+readinessLabel(r.score)+'</h2><p>A learning-evidence score, not a timer score. It grows when you can recall, practise, and retain what you study.</p></div><div class="readiness-ring"><b>'+r.score+'%</b><span>ready</span></div></div><div class="readiness-bars"><div><span>Topic confidence</span><b>'+r.mastery+'%</b><i><em style="width:'+r.mastery+'%"></em></i></div><div><span>Practice evidence</span><b>'+r.accuracy+'%</b><i><em style="width:'+r.accuracy+'%"></em></i></div><div><span>Plan coverage</span><b>'+r.coverage+'%</b><i><em style="width:'+r.coverage+'%"></em></i></div><div><span>Review health</span><b>'+(r.due? r.due+' due':'Clear')+'</b><i><em style="width:'+Math.max(0,100-r.due*12)+'%"></em></i></div></div><div class="readiness-actions"><button class="btn secondary" onclick="startQuickStudy(20)">I have 20 min</button><button class="btn secondary" onclick="startQuickStudy(45)">I have 45 min</button><button class="btn primary" onclick="view(\'practice\')">Prove it now</button></div></div>';
  }
  function evidenceCard(){
    const r=readinessPlus(), weak=allTopics().filter(t=>Number(t.confidence||3)<=2).length;
    return '<div class="card evidence-card"><div class="cardhead"><div><div class="kicker">PROOF OF LEARNING</div><h2>What your results say</h2></div><span class="pill">LIVE</span></div><div class="evidence-grid"><div><b>'+r.accuracy+'%</b><span>practice accuracy</span></div><div><b>'+r.evidence+'%</b><span>practice evidence</span></div><div><b>'+weak+'</b><span>weak topics</span></div><div><b>'+r.due+'</b><span>reviews due</span></div></div><p class="mutedline">Strong scores are earned by answers and later checks — not by simply keeping the timer running.</p></div>';
  }
  const oldToday=todayPage;
  window.todayPage=function(){
    const html=oldToday();
    if(!state.data.subjects.length||!state.data.plan.length)return html;
    const marker='</section>';
    const extra='<div class="maxi-two-col">'+readinessCard()+evidenceCard()+'</div><div class="card rescue-card"><div><div class="kicker">NO TIME TO PLAN?</div><h2>Tell StudySprint how much time you have.</h2><p>It picks the highest-value unfinished session using weakness, urgency, and learning evidence.</p></div><div class="rescue-actions"><button class="btn secondary" onclick="startQuickStudy(15)">15 min</button><button class="btn secondary" onclick="startQuickStudy(20)">20 min</button><button class="btn secondary" onclick="startQuickStudy(30)">30 min</button><button class="btn primary" onclick="startQuickStudy(45)">45 min</button></div></div>';
    return html.slice(0,html.lastIndexOf(marker))+extra+marker;
  };
  window.reviewPage=function(){
    const s=learningSnapshot(), weak=s.weak.slice().sort((a,b)=>Number(a.confidence||3)-Number(b.confidence||3)), mistakes=state.data.mistakes||[], r=readinessPlus(), due=dueReviews();
    return '<section>'+head("REVIEW","Your learning evidence.","See what is weak, what is improving, and whether your preparation is actually holding up.",'<button class="btn primary" onclick="view(\'practice\')">Practice weak topics</button>')+
      readinessCard()+
      '<div class="review"><div class="card"><span class="metric-label">ACCURACY</span><b class="big">'+s.accuracy+'%</b><h2>Practice accuracy</h2><p>'+s.correct+' correct out of '+s.attempts+' attempts.</p></div><div class="card"><span class="metric-label">WEAK</span><b class="big">'+s.weak.length+'</b><h2>Topics needing help</h2><p>'+(weak.slice(0,3).map(t=>esc(t.name)).join(", ")||"Nothing weak right now.")+'</p></div><div class="card"><span class="metric-label">DUE</span><b class="big">'+due.length+'</b><h2>Reviews due</h2><p>'+(due.length?"Do these before adding more easy work.":"Your review queue is clear.")+'</p></div></div>'+
      '<div class="reviewgrid"><div class="card advice"><div class="cardhead"><div><h2>Priority topics</h2><p>Study the places where another retrieval attempt can create the most improvement.</p></div></div>'+
      (weak.map(t=>'<div class="mistake"><div><b>'+esc(t.name)+'</b><small>'+esc(t.subject)+' · '+topicInsight(t)+'</small></div><span>'+Number(t.confidence||3)+'/5</span></div>').join("")||'<div class="empty">No weak topics. Keep testing yourself to protect your progress.</div>')+
      '</div><div class="card advice"><h2>How StudySprint judges readiness</h2><div class="rule"><b>Topic confidence</b><span>How confidently you have been performing on a topic.</span></div><div class="rule"><b>Practice evidence</b><span>Whether you can actually answer questions, not just read notes.</span></div><div class="rule"><b>Plan coverage</b><span>How much of the planned work you have completed.</span></div><div class="rule"><b>Review health</b><span>Whether older learning is surviving later checks.</span></div><div class="readiness-note"><b>'+r.score+'% · '+readinessLabel(r.score)+'</b><span>Readiness is a signal, not a guarantee of an exam result.</span></div></div></div>'+
      '<div class="card advice"><div class="cardhead"><div><h2>Saved mistakes</h2><p>Missed questions stay here so the next review has a reason.</p></div></div>'+
      (mistakes.slice(-8).reverse().map(m=>'<div class="mistake"><div><b>'+esc(m.topic)+'</b><small>'+esc(m.subject)+' · '+date(m.date)+'</small></div><span>Review</span></div>').join("")||'<div class="empty">No saved mistakes yet.</div>')+'</div></section>';
  };
  window.subjectsPage=function(){
    const subjects=state.data.subjects.filter(s=>s&&s.name);
    return '<section>'+head("SUBJECTS","Your subjects.","Every topic has a live learning signal. Open Practice when you want to turn that signal into evidence.",'<button class="btn primary" onclick="openSetup()">Edit subjects</button>')+
      (subjects.length?'<div class="subjectgrid">'+subjects.map(s=>{
        const topics=(s.topics||[]).filter(t=>t&&t.name);
        return '<div class="card"><div class="subject"><span>'+esc(s.name[0]||"S")+'</span><div><h2>'+esc(s.name)+'</h2><small>'+topics.length+' topic'+(topics.length===1?"":"s")+'</small></div></div>'+
        topics.map(t=>'<div class="topic topic-rich"><div class="topic-main"><span>'+esc(t.name)+'</span><small>'+(["","Very weak","Weak","Okay","Good","Strong"][Number(t.confidence||3)]||"Okay")+'</small><i><em style="width:'+Math.max(20,Number(t.confidence||3)*20)+'%"></em></i></div><b class="c'+Number(t.confidence||3)+'">'+Number(t.confidence||3)+'/5</b><button class="topic-practice" onclick="startTopicPractice(\''+esc(s.name).replace(/'/g,"\\'")+\',\''+esc(t.name).replace(/'/g,"\\'")+"')">Practice</button></div>").join("")+
        '</div>';
      }).join("")+'</div>':'<div class="card empty">No subjects yet. <button class="btn primary" onclick="openSetup()">Add your first subject</button></div>')+'</section>';
  };
  window.startTopicPractice=function(subject,topic){
    const s=state.data.subjects.find(x=>x.name===subject); const t=s?.topics?.find(x=>x.name===topic);
    if(!s||!t){toast("Topic not found.");return}
    const exam=state.data.exams.find(e=>e.subjectId===s.id);
    state.currentTask={id:"topic-"+Date.now(),subject:s.name,topic:t.name,examDate:exam?.date||today(),minutes:Math.min(30,Math.max(15,Number(t.minutes)||30)),priority:adaptiveScore({topic:t.name,confidence:t.confidence,minutes:t.minutes,examDate:exam?.date||today()})};
    resetPracticeState();state.view="practice";render();setTimeout(()=>generatePractice(),40);
  };
  window.focusPage=function(){
    const x=state.currentTask,m=selectedMinutes;
    return '<section>'+head("FOCUS",x?"Focus on "+esc(x.topic):"Focus mode.",x?"A clean "+m+"-minute session for "+esc(x.subject)+".":"A distraction-free timer for the session you choose.")+
      '<div class="focusgrid"><div class="card center">'+(x?'<div class="focus-context"><span class="pill">'+esc(x.subject)+'</span><b>'+esc(x.topic)+'</b><small>'+x.minutes+' minutes planned · timer set to '+m+' minutes</small></div>':'')+
      '<div class="clock" id="clock">'+Math.floor(seconds/60).toString().padStart(2,"0")+':'+String(seconds%60).padStart(2,"0")+'</div><div class="choices"><button onclick="timerSet(25)" class="choice '+(m===25?"active":"")+'">25m</button><button onclick="timerSet(45)" class="choice '+(m===45?"active":"")+'">45m</button><button onclick="timerSet(60)" class="choice '+(m===60?"active":"")+'">60m</button>'+(![25,45,60].includes(m)?'<button onclick="timerSet('+m+')" class="choice active">'+m+'m plan</button>':'')+'</div><button class="btn primary wide" id="timerbtn" onclick="timerToggle()">Start focus</button></div>'+
      '<div class="card"><div class="kicker">FOCUS LOOP</div><h2>Do less, prove more.</h2><div class="focussteps"><div><b>1</b><span>Recall what you know before opening notes.</span></div><div><b>2</b><span>Learn one small idea.</span></div><div><b>3</b><span>Practice without looking at the answer.</span></div><div><b>4</b><span>Finish with a quick self-check.</span></div></div><div class="focusstat"><b>'+state.data.focus.sessions+'</b><span>sessions</span><b>'+state.data.focus.minutes+'</b><span>minutes</span></div></div></div></section>';
  };
  const oldShell=shell;
  window.shell=function(c){
    return oldShell(c);
  };
  setTimeout(()=>render(),0);
})();