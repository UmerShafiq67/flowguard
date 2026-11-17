/* StudySprint V30 — product-story redesign
   Built around the product, not decoration:
   source -> understand -> practice -> evidence -> adapt.
*/
(function(){
  const A="./assets/";
  const photos={
    hero:"https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=1800",
    notes:"https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=1600",
    study:"https://images.unsplash.com/photo-1753613648131-f8189bf05bcf?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=1600",
    desk:"https://images.unsplash.com/photo-1741699427799-3fbb70fce948?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=1600",
    library:"https://images.unsplash.com/photo-1759984782211-3a02ca78e6ac?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=1600"
  };
  const mark='<img src="'+A+'studysprint-mark.svg" alt="StudySprint" aria-hidden="true">';
  const copy={
    en:{nav:["How it works","Adaptive engine","Practice","Pricing"],heroK:"ADAPTIVE LEARNING SYSTEM",heroH:"Stop asking what to study.\nKnow what to do next.",heroP:"StudySprint turns your subjects, deadlines, confidence and real practice results into a living study system that changes with you.",cta:"Build my study system",secondary:"See how it works"},
    ur:{nav:["کیسے کام کرتا ہے","Adaptive engine","Practice","Pricing"],heroK:"ذہین لرننگ سسٹم",heroH:"یہ مت سوچو کیا پڑھنا ہے۔\nاگلا قدم جان لو۔",heroP:"StudySprint آپ کے مضامین، امتحانات، اعتماد اور practice results کو ایک ایسے study system میں بدلتا ہے جو آپ کے ساتھ بدلتا ہے۔",cta:"اپنا study system بنائیں",secondary:"دیکھیں کیسے کام کرتا ہے"},
    hi:{nav:["कैसे काम करता है","Adaptive engine","Practice","Pricing"],heroK:"एडैप्टिव लर्निंग सिस्टम",heroH:"क्या पढ़ना है, यह मत सोचो।\nअगला कदम जानो।",heroP:"StudySprint आपके subjects, deadlines, confidence और practice results को एक ऐसे study system में बदलता है जो आपके साथ बदलता है।",cta:"अपना study system बनाएं",secondary:"देखें कैसे काम करता है"}
  };
  let lang="en";
  function text(k){return copy[lang][k]||copy.en[k]}
  function language(){return '<div class="v30-language"><button onclick="v30Lang(event)">EN <span>⌄</span></button><div><button onclick="v30SetLang(\'en\')">English</button><button onclick="v30SetLang(\'ur\')">اردو</button><button onclick="v30SetLang(\'hi\')">हिन्दी</button></div></div>'}
  window.v30Lang=function(e){e.stopPropagation();e.currentTarget.parentElement.classList.toggle("open")};
  window.v30SetLang=function(v){lang=v;document.querySelectorAll(".v30-language").forEach(x=>x.classList.remove("open"));render()};
  document.addEventListener("click",()=>document.querySelectorAll(".v30-language").forEach(x=>x.classList.remove("open")));
  const pageQuotes={
    today:["The secret of getting ahead is getting started.","Mark Twain"],
    plan:["A goal without a plan is just a wish.","Antoine de Saint-Exupéry"],
    practice:["Success is the sum of small efforts, repeated day in and day out.","Robert Collier"],
    tutor:["The important thing is not to stop questioning.","Albert Einstein"],
    review:["We are what we repeatedly do.","Will Durant"],
    progress:["What gets measured gets improved.","Peter Drucker"],
    subjects:["The more you practice, the better you become.","StudySprint"],
    focus:["Concentration is the secret of strength.","Ralph Waldo Emerson"],
    account:["Your habits shape your future more than your intentions do.","StudySprint"],
    session:["Learning is not a spectator sport.","D. Blocher"]
  };
  function quote(v){const q=pageQuotes[v]||pageQuotes.today;return '<aside class="v30-quote"><span>“</span><div><p>'+esc(q[0])+'</p><small>— '+esc(q[1])+'</small></div></aside>'}
  const pagePhotos={today:photos.hero,plan:photos.notes,practice:photos.study,tutor:photos.desk,review:photos.library,progress:photos.notes,subjects:photos.study,focus:photos.desk,account:photos.library,session:photos.hero};
  window.shell=function(content){
    const primary=[["today","Today"],["plan","Plan"],["practice","Practice"],["tutor","Tutor"],["review","Review"]];
    const nav=primary.map(([v,t])=>'<button class="v30-nav '+(state.view===v?"active":"")+'" onclick="view(\''+v+'\')">'+t+'</button>').join("");
    const more=[["progress","Progress & insights"],["subjects","Subjects"],["focus","Focus"],["account","Account & sync"]];
    return '<header class="v30-appbar"><button class="v30-appbrand" onclick="view(\'today\')" aria-label="StudySprint home">'+mark+'<span><b>StudySprint</b><small>ADAPTIVE LEARNING</small></span></button><nav class="v30-navrow">'+nav+'</nav><div class="v30-appactions"><button onclick="view(\'progress\')">Progress</button><div class="v30-more"><button onclick="v30More(event)">More <span>⌄</span></button><div class="v30-menu">'+more.map(x=>'<button onclick="view(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div></div><button class="v30-plus" onclick="openPremium()">Plus</button><button class="v30-edit" onclick="openSetup()">Edit plan</button></div></header>'+
    '<main class="app-main v30-main view-'+state.view+'"><div class="v30-pagehero"><div><span>STUDYSPRINT / '+String(state.view).toUpperCase()+'</span><h2>'+({today:"Your study command center",plan:"A plan that can change",practice:"Turn answers into evidence",tutor:"Understand without getting stuck",review:"Bring weak topics back",progress:"See what is actually changing",subjects:"Know your learning map",focus:"Protect the time you have",account:"Your study system, your data",session:"Make this session count"}[state.view]||"Keep learning")+'</h2><p>One clear action, backed by evidence.</p></div><div class="v30-pagephoto"><img src="'+(pagePhotos[state.view]||photos.hero)+'" alt="" aria-hidden="true"><b>LEARN → PROVE → ADAPT</b></div></div>'+content+quote(state.view)+'</main>'+
    '<nav class="v30-mobile-nav">'+primary.map(([v,t])=>'<button class="'+(state.view===v?"active":"")+'" onclick="view(\''+v+'\')"><b>'+t.slice(0,1)+'</b><span>'+t+'</span></button>').join("")+'</nav>'+
    '<footer class="site-footer"><span>StudySprint · Decide → learn → prove → review → adapt.</span><nav><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer><div class="toast '+(state.toast?"show":"")+'">'+esc(state.toast)+'</div>'+(state.modal?setup():"");
  };
  window.v30More=function(e){e.stopPropagation();e.currentTarget.parentElement.classList.toggle("open")};
  document.addEventListener("click",()=>document.querySelectorAll(".v30-more").forEach(x=>x.classList.remove("open")));
  function sourceMockup(){
    return '<div class="v30-source-ui"><div class="v30-windowbar"><i></i><i></i><i></i><span>StudySprint · Biology 101</span></div><div class="v30-source-body"><div class="v30-file"><b>Lecture 07.pdf</b><small>42 pages · uploaded just now</small><div class="v30-fileicon">PDF</div></div><div class="v30-output"><div><span>GENERATED FROM YOUR MATERIAL</span><b>Great Oxidation Event</b><p>Oxygen began accumulating in Earth’s atmosphere roughly 2.4 billion years ago...</p></div><div class="v30-output-row"><em>AI NOTES</em><em>SUMMARY</em><em>QUIZ</em><em>FLASHCARDS</em></div></div></div></div>'
  }
  function quizMockup(){
    return '<div class="v30-quiz-ui"><div class="v30-quiz-top"><span>CHEMISTRY · PRACTICE</span><b>Question 7 / 12</b></div><h3>Which change most directly increases the reaction rate?</h3><div class="v30-options"><button>A <span>Lowering the temperature</span></button><button class="picked">B <span>Increasing particle collisions</span><i>✓</i></button><button>C <span>Removing the reactant</span></button><button>D <span>Reducing concentration</span></button></div><div class="v30-feedback"><b>Correct.</b><span>Evidence captured · confidence +1 · next review scheduled</span></div></div>'
  }
  function adaptiveMockup(){
    return '<div class="v30-adaptive-ui"><div class="v30-adaptive-head"><span>ADAPTIVE ENGINE</span><b>What should happen next?</b></div><div class="v30-path"><div class="v30-node done"><b>01</b><span>Study</span></div><i></i><div class="v30-node active"><b>02</b><span>Practice</span></div><i></i><div class="v30-node"><b>03</b><span>Review</span></div></div><div class="v30-recommend"><div><span>RECOMMENDED NEXT</span><b>Quadratics · retrieval practice</b><small>Why: 62% accuracy + weak confidence + exam in 6 days</small></div><strong>15 min →</strong></div></div>'
  }
  function landing(){
    return '<section class="v30-landing"><header class="v30-landnav"><button class="v30-landbrand" onclick="view(\'today\')">'+mark+'<span><b>StudySprint</b><small>ADAPTIVE LEARNING SYSTEM</small></span></button><nav><a href="#v30-workflow">How it works</a><a href="#v30-engine">Adaptive engine</a><a href="#v30-practice">Practice</a><a href="#v30-pricing">Pricing</a></nav><div class="v30-landright">'+language()+'<button class="v30-signin" onclick="view(\'account\')">Sign in</button><button class="v30-start" onclick="openSetup()">'+text("cta")+' <b>↗</b></button></div></header>'+
    '<main>'+
    '<section class="v30-hero"><div class="v30-hero-copy"><span class="v30-kicker"><i></i>'+text("heroK")+'</span><h1>'+text("heroH").replace("\n","<br>")+'</h1><p>'+text("heroP")+'</p><div class="v30-hero-actions"><button onclick="openSetup()">'+text("cta")+' <b>↗</b></button><a href="#v30-workflow">'+text("secondary")+' <b>↓</b></a></div><div class="v30-hero-proof"><span><b>01</b> PLAN</span><span><b>02</b> LEARN</span><span><b>03</b> PRACTICE</span><span><b>04</b> ADAPT</span></div></div><div class="v30-hero-demo"><div class="v30-demo-glow"></div>'+sourceMockup()+'<div class="v30-float-card v30-float-a"><span>LEARNING SIGNAL</span><b>Quadratics</b><small>Practice next</small></div><div class="v30-float-card v30-float-b"><b>82%</b><span>confidence rising</span><i>↗</i></div></div></section>'+
    '<section class="v30-trust"><div><b>BUILT FOR REAL STUDY</b><span>PDFs</span><span>LECTURES</span><span>NOTES</span><span>DEADLINES</span><span>PRACTICE</span><span>REVIEW</span></div></section>'+
    '<section id="v30-workflow" class="v30-workflow v30-reveal"><div class="v30-section-intro"><span>01 / FROM MATERIAL TO MASTERY</span><h2>One source.<br><em>Many useful ways to learn.</em></h2><p>Start with what you already have. StudySprint turns it into structured learning, then keeps the evidence connected.</p></div><div class="v30-workflow-grid"><article><span>01</span><h3>Bring your material</h3><p>Notes, chapters, slides or a topic you need to master.</p><div class="v30-mini-file">📄 <b>Biology · Lecture 07</b><small>42 pages</small></div></article><article><span>02</span><h3>Understand it</h3><p>Get a clear explanation and a focused summary before you practise.</p><div class="v30-mini-note"><b>Great Oxidation Event</b><small>3 key ideas · 2 weak concepts</small></div></article><article><span>03</span><h3>Prove it</h3><p>Answer questions. Your mistakes and confidence become evidence.</p><div class="v30-mini-score"><b>7 / 10</b><small>Accuracy this week</small><i></i></div></article></div></section>'+
    '<section class="v30-feature v30-reveal"><div class="v30-feature-art">'+quizMockup()+'</div><div class="v30-feature-copy"><span>02 / PRACTICE</span><h2>Don't just read it.<br><em>Prove you know it.</em></h2><p>StudySprint treats practice as a signal, not a score sitting in isolation. Every answer can change what gets recommended next.</p><ul><li><b>01</b><span>Correct answers build confidence.</span></li><li><b>02</b><span>Mistakes create targeted review.</span></li><li><b>03</b><span>Patterns influence the next session.</span></li></ul></div></section>'+
    '<section id="v30-engine" class="v30-engine-section v30-reveal"><div class="v30-engine-copy"><span>03 / ADAPTIVE ENGINE</span><h2>Your plan changes<br><em>because you changed.</em></h2><p>Accuracy, mistakes, confidence, topic history, available time and review timing combine into a next-step decision.</p><div class="v30-signal-chips"><span>ACCURACY</span><span>CONFIDENCE</span><span>MISTAKES</span><span>REVIEW TIMING</span><span>EXAM DATE</span></div></div><div class="v30-engine-art">'+adaptiveMockup()+'</div></section>'+
    '<section id="v30-practice" class="v30-material-section v30-reveal"><div class="v30-material-photo"><img src="'+photos.study+'" alt="Student studying with a laptop"><div><span>THE STUDENT VIEW</span><b>Everything important stays in context.</b></div></div><div class="v30-material-copy"><span>04 / THE COMMAND CENTER</span><h2>Open Today.<br><em>Know what matters.</em></h2><p>No hunting through a maze of tools. Today answers four questions immediately: what to study, why it matters, what is weak, and what you should do next.</p><div class="v30-today-card"><div><span>TODAY · RECOMMENDED NEXT</span><b>Quadratics</b><small>15 min · 6 days to exam · weak confidence</small></div><strong>Start →</strong></div></div></section>'+
    '<section class="v30-quote-band v30-reveal"><div><span>THE STUDYSPRINT IDEA</span><h2>More tools aren't the answer.<br><em>Better decisions are.</em></h2><p>We are not trying to give students another place to collect study stuff. We are building the layer that decides what deserves attention next.</p></div><img src="'+photos.notes+'" alt="Student taking notes"></section>'+
    '<section id="v30-pricing" class="v30-final v30-reveal"><div><span>START FREE</span><h2>Your next study session<br><em>can start here.</em></h2><p>Build your plan, create evidence through practice, and let the system adapt.</p><button onclick="openSetup()">Build StudySprint <b>↗</b></button></div><div class="v30-final-grid"><div><b>Free</b><span>Real planning + practice + adaptive evidence.</span></div><div><b>Plus</b><span>More depth, more convenience, less time managing your study system.</span></div></div></section>'+
    '</main><footer class="v30-landfooter"><div>'+mark+'<b>StudySprint</b></div><span>DECIDE → LEARN → PROVE → REVIEW → ADAPT</span><nav><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./contact.html">Support</a></nav></footer></section>'
  }
  window.onboardingPage=landing;
  function motion(){const els=document.querySelectorAll(".v30-reveal");if(!("IntersectionObserver" in window)){els.forEach(x=>x.classList.add("show"));return}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("show");io.unobserve(e.target)}}),{threshold:.08});els.forEach(e=>io.observe(e));}
  setTimeout(()=>{try{render();motion()}catch(e){console.error("StudySprint V30",e)}},0);
})();