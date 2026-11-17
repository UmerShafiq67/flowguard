/* StudySprint vNext shell — focused navigation and product hierarchy. */
(function(){
  function v2nav(v,label,icon){
    return '<button class="'+(state.view===v?'active':'')+'" onclick="view(\''+v+'\')"><span>'+icon+'</span>'+label+'</button>';
  }
  window.shell=function(content){
    const primary=[
      ["today","Today"],["plan","Plan"],["practice","Practice"],["tutor","Tutor"],["review","Review"]
    ];
    return '<header class="appbar">'+
      '<button class="brand" onclick="view(\'today\')" aria-label="StudySprint home">'+
        '<span class="logo">S</span><span class="brand-copy"><b>StudySprint</b><small>adaptive learning</small></span>'+
      '</button>'+
      '<nav class="desktop-nav" aria-label="Primary navigation">'+primary.map(([v,t])=>nav(v,t,"")).join("")+'</nav>'+
      '<div class="topright">'+
        '<button class="v2-progress" onclick="view(\'progress\')">Progress</button>'+
        '<div class="v2-more">'+
          '<button onclick="toggleV2Menu(event)" aria-haspopup="true" aria-expanded="false">More <span>⌄</span></button>'+
          '<div class="v2-menu" id="v2Menu">'+
            '<div class="menu-label">Workspace</div>'+
            '<button onclick="view(\'progress\');closeV2Menu()">Progress & insights</button>'+
            '<button onclick="view(\'subjects\');closeV2Menu()">Subjects</button>'+
            '<button onclick="view(\'focus\');closeV2Menu()">Focus</button>'+
            '<div class="menu-divider"></div>'+
            '<div class="menu-label">Account</div>'+
            '<button onclick="view(\'account\');closeV2Menu()">Account & sync</button>'+
            '<button onclick="openSetup();closeV2Menu()">Edit study plan</button>'+
          '</div>'+
        '</div>'+
        '<button class="ghost plus-link" onclick="openPremium()">Plus</button>'+
        '<button class="ghost edit-plan" onclick="openSetup()">Edit plan</button>'+
      '</div>'+
    '</header>'+
    '<main class="app-main view-'+state.view+'">'+content+'</main>'+
    '<nav class="v2-mobile-nav" aria-label="Primary navigation">'+
      v2nav("today","Today","01")+v2nav("plan","Plan","02")+v2nav("practice","Practice","03")+v2nav("tutor","Tutor","04")+v2nav("review","Review","05")+
    '</nav>'+
    '<footer class="site-footer"><span>StudySprint · Decide → learn → prove → review → adapt.</span><nav aria-label="Legal"><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a><a href="./pricing.html">Pricing</a><a href="./refund.html">Refunds</a><a href="./contact.html">Support</a></nav></footer>'+
    '<div class="toast '+(state.toast?"show":"")+'">'+esc(state.toast)+'</div>'+ (state.modal?setup():"");
  };
  window.toggleV2Menu=function(e){
    e?.stopPropagation();
    const m=document.getElementById("v2Menu");if(!m)return;
    const open=m.classList.toggle("open");
    const b=m.previousElementSibling;if(b)b.setAttribute("aria-expanded",String(open));
  };
  window.closeV2Menu=function(){
    const m=document.getElementById("v2Menu");if(m)m.classList.remove("open");
  };
  window.head=function(k,t,p,a=""){
    return '<div class="head"><div><div class="kicker">'+esc(k)+'</div><h1>'+t+'</h1><p>'+p+'</p></div>'+(a||"")+'</div>';
  };
  window.onboardingPage=function(){
    return '<section class="landing">'+
      '<header class="landingbar"><button class="landingbrand" onclick="view(\'today\')"><span class="landinglogo">S</span><span><b>StudySprint</b><small>adaptive learning</small></span></button>'+
      '<div class="landingmeta"><span>PERSONAL STUDY SYSTEM</span><button class="landinglink" onclick="openSetup()">Start free <b>↗</b></button></div></header>'+
      '<div class="landinghero">'+
        '<div class="landingeyebrow"><i></i> ADAPTIVE LEARNING <span>BUILT AROUND EVIDENCE</span></div>'+
        '<h1>Know what to study.<br><em>Know why next.</em></h1>'+
        '<p>StudySprint turns your subjects, confidence, deadlines, and practice results into one clear next step — so students spend less time organizing and more time learning.</p>'+
        '<div class="landingactions"><button class="btn primary" onclick="openSetup()">Build my study plan <span>↗</span></button><span>Free to start · no clutter · your plan adapts as you learn.</span></div>'+
      '</div>'+
      '<div class="landingrail"><div><small>01</small><b>PLAN</b><span>Set subjects, confidence, available time, and exam dates.</span></div><div><small>02</small><b>PROVE</b><span>Practice answers become evidence, not just activity.</span></div><div><small>03</small><b>ADAPT</b><span>Your next step changes when your learning signal changes.</span></div></div>'+
      '<div class="landingbottom"><span>DECIDE</span><i>→</i><span>LEARN</span><i>→</i><span>PROVE</span><i>→</i><span>REVIEW</span><i>→</i><span>ADAPT</span><b>STUDYSPRINT / 01</b></div>'+
    '</section>';
  };
  window.addEventListener("click",function(e){
    const menu=document.getElementById("v2Menu");
    if(menu && !e.target.closest(".v2-more"))menu.classList.remove("open");
  });
  setTimeout(function(){try{render()}catch(e){console.error(e)}},0);
})();