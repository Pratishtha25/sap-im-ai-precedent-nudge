# P1 — Data Foundation & Matching Engine

**Status:** Implemented (local CAP-equivalent Node service v0.1)  
**Scope:** Precompute match pipeline + sync `GET /precedents/{id}` — **no LLM summaries yet** (link-only / template summary).

## Quick start

```bash
cd p1
npm run seed          # load sample closed + open incidents
npm run backfill      # build embedding index
npm run compute       # write PrecedentResult for open/current incidents
npm start             # http://localhost:4001
npm test
npm run eval          # threshold sweep + recommended AD-4 value
```

### Example API calls

```bash
# Feature flag + threshold
curl http://localhost:4001/config/precedent

# Ready result (after seed/backfill/compute)
curl http://localhost:4001/precedents/388

# Soft-fail unknown id → UNAVAILABLE (never 5xx for miss)
curl http://localhost:4001/precedents/does-not-exist

# Admin recompute (idempotent)
curl -X POST http://localhost:4001/precedents/388/recompute

# Ingest / update incident (write-path trigger simulation)
curl -X POST http://localhost:4001/incidents -H "Content-Type: application/json" -d "{...}"
```

## Layout

| Path | Role |
|------|------|
| `db/schema.cds` | CAP/HANA-oriented persistence model (deploy later) |
| `src/server.js` | HTTP API |
| `src/matching/` | Filter, embed, rank, confidence, false/dup prep |
| `src/jobs/` | Backfill, compute, async queue |
| `src/store/` | File-backed JSON store (stand-in for HANA) |
| `data/` | Sample incidents + labeled eval pairs |
| `eval/` | Offline threshold evaluation |
| `test/` | Unit / API tests |

## Design choices (P1 + P2)

| Topic | Choice |
|-------|--------|
| Host | Node service (CAP-equivalent); CDS schema ready for BTP |
| Vectors | Deterministic bag-of-words embedder (swap for GenAI Hub / HANA Vector later) |
| Persistence | `data/store.json` file store |
| AI (P2) | Write-path only: `local` or `genai-hub` providers; grounding + circuit breaker |
| Summary | LLM/local grounded one-liner, else template, else link-only |
| Threshold | Configurable; default **0.5** from eval |
| Fail open | GET returns `200` + `PENDING`/`UNAVAILABLE` — not hard 5xx on miss |

See also [`../p2/README.md`](../p2/README.md).

## Exit criteria mapping

| Criterion | How met |
|-----------|---------|
| Backfill index | `npm run backfill` + embeddings in store |
| Async compute | Queue in `src/jobs/queue.js`; `POST /incidents` enqueues |
| Sub-second GET | Read from precomputed `PrecedentResult` only |
| Configurable threshold | `GET/PATCH /config/precedent` |
| Offline eval | `npm run eval` + report |

Live pilot plant backfill and EHS review of eval remain landscape steps.
