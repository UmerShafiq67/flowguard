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
    return '<section>'+head("ACCOUNT","Your StudySprint account.","Sign in to sync your study data across devices. Your local data remains available offline.")+
      '<div class="account-grid"><div class="card">'+
      (configured()?'<div id="account-box"><div class="account-loading">Checking your session…</div></div>':'<div class="account-setup"><span class="pill">ACCOUNT SYNC READY</span><h2>Connect a secure account provider</h2><p>Google sign-in and email/password are supported through Supabase. Only the public browser key belongs in the app.</p><div class="callout"><b>Provider setup required.</b><span>The code is ready, but the provider URL and public browser key are not connected in config.js yet.</span></div></div>')+
      '</div><div class="card"><h2>How your data works</h2><div class="rule"><b>Local-first</b><span>StudySprint keeps working offline and preserves your existing device data.</span></div><div class="rule"><b>Cloud sync</b><span>After sign-in, your plan, practice evidence, mistakes and progress can sync across devices.</span></div><div class="rule"><b>Conflict-safe</b><span>The sync layer compares modification timestamps and avoids blindly replacing newer data.</span></div><div class="rule"><b>Account security</b><span>Database access is restricted to the signed-in account with provider-side row security.</span></div></div></div></section>';
  }

  async function renderAccountBox(){
    const box=document.getElementById("account-box");if(!box)return;
    const c=getClient();if(!c)return;
    const {data}=await c.auth.getSession(),s=data?.session;
    if(s){
      const email=esc(s.user?.email||"Signed in");
      box.innerHTML='<div class="account-user"><div class="account-avatar">'+esc((email[0]||"S").toUpperCase())+'</div><div><span class="pill">SIGNED IN</span><h2>'+email+'</h2><p>Your account session is active on this device.</p></div></div><div class="account-actions"><button class="btn primary" onclick="accountSyncNow()">Sync now</button><button class="btn ghost" onclick="accountSignOut()">Sign out</button></div><div class="account-actions"><button class="text" onclick="accountResetPassword()">Send password reset email</button><button class="text" onclick="accountDeleteData()">Delete cloud data</button></div><div id="account-sync-note" class="account-note"></div>';
    }else{
      box.innerHTML='<div class="account-form"><span class="pill">SECURE SIGN IN</span><h2>Sign in or create your account</h2><label>Email<input id="accountEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="accountPassword" type="password" autocomplete="current-password" placeholder="At least 6 characters"></label><div class="account-actions"><button class="btn primary" onclick="accountEmailSignIn()">Sign in</button><button class="btn secondary" onclick="accountEmailSignUp()">Create account</button></div><div class="account-divider"><span>or</span></div><button class="btn secondary wide" onclick="accountGoogleSignIn()">Continue with Google</button><div id="account-error" class="account-error"></div></div>';
    }
  }

  function accountError(msg){const e=document.getElementById("account-error");if(e)e.textContent=msg;else toast(msg)}
  async function accountEmailSignIn(){
    const c=getClient(),email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";
    if(!email||!password)return accountError("Enter your email and password.");
    const {error}=await c.auth.signInWithPassword({email,password});if(error)return accountError(error.message);
    await pullAndMerge();toast("Signed in and synced.");render();
  }
  async function accountEmailSignUp(){
    const c=getClient(),email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";
    if(!email||password.length<8)return accountError("Enter an email and a password with at least 8 characters.");
    const {error}=await c.auth.signUp({email,password,options:{emailRedirectTo:cfg.redirectTo}});
    if(error)return accountError(error.message);
    accountError("Account created. Check your email to confirm the account.");
  }
  async function accountGoogleSignIn(){
    const c=getClient(),{error}=await c.auth.signInWithOAuth({provider:"google",options:{redirectTo:cfg.redirectTo}});
    if(error)accountError(error.message);
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
  const originalShell=window.shell;
  window.shell=function(c){
    const html=originalShell(c);
    return html.replace('<div class="sidefoot">','<button class="nav '+(state.view==="account"?"active":"")+'" onclick="view(\'account\')"><span>◎</span>Account</button><div class="sidefoot">');
  };
  const originalView=window.view;
  window.view=function(v){
    if(v==="account"){state.view="account";state.modal=false;const root=document.getElementById("app");if(root)root.innerHTML=window.shell(accountPage());renderAccountBox();return}
    originalView(v);
  };

  if(configured()){
    const c=getClient();
    c.auth.onAuthStateChange((event,session)=>{
      if(session)setTimeout(()=>pullAndMerge().then(()=>{if(state.view==="account")renderAccountBox()}).catch(e=>console.warn("Account sync failed",e)),0);
    });
  }
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
  setTimeout(()=>{if(window.studySprintBillingStatus)window.studySprintBillingStatus()},60);
})();