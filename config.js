// Public StudySprint configuration.
// Never put payment API keys, private keys, passwords, or webhook secrets here.
window.STUDYSPRINT_API_BASE = "https://studysprint.usmansdon-pk55.workers.dev";
window.STUDYSPRINT_BILLING = {
  provider: "paddle",
  environment: "sandbox",
  clientToken: "",
  plusPriceId: "",
  currencyLabel: "USD"
};

// Account sync uses Supabase when these public browser values are configured.
// The anon/publishable key is designed for browser use; never put a service-role key here.
window.STUDYSPRINT_AUTH = {
  provider: "supabase",
  url: "",
  anonKey: "",
  redirectTo: window.location.origin + window.location.pathname
};

window.STUDYSPRINT_MOBILE = {
  strategy: "pwa-first",
  nativePackaging: "capacitor-ready"
};
