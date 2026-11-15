// Public StudySprint configuration.
// Paddle client-side tokens are safe to expose in the browser; NEVER put a Paddle API key here.
window.STUDYSPRINT_API_BASE = "https://studysprint.usmansdon-pk55.workers.dev";
window.STUDYSPRINT_BILLING = {
  provider: "paddle",
  environment: "sandbox",
  clientToken: "",
  plusPriceId: "",
  currencyLabel: "USD"
};
