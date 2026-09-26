# Ops Runbook — Precedent Nudge

## Disable panel globally (no redeploy)

```http
PATCH /config/precedent
{ "featureEnabled": false }
```

Or set store config / BTP env equivalent. UI fails open (no panel).

## Disable AI compute only (matching still works with templates)

```http
PATCH /config/precedent
{ "aiComputeEnabled": false }
```

## Recompute one incident

```http
POST /precedents/{incidentId}/recompute
```

## Rebuild embeddings

```http
POST /jobs/backfill
```

## AI Core / GenAI Hub outage

1. Circuit breaker opens after repeated failures (see `GET /ai/status`).
2. Write path falls back to template / skip AI — results still `READY` when match found.
3. GET path **never** calls LLM — panels keep serving last `PrecedentResult`.
4. If results stale/missing: UI omits panel (fail open); workflow unaffected.
5. Optional: `featureEnabled=false` until Hub recovers.

## Check health

| Endpoint | Expect |
|----------|--------|
| `GET /health` | `{ ok: true }` |
| `GET /metrics/ops` | p95 GET latency; alerts array |
| `GET /ai/status` | circuitBreaker.state, genAiHubConfigured |

## Alert thresholds (initial)

| Signal | Warn when |
|--------|-----------|
| GET p95 | > 1000 ms |
| AI errors counter | ≥ 10 (since process start) |
| Compute failures | Rising vs success |

## Auth (landscape)

- Local default: `AUTH_DISABLED=true`
- Pilot: `AUTH_DISABLED=false` + `X-User-Id` (+ optional `PRECEDENT_AUTH_TOKEN`)
