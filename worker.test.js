const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "worker.js"), "utf8")
  .replace(/export default \{[\s\S]*\};\s*$/, "globalThis.__handler = { fetch: async (request, env) => {\n    if (request.method === \"OPTIONS\") return new Response(null, { status: 204, headers: { \"Content-Type\": \"application/json; charset=utf-8\" } });\n    const url = new URL(request.url);\n    if (request.method === \"GET\" && url.pathname === \"/health\") return json({ ok:true, service:\"StudySprint\", aiProvider:\"cloudflare-workers-ai\", aiConfigured:Boolean(env.AI) });\n    if (request.method === \"GET\" && url.pathname === \"/api/entitlement\") return entitlementResponse(url.searchParams.get(\"deviceId\"), env);\n    if (request.method === \"GET\" && url.pathname === \"/api/billing/status\") return billingStatus(env);\n    return json({ error: \"Not found.\" }, 404);\n  } };");

const context = {
  console,
  URL,
  Response,
  Request,
  crypto: globalThis.crypto,
  TextEncoder,
  Date,
  JSON,
  String,
  Number,
  Boolean,
  Math,
  Object,
  Array
};
vm.runInNewContext(source, context, { filename: "worker.js" });
const handler = context.__handler;

async function read(response) {
  return response.json();
}

(async () => {
  let r = await handler.fetch(new Request("https://example.com/health"), { AI: {} });
  assert.equal(r.status, 200);
  assert.deepEqual(await read(r), {
    ok: true,
    service: "StudySprint",
    aiProvider: "cloudflare-workers-ai",
    aiConfigured: true
  });

  r = await handler.fetch(new Request("https://example.com/api/entitlement"), {});
  assert.equal(r.status, 400);
  assert.equal((await read(r)).error, "Missing deviceId.");

  r = await handler.fetch(new Request("https://example.com/api/entitlement?deviceId=test-device"), {});
  assert.equal(r.status, 200);
  assert.equal((await read(r)).configured, false);

  r = await handler.fetch(new Request("https://example.com/api/billing/status"), {});
  assert.equal(r.status, 200);
  const status = await read(r);
  assert.equal(status.provider, "paddle");
  assert.equal(status.webhookConfigured, false);
  assert.equal(status.entitlementStorageConfigured, false);

  r = await handler.fetch(new Request("https://example.com/nope"), {});

  assert.equal(r.status, 404);

  console.log("StudySprint worker tests: PASS");
})();