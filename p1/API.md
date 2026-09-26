# Frozen UI API contract (P1 deliverable)

Base URL (local): `http://localhost:4001`

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/ai/status` | Provider, circuit breaker, Hub configured? (no secrets) |
| `GET` | `/ai/prompts` | Prompt template IDs/versions |
| `GET` | `/config/precedent` | Feature flag, thresholds, State C mode, deep-link placeholders |
| `PATCH` | `/config/precedent` | Update config (admin) |
| `GET` | `/precedents/{incidentId}` | Precomputed panel payload — **always 200** with READY/PENDING/UNAVAILABLE |
| `POST` | `/precedents/{incidentId}/recompute` | Idempotent admin recompute |
| `POST` | `/precedents/{incidentId}/feedback` | FR9 — NOT_RELEVANT / HELPFUL / NOT_HELPFUL (log-only v1) |
| `GET` | `/feedback` | List feedback rows |
| `POST` | `/events` | Analytics: panel_shown, deep_link_clicked, feedback_submitted, false_dup_rated |
| `GET` | `/events` | Event stream |
| `GET` | `/metrics/success` | Click-through, dismiss, false-dup useful rates |
| `GET` | `/metrics/ops` | GET p50/p95, compute/AI counters, alerts |
| `GET` | `/audit` | Audit trail (reads, feedback, config) |
| `GET` | `/pilot/status` | P5 cohort loaded? pilotMode, counts |
| `POST` | `/jobs/backfill` | Rebuild closed-incident embeddings |
| `GET` | `/incidents` | List incidents in store (dev) |
| `POST` | `/incidents` | Upsert incident; enqueue compute on significant field change |

## GET /precedents/{id} shape

See `p0/contracts/api-key-contract.md`. P1 fills:

- `states.precedent.summaryText` — template from Major Root Cause + CAPA, or `null` (link-only)
- `modelVersions.summary` = `template-v1` until P2 GenAI Hub
- `modelVersions.embedding` = `bow-v1` until P2 / HANA Vector

## Default config (AD-4)

| Key | Value |
|-----|--------|
| `confidenceThreshold` | **0.5** (from sample eval — EHS must re-confirm on live corpus) |
| `falseDupSimilarityThreshold` | 0.25 |
| `stateCMode` | `LIGHTWEIGHT_NOTE` |
| `filterLooseness` | `MODERATE` |
| `featureEnabled` | `true` |

## Fail-open + pilot gate

| Condition | HTTP | Body status |
|-----------|------|-------------|
| READY row | 200 | READY |
| Missing row | 200 | UNAVAILABLE |
| Feature disabled | 200 | UNAVAILABLE |
| Compute in flight | 200 | PENDING (if marked) |
| `pilotMode=pilot_only` and user/location not in cohort | 200 | UNAVAILABLE (`pilotGated: true`) |
| Never | 5xx for “no match” | — |

Activate pilot scoping: `PILOT_MODE=pilot_only` (and optional `APPLY_PILOT_COHORT=true`). Cohort file: `p5/config/pilot-cohort.json`.
