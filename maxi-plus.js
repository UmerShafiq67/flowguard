/* StudySprint MAXI+ layer — adaptive decisions, exam readiness, and high-value shortcuts. */
(function(){
  function allTopics(){
    return state.data.subjects.flatMap(s=>(s.topics||[]).filter(t=>t&&t.name).map(t=>({...t,subject:s.name})));
  }
  function topicByName(name){return allTopics().find(t=>t.name===name)}
  function dueReviews(){
    const now=today();
    return state.data.plan.filter(x=>x&&!x.done&&x.date<=now&&(x.kind==="review"||x.kind==="mistake-review")).sort((a,b)=>adaptiveScore(b)-adaptiveScore(a));
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
        topics.map(t=>'<div class="topic topic-rich"><div class="topic-main"><span>'+esc(t.name)+'</span><small>'+(["","Very weak","Weak","Okay","Good","Strong"][Number(t.confidence||3)]||"Okay")+'</small><i><em style="width:'+Math.max(20,Number(t.confidence||3)*20)+'%"></em></i></div><b class="c'+Number(t.confidence||3)+'">'+Number(t.confidence||3)+'/5</b><button class="topic-practice" data-subject="'+esc(s.id)+'" data-topic="'+esc(t.id)+'" onclick="startTopicPracticeById(this.dataset.subject,this.dataset.topic)">Practice</button></div>').join("")+
        '</div>';
      }).join("")+'</div>':'<div class="card empty">No subjects yet. <button class="btn primary" onclick="openSetup()">Add your first subject</button></div>')+'</section>';
  };
  window.startTopicPracticeById=function(subjectId,topicId){
    const s=state.data.subjects.find(x=>x.id===subjectId); const t=s?.topics?.find(x=>x.id===topicId);
    if(!s||!t){toast("Topic not found.");return}
    const exam=state.data.exams.find(e=>e.subjectId===s.id);
    state.currentTask={id:"topic-"+Date.now(),subject:s.name,topic:t.name,examDate:exam?.date||today(),minutes:Math.min(30,Math.max(15,Number(t.minutes)||30)),priority:adaptiveScore({topic:t.name,confidence:t.confidence,minutes:t.minutes,examDate:exam?.date||today()})};
    resetPracticeState();state.view="practice";render();setTimeout(()=>generatePractice(),40);
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

/* STUDYSPRINT MONETIZATION FOUNDATION — clear value, no fake checkout, no lock-in. */
(function(){
  const PREMIUM_FEATURES=[
    ["Adaptive Exam Prep","A deeper priority engine that continuously reorders work from weakness, urgency, practice evidence and retention."],
    ["Source-based Practice","Turn your own notes and study material into targeted practice instead of generic questions."],
    ["Advanced Review","Long-term retention checks, mistake resurfacing and stronger spaced-review decisions."],
    ["Deep Readiness","More detailed evidence about what is secure, shaky and still unproven before an exam."],
    ["High AI allowance","More AI Tutor and practice generation for students who use StudySprint heavily."]
  ];
  function premiumPage(){
    return '<section>'+head("STUDYSPRINT PLUS","More depth. Same learning system.","Plus is for students who want heavier AI use, their own study material, deeper review and stronger readiness signals. The free plan keeps the core learning loop useful.",'<button class="btn secondary" onclick="view(\'today\')">Back to Today</button>')+
      '<div class="premium-hero card"><div><div class="kicker">STUDYSPRINT PLUS</div><h2>Upgrade when the core loop is not enough.</h2><p>StudySprint is not paywalled at the point of learning. Free gives you the planner, practice, Focus, basic Review and core Tutor. Plus adds the expensive, high-intensity features.</p><div class="premium-actions"><button class="btn primary" onclick="startPlusCheckout()">Get Plus</button><button class="btn secondary" onclick="view(\'practice\')">Keep using Free</button></div></div><div class="premium-badge"><b>PLUS</b><span>verified access</span></div></div>'+
      '<div class="card"><div class="kicker">WHICH ONE IS FOR YOU?</div><div class="plan-compare"><div><b>Free</b><span>For building the habit and completing the full learn → practice → review loop.</span><strong>$0</strong><small>Start here. No card required.</small></div><div class="plan-plus"><b>Plus</b><span>For heavier AI study, your own material, unlimited practice generation and deeper learning analysis.</span><strong>Price shown at checkout</strong><small>Payment and entitlement are verified server-side.</small></div></div></div>'+
      '<div class="premium-grid">'+PREMIUM_FEATURES.map((f,i)=>'<div class="card premium-feature"><div class="premium-number">0'+(i+1)+'</div><h3>'+esc(f[0])+'</h3><p>'+esc(f[1])+'</p><span class="premium-state">PLUS</span></div>').join('')+'</div>'+
      '<div class="card premium-compare"><div class="cardhead"><div><div class="kicker">NO CONFUSION</div><h2>What stays free?</h2><p>Core learning should never disappear just because you did not upgrade.</p></div></div><div class="rule"><b>Free forever core</b><span>Subjects, adaptive plan, Today, Focus, core Practice, basic Review, Progress and local backup remain useful without Plus.</span></div><div class="rule"><b>Plus depth</b><span>Higher AI capacity, study-material analysis and advanced learning signals are reserved for Plus.</span></div></div>'+
      '<div class="callout"><b>Billing status.</b><span id="billingStatus">Checking checkout configuration…</span></div></section>';
  }
  window.premiumPage=premiumPage;
  window.openPremium=function(){state.view="premium";render()};
  window.joinPremiumWaitlist=function(){toast("Plus is not charging yet. We can add a real waitlist when you are ready.")};
  const oldNav=nav;
  window.nav=function(v,t,i){
    if(v==="premium")return '<button class="nav '+(state.view===v?"active":"")+'" onclick="openPremium()"><span>◆</span>Plus</button>';
    return oldNav(v,t,i);
  };
  const oldShell2=window.shell;
  window.shell=function(c){
    const base=oldShell2(c);
    return base.replace('<button class="ghost" onclick="openSetup()">Set up my plan</button>','<button class="ghost" onclick="openPremium()">Plus</button><button class="ghost" onclick="openSetup()">Set up my plan</button>');
  };
  const oldRender=window.render;
  window.render=function(){
    if(state.view==="premium"){const root=document.getElementById("app");if(!root)return;try{root.innerHTML=window.shell(premiumPage())}catch(e){console.error(e);state.view="today";oldRender()}return}
    oldRender();
  };
  setTimeout(()=>render(),0);
})();


/* PREMIUM ACCESS + FREE TIER GUARDRAILS
   Product rule: free stays useful; Plus unlocks the heavy features.
   The entitlement is deliberately verified-state based. No client-side
   "unlock" control is exposed, so a future checkout can set the verified
   entitlement from the server without changing the product UI. */
(function(){
  const FREE_LIMITS={ai:5,practice:8,quiz:3};
  function ensureAccount(){
    state.data.account=state.data.account&&typeof state.data.account==="object"?state.data.account:{};
    state.data.account.plan=state.data.account.plan==="plus"?"plus":"free";
    state.data.account.entitlement=state.data.account.entitlement==="verified"?"verified":"none";
    state.data.account.usage=state.data.account.usage&&typeof state.data.account.usage==="object"?state.data.account.usage:{};
    const d=today();
    if(state.data.account.usage.date!==d)state.data.account.usage={date:d,ai:0,practice:0,quiz:0};
    return state.data.account;
  }
  function isPlus(){
    const a=ensureAccount();
    return a.plan==="plus"&&a.entitlement==="verified";
  }
  function usageKey(kind){return kind==="practice"?"practice":kind==="quiz"?"quiz":"ai"}
  function allowed(kind){
    if(isPlus())return true;
    const a=ensureAccount(),k=usageKey(kind),used=Number(a.usage[k]||0),limit=FREE_LIMITS[k];
    if(used>=limit){
      openPremium();
      toast("You have reached today's free "+(k==="ai"?"AI Tutor":k==="practice"?"Practice":"Quiz")+" limit. Plus removes this limit.");
      return false;
    }
    a.usage[k]=used+1;
    save();
    return true;
  }
  function lockedFeature(name,detail){
    openPremium();
    toast(name+" is a Plus feature.");
    return false;
  }
  window.studySprintIsPlus=isPlus;
  window.studySprintFreeLimits=FREE_LIMITS;
  window.studySprintGate=allowed;
  window.studySprintLock=lockedFeature;

  const oldGeneratePractice=window.generatePractice;
  window.generatePractice=async function(){
    if(!allowed("practice"))return;
    return oldGeneratePractice();
  };

  const oldGenerateTutorQuiz=window.generateTutorQuiz;
  if(oldGenerateTutorQuiz)window.generateTutorQuiz=async function(){
    if(!allowed("quiz"))return;
    return oldGenerateTutorQuiz();
  };

  const oldAskTutor=window.askTutor;
  if(oldAskTutor)window.askTutor=async function(){
    const file=document.getElementById("tutorFile")?.files?.[0];
    if(file&&!isPlus())return lockedFeature("Study material uploads","Upload your own notes, PDFs and images with Plus.");
    if(!allowed("ai"))return;
    return oldAskTutor();
  };

  const oldTutorPage=window.tutorPage;
  window.tutorPage=function(){
    const html=oldTutorPage();
    if(isPlus())return html;
    const lock='<div class="card plus-lock"><div class="kicker">PLUS</div><h2>Bring your own study material</h2><p>Free Tutor stays available for questions. Plus adds image/PDF study-material analysis and a higher daily AI allowance.</p><button class="btn primary" onclick="openPremium()">See Plus</button></div>';
    return html.replace('</section>',lock+'</section>');
  };

  const oldReviewPage=window.reviewPage;
  window.reviewPage=function(){
    const html=oldReviewPage();
    if(isPlus())return html;
    const lock='<div class="card plus-lock"><div class="kicker">PLUS</div><h2>Deep readiness</h2><p>Free Review shows your weak topics and mistakes. Plus adds deeper retention health, exam-readiness evidence and advanced review decisions.</p><button class="btn primary" onclick="openPremium()">Unlock Plus</button></div>';
    return html.replace('</section>',lock+'</section>');
  };

  const oldPremiumPage=window.premiumPage;
  window.premiumPage=function(){
    const base=oldPremiumPage();
    const status=isPlus()
      ? '<div class="callout premium-status"><b>Plus active.</b><span>Your verified Plus entitlement is active. Premium features are available.</span></div>'
      : '<div class="callout premium-status"><b>Free plan active.</b><span>You still have the complete core study loop. Plus is reserved for heavier AI use, your own study material and deeper learning analysis.</span></div>';
    return base.replace('<div class="premium-hero card">',status+'<div class="premium-hero card">');
  };

  /* Keep the Plus entry visible without changing the core navigation markup. */
  const oldShell3=window.shell;
  window.shell=function(c){
    const base=oldShell3(c);
    const label=isPlus()?"Plus active":"Plus";
    return base.replace('<button class="ghost" onclick="openPremium()">Plus</button>','<button class="ghost" onclick="openPremium()">'+label+'</button>');
  };

  ensureAccount();
  save();
})();


/* PADDLE CHECKOUT + VERIFIED ENTITLEMENT BRIDGE
   Checkout is configuration-driven: no secret API key is stored in the browser.
   A live client token and price ID are required before real charges can occur. */
(function(){
  const BILL=window.STUDYSPRINT_BILLING||{};
  function deviceId(){
    let id=localStorage.getItem("studysprint_device_id");
    if(!id){id="ss_"+crypto.randomUUID();localStorage.setItem("studysprint_device_id",id)}
    return id;
  }
  window.studySprintDeviceId=deviceId;

  async function syncEntitlement(){
    try{
      const r=await fetch((window.STUDYSPRINT_API_BASE||"")+"/api/entitlement?deviceId="+encodeURIComponent(deviceId()),{cache:"no-store"});
      const x=await r.json();
      if(x&&x.entitlement==="verified"&&x.plan==="plus"){
        state.data.account=state.data.account||{};
        state.data.account.plan="plus";
        state.data.account.entitlement="verified";
        state.data.account.expiresAt=x.expiresAt||null;
        save();
      }else if(x&&x.configured===true){
        state.data.account=state.data.account||{};
        state.data.account.plan="free";
        state.data.account.entitlement="none";
        save();
      }
    }catch(e){console.warn("Plus entitlement sync unavailable",e)}
  }
  window.studySprintSyncEntitlement=syncEntitlement;

  function billingConfigured(){
    return BILL.provider==="paddle"&&BILL.clientToken&&BILL.plusPriceId&&window.Paddle;
  }
  window.studySprintBillingStatus=function(){
    const el=document.getElementById("billingStatus");
    if(!el)return;
    el.textContent=billingConfigured()
      ?"Checkout is configured. Payment is verified by the server before Plus access is granted."
      :"Checkout is safely disabled until the store's public client token and Plus price are connected. No payment can be taken from this build.";
  };

  window.startPlusCheckout=function(){
    if(!billingConfigured()){
      openPremium();
      toast("Plus checkout is being prepared. Billing configuration is not connected yet.");
      return;
    }
    try{
      if(!window.__studySprintPaddleReady){
        Paddle.Initialize({
          token:BILL.clientToken,
          eventCallback:function(event){
            if(event?.name==="checkout.completed"||event?.name==="checkout.closed"){
              setTimeout(syncEntitlement,1500);
            }
          }
        });
        window.__studySprintPaddleReady=true;
      }
      Paddle.Checkout.open({
        items:[{priceId:BILL.plusPriceId,quantity:1}],
        customData:{deviceId:deviceId(),product:"studysprint_plus"},
        settings:{displayMode:"overlay",theme:"light",variant:"one-page"}
      });
    }catch(e){
      console.error(e);
      toast("Plus checkout could not open. Please try again.");
    }
  };

  window.startPlusCheckoutReady=function(){
    if(billingConfigured())return startPlusCheckout();
    openPremium();
    toast("Checkout is not configured yet, so no payment can be taken.");
  };

  syncEntitlement();
  setTimeout(()=>window.studySprintBillingStatus&&window.studySprintBillingStatus(),40);
})();


/* CONVERSION EXPERIENCE — make the product explain its value before asking for an upgrade. */
(function(){
  const oldOnboarding=window.onboardingPage;
  window.onboardingPage=function(){
    const base=oldOnboarding();
    const value='<div class="card conversion-card"><div class="kicker">WHY STUDYSPRINT</div><h2>Start with the system. Upgrade when you want more depth.</h2><p>StudySprint is designed so a student can feel the learning engine before paying. Free gives you the core loop; Plus is for students who want heavier AI use, their own study material and deeper readiness signals.</p><div class="conversion-points"><div><b>01</b><strong>Find your next move</strong><span>Your plan turns subjects, confidence, time and deadlines into a clear next action.</span></div><div><b>02</b><strong>Prove your knowledge</strong><span>Practice creates evidence instead of assuming that reading means mastery.</span></div><div><b>03</b><strong>Go deeper with Plus</strong><span>When you need more AI, your own material and stronger analysis, Plus extends the same system.</span></div></div><button class="btn primary" onclick="openPremium()">See what Plus adds →</button></div>';
    return base.replace('</section>',value+'</section>');
  };

  const oldShell4=window.shell;
  window.shell=function(c){
    let base=oldShell4(c);
    const sidebarNeed='<div class="nav-extra">'+nav("progress","Progress","◌")+nav("tutor","AI Tutor","✦")+'</div>';
    base=base.replace(nav("account","Account","◎"),sidebarNeed+nav("account","Account","◎"));
    return base;
  };

  const oldToday2=window.todayPage;
  window.todayPage=function(){
    const html=oldToday2();
    if(!state.data.subjects.length||!state.data.plan.length)return html;
    const banner='<div class="card conversion-card today-value"><div><div class="kicker">WHY PLUS?</div><h2>Get more from the same learning engine.</h2><p>Free already gives you the core adaptive loop. Plus is for students who want more AI capacity, their own study material and deeper readiness analysis.</p></div><button class="btn primary" onclick="openPremium()">Compare Free vs Plus →</button></div>';
    return html.replace('</section>',banner+'</section>');
  };
})();
