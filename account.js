(()=>{
  const cfg=window.STUDYSPRINT_AUTH||{};
  let client=null, syncTimer=null, syncing=false, lastSyncedAt=0;

  function configured(){return cfg.provider==="supabase"&&cfg.url&&cfg.anonKey&&window.supabase?.createClient}
  function getClient(){
    if(!configured())return null;
    if(!client)client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  function accountStatus(){return getClient()?.auth.getSession()||Promise.resolve({data:{session:null}})}

  function meaningful(data){
    return Boolean((data?.subjects?.length||0)||(data?.plan?.length||0)||(data?.practice?.attempts||0)||(data?.mistakes?.length||0));
  }
  function mergeData(local,remote){
    if(!remote||typeof remote!=="object")return normalizeData(local);
    const l=normalizeData(local)||normalizeData(emptyData()), r=normalizeData(remote)||normalizeData(emptyData());
    const lt=Date.parse(l.meta?.lastModified||0)||0, rt=Date.parse(r.meta?.lastModified||0)||0;
    if(!meaningful(l))return r;
    if(!meaningful(r))return l;
    if(rt>lt)return r;
    return l;
  }

  async function currentUser(){
    const c=getClient();if(!c)return null;
    const {data}=await c.auth.getSession();return data?.session?.user||null;
  }

  async function pullAndMerge(){
    const c=getClient(), user=await currentUser();if(!c||!user)return {ok:false,reason:"signed-out"};
    const {data,error}=await c.from("study_data").select("data,updated_at").eq("user_id",user.id).maybeSingle();
    if(error)throw error;
    if(!data?.data){
      await c.from("study_data").upsert({user_id:user.id,data:state.data,updated_at:new Date().toISOString()},{onConflict:"user_id"});
      lastSyncedAt=Date.now();return {ok:true,created:true};
    }
    const merged=mergeData(state.data,data.data);
    state.data=merged;save();
    lastSyncedAt=Date.now();
    return {ok:true,merged:true,remoteUpdatedAt:data.updated_at};
  }

  async function push(){
    const c=getClient(), user=await currentUser();if(!c||!user||syncing)return;
    syncing=true;
    try{
      const payload=normalizeData(state.data);
      const {error}=await c.from("study_data").upsert({
        user_id:user.id,
        data:payload,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
      if(error)throw error;
      lastSyncedAt=Date.now();
    }finally{syncing=false}
  }

  window.studySprintQueueSync=function(){
    if(!configured()||!getClient())return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>push().catch(e=>console.warn("StudySprint cloud sync unavailable",e)),900);
  };

  function accountPage(){
    return '<section>'+head("ACCOUNT","Your StudySprint account.","One place for sign-in, cloud backup, and keeping your study data safe across devices.")+
      '<div class="account-hero card"><div><span class="pill">LOCAL-FIRST + CLOUD SYNC</span><h2>Keep your progress with you.</h2><p>Your study plan stays on this device. Sign in when you want a secure cloud copy that can follow you to another device.</p></div><div class="account-hero-mark">S</div></div>'+
      '<div class="account-grid"><div class="card"><div class="account-section-head"><div><span class="metric-label">ACCOUNT ACCESS</span><h2>Sign in securely</h2><p>Email/password is ready now. Google can be enabled once the provider is configured.</p></div></div>'+
      (configured()?'<div id="account-box"><div class="account-loading">Checking your session…</div></div>':'<div class="account-setup"><span class="pill">SETUP NEEDED</span><h2>Connect the account provider</h2><p>The app is ready, but the public Supabase connection is not configured.</p><div class="callout"><b>Provider setup required.</b><span>Add the public browser configuration before using cloud accounts.</span></div></div>')+
      '</div><div class="card"><span class="metric-label">WHAT HAPPENS</span><h2>Simple and safe</h2><div class="rule"><b>1. Study locally</b><span>Everything keeps working even without an account.</span></div><div class="rule"><b>2. Sign in</b><span>Your account gives StudySprint a place to sync your study data.</span></div><div class="rule"><b>3. Sync</b><span>Your plan, practice evidence, mistakes and progress can move between devices.</span></div><div class="rule"><b>4. Stay in control</b><span>Cloud rows are restricted to the signed-in user by database security rules.</span></div></div></div></section>';
  }

  async function renderAccountBox(){
    const box=document.getElementById("account-box");if(!box)return;
    const c=getClient();if(!c)return;
    const {data}=await c.auth.getSession(),s=data?.session;
    if(s){
      const email=esc(s.user?.email||"Signed in");
      box.innerHTML='<div class="account-user"><div class="account-avatar">'+esc((email[0]||"S").toUpperCase())+'</div><div><span class="pill">SIGNED IN</span><h2>'+email+'</h2><p>Your account session is active on this device.</p></div></div><div class="account-actions"><button type="button" class="btn primary" onclick="accountSyncNow()">Sync now</button><button type="button" class="btn ghost" onclick="accountSignOut()">Sign out</button></div><div class="account-actions account-secondary-actions"><button type="button" class="text" onclick="accountResetPassword()">Send password reset email</button><button type="button" class="text" onclick="accountDeleteData()">Delete cloud data</button></div><div id="account-sync-note" class="account-note"></div>';
    }else{
      box.innerHTML='<div class="account-form"><span class="pill">EMAIL + PASSWORD</span><h2>Sign in or create an account</h2><p class="account-intro">Use an email you can access. If email confirmation is enabled, you will need to confirm it before your first sign-in.</p><label>Email<input id="accountEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></label><label>Password<div class="password-field"><input id="accountPassword" type="password" autocomplete="current-password" placeholder="At least 8 characters" aria-describedby="password-help"><button type="button" class="password-toggle" onclick="accountTogglePassword()" aria-label="Show password" aria-pressed="false"><span class="password-eye" aria-hidden="true">◉</span></button></div><span id="password-help" class="field-help">Use at least 8 characters. Tap the eye to show or hide it.</span></label><div class="account-actions"><button type="button" class="btn primary" onclick="accountEmailSignIn()">Sign in</button><button type="button" class="btn secondary" onclick="accountEmailSignUp()">Create account</button></div><button type="button" class="text account-forgot" onclick="accountForgotPassword()">Forgot password?</button><div class="account-divider"><span>or</span></div><button type="button" class="btn secondary wide" onclick="accountGoogleSignIn()">Continue with Google</button><div class="account-provider-note"><b>Google setup</b><span>This button works after Google is enabled in Supabase and its OAuth credentials are added there. No Google secret belongs in StudySprint code.</span></div><div id="account-error" class="account-error" role="alert" aria-live="polite"></div></div>';
    }
  }

  function accountError(msg){const e=document.getElementById("account-error");if(e){e.textContent=msg;e.classList.add("show")}else toast(msg)}
  function authUrlError(){const hash=window.location.hash||"";if(!hash)return null;const p=new URLSearchParams(hash.replace(/^#/,""));const code=p.get("error_code"),desc=p.get("error_description");return code||desc?(desc||code).replace(/\+/g," "):null}
  async function accountEmailSignIn(){
    const c=getClient(),email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";
    if(!c)return accountError("Account service is not available. Please refresh the page and try again.");
    if(!email||!password)return accountError("Enter your email and password.");
    const btn=document.querySelector("#account-box .account-actions .btn.primary");
    if(btn){btn.disabled=true;btn.textContent="Signing in…";}
    try{
      const {error}=await c.auth.signInWithPassword({email,password});
      if(error)return accountError(error.message);
      await pullAndMerge();toast("Signed in and synced.");render();
    }catch(error){console.error("StudySprint sign-in failed",error);accountError(error?.message||"Sign-in failed. Please try again.");}
    finally{if(btn){btn.disabled=false;btn.textContent="Sign in";}}
  }
  async function accountEmailSignUp(){
    const c=getClient(),email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";
    if(!c)return accountError("Account service is not available. Please refresh the page and try again.");
    if(!email||password.length<8)return accountError("Enter an email and a password with at least 8 characters.");
    const btn=document.querySelector("#account-box .account-actions .btn.secondary");
    if(btn){btn.disabled=true;btn.textContent="Creating…";}
    try{
      const {data,error}=await c.auth.signUp({email,password,options:{emailRedirectTo:cfg.redirectTo}});
      if(error)return accountError(error.message);
      if(data?.session){
        await pullAndMerge();toast("Account created and signed in.");render();
      }else{
        accountError("Account created. Check your email to confirm it, then come back and sign in.");
      }
    }catch(error){console.error("StudySprint sign-up failed",error);accountError(error?.message||"Account creation failed. Please try again.");}
    finally{if(btn){btn.disabled=false;btn.textContent="Create account";}}
  }
  function accountTogglePassword(){const input=document.getElementById("accountPassword"),btn=document.querySelector(".password-toggle");if(!input||!btn)return;const showing=input.type==="password";input.type=showing?"text":"password";btn.setAttribute("aria-label",showing?"Hide password":"Show password");btn.setAttribute("aria-pressed",String(showing));const eye=btn.querySelector(".password-eye");if(eye)eye.textContent=showing?"○":"◉";input.focus();}
  async function accountForgotPassword(){
    const c=getClient(),email=document.getElementById("accountEmail")?.value.trim();
    if(!c)return accountError("Account service is not available. Please refresh the page and try again.");
    if(!email)return accountError("Enter your email first, then choose Forgot password.");
    try{
      const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:cfg.redirectTo});
      if(error)return accountError(error.message);
      accountError("Password reset email sent. Check your inbox and follow the link.");
    }catch(error){console.error("StudySprint password reset failed",error);accountError(error?.message||"Password reset could not be sent. Please try again.");}
  }
  async function accountGoogleSignIn(){
    const c=getClient();
    if(!c)return accountError("Account service is not available. Please refresh the page and try again.");
    try{
      const {error}=await c.auth.signInWithOAuth({provider:"google",options:{redirectTo:cfg.redirectTo}});
      if(error)accountError(error.message);
    }catch(error){console.error("StudySprint Google sign-in failed",error);accountError(error?.message||"Google sign-in is not enabled yet.");}
  }
  async function accountSignOut(){const c=getClient();if(!c)return;await c.auth.signOut();toast("Signed out.");render();}
  async function accountSyncNow(){
    const note=document.getElementById("account-sync-note");
    try{const result=await pullAndMerge();if(note)note.textContent=result.created?"Cloud backup created.": "Cloud and device data are synchronized.";toast("Study data synced.");render();}
    catch(error){if(note)note.textContent="Sync failed, but your local data is unchanged.";console.error(error);}
  }
  async function accountResetPassword(){
    const c=getClient(),user=await currentUser();if(!c||!user?.email)return;
    const {error}=await c.auth.resetPasswordForEmail(user.email,{redirectTo:cfg.redirectTo});
    toast(error?"Password reset could not be sent.":"Password reset email sent.");
  }
  async function accountDeleteData(){
    const c=getClient(),user=await currentUser();if(!c||!user)return;
    if(!confirm("Delete your cloud study data? Your local device copy will remain."))return;
    const {error}=await c.from("study_data").delete().eq("user_id",user.id);
    toast(error?"Cloud data could not be deleted.":"Cloud study data deleted.");
  }

  window.accountEmailSignIn=accountEmailSignIn;
  window.accountEmailSignUp=accountEmailSignUp;
  window.accountGoogleSignIn=accountGoogleSignIn;
  window.accountForgotPassword=accountForgotPassword;
  window.accountTogglePassword=accountTogglePassword;
  window.accountSignOut=accountSignOut;
  window.accountSyncNow=accountSyncNow;
  window.accountResetPassword=accountResetPassword;
  window.accountDeleteData=accountDeleteData;

  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__studySprintInstallPrompt=e});
  window.addEventListener("appinstalled",()=>{window.__studySprintInstallPrompt=null});
  window.installStudySprint=async()=>{const p=window.__studySprintInstallPrompt;if(p){p.prompt();await p.userChoice;window.__studySprintInstallPrompt=null}else toast("Use your browser's Add to Home Screen / Install option.")};

  const oldRender=window.render;
  window.render=function(){
    if(state.view==="account"){const root=document.getElementById("app");if(root)root.innerHTML=window.shell(accountPage());renderAccountBox();return;}
    if(typeof oldRender==="function")oldRender();
  };
  const originalView=window.view;
  window.view=function(v){
    if(v==="account"){state.view="account";state.modal=false;const root=document.getElementById("app");if(root)root.innerHTML=window.shell(accountPage());renderAccountBox();return}
    originalView(v);
  };

  if(configured()){
    const callbackError=authUrlError();
    if(callbackError) setTimeout(()=>{if(state.view==="account")accountError(callbackError)},250);
    const c=getClient();
    c.auth.onAuthStateChange((event,session)=>{
      if(session)setTimeout(()=>pullAndMerge().then(()=>{if(state.view==="account")renderAccountBox()}).catch(e=>console.warn("Account sync failed",e)),0);
    });
  }
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
  setTimeout(()=>{if(window.studySprintBillingStatus)window.studySprintBillingStatus()},60);
})();