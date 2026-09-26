# Phase P2 — Governed AI Services

**Status:** Implemented on top of `p1/` Precedent service  
**Objective:** FR1 categorization, FR4 grounded RCA summary, FR7 State B, circuit breaker — **write path only**. GET `/precedents` remains LLM-free.

## What’s included

| Deliverable | Location |
|-------------|----------|
| Prompt pack (categorize-v1, summarize-v1) | `prompts/` + `../p1/src/ai/prompts.js` |
| AI orchestrator + providers | `../p1/src/ai/` (`local` + `genai-hub`) |
| Grounding validator | `../p1/src/ai/grounding.js` |
| Circuit breaker / retry | `../p1/src/ai/circuitBreaker.js` |
| Updated write-path compute | `../p1/src/jobs/compute.js` |
| Governance evidence pack | `governance/` |
| AD-6 advisory confirmation | `governance/AD-6-advisory-only.md` |

## Providers

| Provider | When | Egress |
|----------|------|--------|
| `local` (default) | Dev/tests — deterministic governed stand-in | **None** |
| `genai-hub` | Landscape — SAP Generative AI Hub | **SAP landscape only** |

```bash
# Local (default)
cd ../p1 && npm run compute && npm start

# Point at GenAI Hub (BTP)
set AI_PROVIDER=genai-hub
set GENAI_HUB_BASE_URL=https://...
set GENAI_HUB_DEPLOYMENT_ID=...
set GENAI_HUB_AUTH_TOKEN=...
```

## Pipeline (write path)

```text
Incident upsert/event
  → PENDING
  → categorize (FR1, fail soft)
  → match (P1 engine + AI category boost)
  → summarize grounded (FR4) or link-only
  → false/dup count (FR7)
  → READY PrecedentResult
```

`GET /precedents/{id}` only reads the store — **no AI calls**.

## Verify

```bash
cd ../p1
npm test
npm run seed && npm run backfill && npm run compute
curl http://localhost:4001/precedents/388
curl http://localhost:4001/ai/status
```

## Exit criteria

See `governance/exit-checklist.md` and `../implementationPlan.md` P2 section.
