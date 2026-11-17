// Public StudySprint configuration.
// Never put payment API keys, private keys, passwords, or webhook secrets here.
window.STUDYSPRINT_API_BASE = "https://studysprint.usmansdon-pk55.workers.dev";
window.STUDYSPRINT_BILLING = {
  provider: "paddle",
  environment: "sandbox",
  clientToken: "",
  plusPriceId: "",
  currencyLabel: "USD",
  // Keep "sandbox" until the Paddle integration has been tested end-to-end.
  // Production uses a live_ client token and the live Plus price ID.
  environment: "sandbox"
};

// Account sync uses Supabase when these public browser values are configured.
// The anon/publishable key is designed for browser use; never put a service-role key here.
window.STUDYSPRINT_AUTH = {
  provider: "supabase",
  url: "https://svnmmruxpviddfaiuqri.supabase.co",
  anonKey: "sb_publishable_r1SncPoN_BRr0Ofb8Ge4Cw_LaT43NJ8",
  redirectTo: window.location.origin + window.location.pathname
};

window.STUDYSPRINT_MOBILE = {
  strategy: "pwa-first",
  nativePackaging: "capacitor-ready"
};
