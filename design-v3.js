/* StudySprint V3 — premium shell + motion layer. */
(function(){
  function navItem(v,label,icon){
    return '<button class="'+(state.view===v?'active':'')+'" onclick="view(\''+v+'\')" aria-label="'+label+'"><span>'+icon+'</span><b>'+label+'</b></button>';
  }
  function navIcon(v){
    return ({today:"✦",plan:"◫",practice:"⌁",tutor:"✧",review:"✓"})[v]||"•";
  }
  window.shell=function(content){
    const primary=[["today","Today"],["plan","Plan"],["practice","Practice"],["tutor","Tutor"],["review","Review"]];
    return '<aside class="appbar">'+
      '<button class="brand" onclick="view(\'today\')" aria-label="StudySprint home"><span class="logo">S</span><span class="brand-copy"><b>StudySprint</b><small>ADAPTIVE LEARNING</small></span></button>'+
      '<nav class="desktop-nav" aria-label="Primary navigation">'+primary.map(([v,t])=>'<button class="nav '+(state.view===v?"active":"")+'" onclick="view(\''+v+'\')"><span aria-hidden="true">'+navIcon(v)+'</span>'+t+'</button>').join("")+'</nav>'+
      '<div class="topright">'+
        '<button class="v2-progress" onclick="view(\'progress\')">◈ &nbsp; Progress & insights</button>'+
        '<div class="v2-more"><button onclick="toggleV2Menu(event)">More <span>⌄</span></button><div class="v2-menu" id="v2Menu">'+
          '<div class="menu-label">Workspace</div><button onclick="view(\'progress\');closeV2Menu()">Progress & insights</button><button onclick="view(\'subjects\');closeV2Menu()">Subjects</button><button onclick="view(\'focus\');closeV2Menu()">Focus timer</button>'+
          '<div class="menu-divider"></div><div class="menu-label">Account</div><button onclick="view(\'account\');closeV2Menu()">Account & sync</button><button onclick="openSetup();closeV2Menu()">Edit study plan</button>'+
        '</div></div>'+
        '<button class="ghost plus-link" onclick="openPremium()">✦ Plus</button><button class="ghost edit-plan" onclick="openSetup()">Edit plan</button>'+
      '</div>'+
    '</aside>'+
    '<main class="app-main view-'+state.view+'"><div class="v3-orbit v3-orbit-a"></div><div class="v3-orbit v3-orbit-b"></div>'+content+'</main>'+
    '<nav class="v3-mobile-nav" aria-label="Primary navigation">'+primary.map(([v,t])=>navItem(v,t,navIcon(v))).join("")+'</nav>'+
    '<footer class="site-footer"><span>StudySprint · Decide → learn → prove → review → adapt.</span><nav aria-label="Legal"><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer>'+
    '<div class="toast '+(state.toast?"show":"")+'">'+esc(state.toast)+'</div>'+(state.modal?setup():"");
  };
  window.onboardingPage=function(){
    return '<section class="landing">'+
      '<header class="landingbar"><button class="landingbrand" onclick="view(\'today\')"><span class="landinglogo">S</span><span><b>StudySprint</b><small>adaptive learning</small></span></button><div class="landingmeta"><span>PERSONAL LEARNING OS · 01</span><button class="landinglink" onclick="openSetup()">Start free <b>↗</b></button></div></header>'+
      '<div class="landinghero"><div class="landingeyebrow"><i></i> PERSONAL LEARNING INTELLIGENCE <span>ADAPTS AS YOU LEARN</span></div>'+
      '<h1>Stop organizing your studying.<br><em>Start knowing what to do.</em></h1>'+
      '<p>StudySprint turns your subjects, confidence, deadlines, and real practice evidence into one clear next action — with an adaptive loop that keeps changing as your learning changes.</p>'+
      '<div class="landingactions"><button class="btn primary" onclick="openSetup()">Build my study system <span>↗</span></button><span>Free to start · adaptive by design · built for real study time.</span></div></div>'+
      '<div class="landingrail"><div><small>01 · DECIDE</small><b>Plan around reality.</b><span>Subjects, confidence, deadlines and available time become a roadmap you can actually follow.</span></div>'+
      '<div><small>02 · PROVE</small><b>Turn answers into evidence.</b><span>Practice is not just activity. Results tell StudySprint what should change next.</span></div>'+
      '<div><small>03 · ADAPT</small><b>Always have a next move.</b><span>Weak topics rise. Strong topics stay alive. Your plan evolves instead of sitting still.</span></div></div>'+
      '<div class="landingbottom"><span>DECIDE</span><i>→</i><span>LEARN</span><i>→</i><span>PROVE</span><i>→</i><span>REVIEW</span><i>→</i><span>ADAPT</span><b>STUDYSPRINT / LEARNING OS</b></div>'+
    '</section>';
  };
  window.addEventListener("click",function(e){
    const menu=document.getElementById("v2Menu");
    if(menu && !e.target.closest(".v2-more"))menu.classList.remove("open");
  });
  setTimeout(function(){try{render()}catch(e){console.error("StudySprint V3 render",e)}},0);
})();