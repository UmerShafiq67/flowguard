/* StudySprint V31 — isolated visual renderer */
(function(){
  const P={
    hero:"https://images.unsplash.com/photo-1753613648109-791ed9c85b82?auto=format&fit=crop&fm=jpg&q=88&w=1800",
    notes:"https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&fm=jpg&q=88&w=1400",
    study:"https://images.unsplash.com/photo-1753613648131-f8189bf05bcf?auto=format&fit=crop&fm=jpg&q=88&w=1400",
    desk:"https://images.unsplash.com/photo-1741699427799-3fbb70fce948?auto=format&fit=crop&fm=jpg&q=88&w=1400",
    library:"https://images.unsplash.com/photo-1759984782211-3a02ca78e6ac?auto=format&fit=crop&fm=jpg&q=88&w=1400"
  };
  const mark=`<img src="./assets/studysprint-mark.svg" alt="StudySprint">`;
  const navItems=[["today","Today"],["plan","Plan"],["practice","Practice"],["tutor","Tutor"],["review","Review"]];
  const photos={today:P.hero,plan:P.notes,practice:P.study,tutor:P.desk,review:P.library,progress:P.notes,subjects:P.study,focus:P.desk,account:P.library,session:P.hero};
  const titles={today:"Your study command center",plan:"A plan that responds to evidence",practice:"Turn answers into evidence",tutor:"Understand without getting stuck",review:"Bring weak topics back",progress:"See what is actually changing",subjects:"Know your learning map",focus:"Protect the time you have",account:"Your study system, your data",session:"Make this session count"};
  const quotes={today:["The secret of getting ahead is getting started.","Mark Twain"],plan:["A goal without a plan is just a wish.","Antoine de Saint-Exupéry"],practice:["Success is the sum of small efforts, repeated day in and day out.","Robert Collier"],tutor:["The important thing is not to stop questioning.","Albert Einstein"],review:["We are what we repeatedly do.","Will Durant"],progress:["What gets measured gets improved.","Peter Drucker"],subjects:["The more you practice, the better you become.","StudySprint"],focus:["Concentration is the secret of strength.","Ralph Waldo Emerson"],account:["Your habits shape your future more than your intentions do.","StudySprint"],session:["Learning is not a spectator sport.","D. Blocher"]};
  const esc=s=>{const d=document.createElement("div");d.textContent=String(s??"");return d.innerHTML};
  function q(v){const x=quotes[v]||quotes.today;return `<aside class="v31-quote"><span>“</span><div><p>${esc(x[0])}</p><small>— ${esc(x[1])}</small></div></aside>`}

  window.v31Menu=function(e){e.stopPropagation();e.currentTarget.parentElement.classList.toggle("open")};
  document.addEventListener("click",()=>document.querySelectorAll(".v31-more").forEach(x=>x.classList.remove("open")));

  window.shell=function(content){
    const nav=navItems.map(([v,t])=>`<button class="v31-nav ${state.view===v?"active":""}" onclick="view('${v}')">${t}</button>`).join("");
    const more=[["progress","Progress & insights"],["subjects","Subjects"],["focus","Focus"],["account","Account & sync"]];
    return `
      <header class="v31-appbar">
        <button class="v31-brand" onclick="view('today')" aria-label="StudySprint home">${mark}<span><b>StudySprint</b><small>ADAPTIVE LEARNING SYSTEM</small></span></button>
        <nav class="v31-navrow">${nav}</nav>
        <div class="v31-actions">
          <button onclick="view('progress')">Progress</button>
          <div class="v31-more"><button onclick="v31Menu(event)">More⌄</button><div class="v31-menu">${more.map(x=>`<button onclick="view('${x[0]}')">${x[1]}</button>`).join("")}</div></div>
          <button class="v31-plus" onclick="openPremium()">Plus</button>
          <button class="v31-edit" onclick="openSetup()">Edit plan</button>
        </div>
      </header>
      <main class="v31-main">
        <section class="v31-pagehero">
          <div class="v31-pagecopy"><span class="eyebrow">STUDYSPRINT / ${esc(String(state.view).toUpperCase())}</span><h2>${esc(titles[state.view]||"Keep learning")}</h2><p>One clear action, backed by evidence from what you actually do.</p></div>
          <div class="v31-pagephoto"><img src="${photos[state.view]||P.hero}" alt="" aria-hidden="true"><b>PLAN → LEARN → PROVE → ADAPT</b></div>
        </section>
        ${content}
        ${q(state.view)}
      </main>
      <nav class="v31-mobile">${navItems.map(([v,t])=>`<button class="${state.view===v?"active":""}" onclick="view('${v}')"><b>${t.slice(0,1)}</b><span>${t}</span></button>`).join("")}</nav>
      <footer class="v31-footer"><b>StudySprint</b><span>Decide → learn → prove → review → adapt.</span><nav><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer>
      ${state.modal?setup():""}
    `;
  };

  window.onboardingPage=function(){
    const flow=[
      ["01","Plan","Subjects, exam dates, confidence and available time shape the roadmap.",P.notes],
      ["02","Learn","Understand the topic before you spend time proving it.",P.study],
      ["03","Practice","Answers reveal what is actually solid and what is still shaky.",P.desk],
      ["04","Adapt","Weak topics rise in priority while strong topics need less attention.",P.library]
    ];
    return `
      <section class="v31-landing">
        <header class="v31-landnav">
          <button class="v31-landbrand" onclick="view('today')">${mark}<span><b>StudySprint</b><small>ADAPTIVE LEARNING SYSTEM</small></span></button>
          <nav><a href="#v31-flow">How it works</a><a href="#v31-engine">Adaptive engine</a><a href="#v31-practice">Practice</a><a href="#v31-pricing">Pricing</a></nav>
          <div class="v31-landright"><button class="v31-signin" onclick="view('account')">Sign in</button><button class="v31-landcta" onclick="openSetup()">Build my study system ↗</button></div>
        </header>

        <section class="v31-hero">
          <div>
            <span class="v31-kicker"><i></i>ADAPTIVE LEARNING SYSTEM</span>
            <h1>Stop asking what to study.<br><em>Know what to do next.</em></h1>
            <p>StudySprint turns subjects, deadlines, confidence and real practice results into a living study system that changes with you.</p>
            <div class="v31-hero-actions"><button onclick="openSetup()">Build my study system ↗</button><a href="#v31-flow">See how it works ↓</a></div>
            <div class="v31-proof"><span><b>01</b> PLAN</span><span><b>02</b> LEARN</span><span><b>03</b> PRACTICE</span><span><b>04</b> ADAPT</span></div>
          </div>
          <div class="v31-hero-visual">
            <img class="v31-photo-main" src="${P.hero}" alt="Student studying at a desk">
            <div class="v31-float"><b>82%</b><small>confidence rising</small></div>
            <div class="v31-ui-card">
              <div class="top"><span>TODAY / NEXT BEST MOVE</span><span>LIVE</span></div>
              <h3>Practice · Quadratics</h3>
              <p>Weak signal detected. A focused retrieval round is recommended before the next review.</p>
              <div class="v31-progressline"><i></i></div>
              <div class="v31-signal"><span>15 min</span><span>Evidence</span><span>Review tomorrow</span></div>
            </div>
          </div>
        </section>

        <div class="v31-marquee"><div><b>PDFs</b><span>LECTURES</span><b>NOTES</b><span>DEADLINES</span><b>PRACTICE</b><span>REVIEW</span><b>ADAPTATION</b></div></div>

        <section id="v31-flow" class="v31-section">
          <div class="v31-section-head"><div><span>01 / THE LEARNING LOOP</span><h2>Everything connected.<br><em>Nothing wasted.</em></h2></div><p>Start with what you already have. StudySprint turns material into useful learning, practice into evidence, and evidence into the next decision.</p></div>
          <div class="v31-flow">${flow.map(x=>`<article><span class="num">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p><img src="${x[3]}" alt="" loading="lazy"></article>`).join("")}</div>
        </section>

        <section id="v31-practice" class="v31-section v31-feature">
          <div class="v31-feature-media"><img src="${P.study}" alt="Student learning with notes" loading="lazy"><div class="v31-feature-panel"><span>PRACTICE SIGNAL</span><b>7 / 10 correct</b><small>Two misses on quadratics raise the topic priority. Next review is scheduled automatically.</small></div></div>
          <div class="v31-section-head" style="display:block;margin:0"><span>02 / PROVE WHAT YOU KNOW</span><h2>Reading feels productive.<br><em>Evidence is better.</em></h2><p>StudySprint makes practice part of the learning system. Correct answers strengthen confidence; mistakes create targeted review.</p></div>
        </section>

        <section id="v31-engine" class="v31-engine">
          <div class="v31-engine-inner"><div class="v31-engine-grid">
            <div><span class="v31-kicker">03 / ADAPTIVE ENGINE</span><h2>Your plan changes<br><em>because you changed.</em></h2><p>Accuracy, mistakes, confidence, topic history, review timing and available time all contribute to the next recommendation.</p>
              <div class="v31-evidence"><div><b>ACCURACY</b><span>62% on recent retrieval</span></div><div><b>CONFIDENCE</b><span>Low on quadratics</span></div><div><b>EXAM</b><span>6 days remaining</span></div><div><b>TIME</b><span>15 minutes available</span></div></div>
            </div>
            <div class="v31-engine-card"><header><span>ADAPTIVE ENGINE</span><span>DECISION / 07</span></header><h3>What should happen next?</h3><div class="v31-recommend"><div><b>Quadratics · retrieval practice</b><small>Why: recent misses + weak confidence + exam in 6 days</small></div><strong>15 min →</strong></div></div>
          </div></div>
        </section>

        <section class="v31-section v31-testimonial"><img src="${P.library}" alt="Student studying in a library" loading="lazy"><div><blockquote>“The best study plan isn't the biggest one. It's the one that tells you what matters next.”</blockquote><cite>— StudySprint learning philosophy</cite></div></section>

        <section id="v31-pricing" class="v31-cta"><div><h2>Make the next move count.</h2><p>Start free. Build a real learning system first. Upgrade only when the extra guidance and capacity are useful.</p></div><button onclick="openSetup()">Start StudySprint ↗</button></section>
        <footer class="v31-footer"><b>StudySprint</b><span>Adaptive learning for the next useful step.</span><nav><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer>
      </section>
    `;
  };
  setTimeout(()=>{try{render()}catch(e){console.error("StudySprint V31",e)}},30);
})();