# FlowGuard

**Outcome-focused reliability for business automations.**

> Don't just tell me an automation failed. Tell me whether the business outcome is actually safe.

## What is built

This repository contains a working front-end product prototype plus a deterministic reliability engine.

### Dashboard
- fleet health and impact-weighted incident queue
- workflow inventory and search
- workflow investigation pages
- incident investigation pages
- outcome-contract concepts
- responsive UI
- safe local demo mode

### Reliability engine
The engine currently checks three failure classes:

1. **Cadence silence** — a workflow missed its expected run window.
2. **Zombie success** — a run reports success but produces unexpectedly zero output.
3. **Definition drift** — a workflow definition differs from its approved baseline.

Findings are converted into a reliability score and an impact-weighted priority.

## Test-first rule

The core engine has a Node test suite:

```bash
npm test
```

The same suite also runs automatically in GitHub Actions on pushes and pull requests.

The build process is intentionally incremental: every reliability rule should be tested before it is connected to a real provider.

## Architecture direction

The product is designed as an external reliability layer rather than another automation builder:

**Provider adapter → normalized workflow model → deterministic checks → outcome contract → incident priority → alerts**

The first real provider integration should be read-only and server-side. Browser code must never receive provider API secrets.

## Product differentiation

Automation monitoring already exists. Current research shows products such as Midwatch and OutcomeGuard cover several n8n-specific monitoring problems including silent runs, zombie output and drift. FlowGuard therefore should not win by cloning another monitor.

The strategic wedge is **outcome contracts**: define the business promise an automation is supposed to keep, then judge technical signals against that promise. That lets the product eventually span multiple automation providers instead of becoming another n8n-only dashboard.

## Current limitations

This repository is still a prototype. It does **not** yet:
- connect to live provider accounts
- store customer secrets
- run scheduled cloud checks
- send real alerts
- authenticate users
- process real business data
- charge customers

Those pieces come after the deterministic engine and UX are proven.

## Security rules

- Never commit API keys, tokens, passwords, cookies, or database credentials.
- Provider credentials belong on a server-side boundary.
- Start with read-only provider permissions.
- Do not store execution payloads unless a future feature has a clear, justified need.

## Run locally

Open `index.html` directly, or use VS Code Live Server.

For the engine tests, install Node.js and run:

```bash
npm test
```
