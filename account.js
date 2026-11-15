(()=>{
  const cfg=window.STUDYSPRINT_AUTH||{};
  let client=null;
  let installPrompt=null;
  function configured(){return cfg.provider==="supabase"&&cfg.url&&cfg.anonKey&&window.supabase?.createClient}
  function getClient(){if(!configured())return null;if(!client)client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
  function accountStatus(){return getClient()?.auth.getSession()||Promise.resolve({data:{session:null}})}
  function accountPage(){
    return '<section>'+head("ACCOUNT","Your StudySprint account.","Sign in to sync your study data across devices. Your current local data stays on this device until you choose to sync it.")+
      '<div class="account-grid"><div class="card">'+
      (configured()?'<div id="account-box"><div class="account-loading">Checking your session…</div></div>':'<div class="account-setup"><span class="pill">ACCOUNT SYNC READY</span><h2>Connect a secure account provider</h2><p>Google sign-in and email/password are supported through the configured account provider. The public browser key belongs here; private service keys never do.</p><div class="callout"><b>Not connected yet.</b><span>The app is ready for the integration, but the provider URL and public browser key still need to be configured.</span></div></div>')+
      '</div><div class="card"><h2>What happens when you sign in?</h2><div class="rule"><b>Local-first</b><span>Your existing device data is not deleted or replaced just because you open the account page.</span></div><div class="rule"><b>Google + email</b><span>Both sign-in methods can use the same account provider.</span></div><div class="rule"><b>Cloud sync</b><span>Once configured, StudySprint can sync your plan, practice evidence and progress between devices.</span></div><div class="rule"><b>Plus access</b><span>Billing entitlement can be associated with the signed-in account instead of a browser-only flag.</span></div></div></div></section>';
  }
  async function renderAccountBox(){
    const box=document.getElementById("account-box");if(!box)return;const c=getClient();if(!c)return;
    const {data}=await c.auth.getSession();const s=data?.session;
    if(s){const email=esc(s.user?.email||"Signed in");box.innerHTML='<div class="account-user"><div class="account-avatar">'+esc((email[0]||"S").toUpperCase())+'</div><div><span class="pill">SIGNED IN</span><h2>'+email+'</h2><p>Your account session is active on this device.</p></div></div><div class="account-actions"><button class="btn secondary" onclick="accountSyncNow()">Sync local data</button><button class="btn ghost" onclick="accountSignOut()">Sign out</button></div><div id="account-sync-note" class="account-note"></div>';}
    else box.innerHTML='<div class="account-form"><span class="pill">SECURE SIGN IN</span><h2>Sign in or create your account</h2><label>Email<input id="accountEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="accountPassword" type="password" autocomplete="current-password" placeholder="At least 6 characters"></label><div class="account-actions"><button class="btn primary" onclick="accountEmailSignIn()">Sign in</button><button class="btn secondary" onclick="accountEmailSignUp()">Create account</button></div><div class="account-divider"><span>or</span></div><button class="btn secondary wide" onclick="accountGoogleSignIn()">Continue with Google</button><div id="account-error" class="account-error"></div></div>';
  }
  function accountError(msg){const e=document.getElementById("account-error");if(e)e.textContent=msg;else toast(msg)}
  async function accountEmailSignIn(){const c=getClient();const email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";if(!email||!password)return accountError("Enter your email and password.");const {error}=await c.auth.signInWithPassword({email,password});if(error)return accountError(error.message);toast("Signed in successfully.");render();}
  async function accountEmailSignUp(){const c=getClient();const email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value||"";if(!email||password.length<6)return accountError("Enter an email and a password with at least 6 characters.");const {error}=await c.auth.signUp({email,password,options:{emailRedirectTo:cfg.redirectTo}});if(error)return accountError(error.message);accountError("Account created. Check your email if confirmation is enabled.");}
  async function accountGoogleSignIn(){const c=getClient();const {error}=await c.auth.signInWithOAuth({provider:"google",options:{redirectTo:cfg.redirectTo}});if(error)accountError(error.message);}
  async function accountSignOut(){const c=getClient();if(!c)return;await c.auth.signOut();toast("Signed out.");render();}
  async function accountSyncNow(){const c=getClient();if(!c)return;const {data}=await c.auth.getSession();if(!data?.session)return;const note=document.getElementById("account-sync-note");if(note)note.textContent="Account is signed in. Cloud data storage will be enabled after the database sync table is configured; your local copy remains untouched.";}
  window.accountEmailSignIn=accountEmailSignIn;window.accountEmailSignUp=accountEmailSignUp;window.accountGoogleSignIn=accountGoogleSignIn;window.accountSignOut=accountSignOut;window.accountSyncNow=accountSyncNow;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;});
  window.addEventListener("appinstalled",()=>{installPrompt=null;});
  window.installStudySprint=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else toast("Use your browser's Add to Home Screen / Install option.")};
  const oldRender=window.render;
  window.render=function(){if(typeof oldRender==="function")oldRender();if(state.view==="account")renderAccountBox();};
  const originalNav=window.nav;
  window.nav=function(v,t,i){return originalNav(v,t,i)};
  const originalShell=window.shell;
  window.shell=function(c){const html=originalShell(c);return html.replace('<div class="sidefoot">','<button class="nav '+(state.view==="account"?"active":"")+'" onclick="view(\\'account\\')"><span>◎</span>Account</button><div class="sidefoot">').replace('</header>','</header>');};
  const originalView=window.view;
  window.view=function(v){if(v==="account"){state.view="account";state.modal=false;const root=document.getElementById("app");if(root)root.innerHTML=window.shell(accountPage());renderAccountBox();return;}originalView(v)};
  const oldService=window.addEventListener;
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
  document.addEventListener("DOMContentLoaded",()=>{if(window.__studysprintAccountReady)return;window.__studysprintAccountReady=true;});
})();
