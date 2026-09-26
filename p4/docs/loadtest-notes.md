# Load test notes — GET /precedents (P4.3.3)

## Goal

Prove read path stays fast and **does not** invoke LLM.

## How to run

```bash
cd p1
# ensure store has READY rows (npm run seed && backfill && compute)
npm start   # separate terminal
npm run loadtest
```

Script: `p1/scripts/loadtest-get.js`  
Writes: `p4/docs/loadtest-last-report.json`

## Pass criteria

| Check | Target |
|-------|--------|
| HTTP success rate | ≥ 99% |
| p95 latency | ≪ multi-second (aim < 100ms local file store) |
| LLM on GET | **None** — audit entries show `llmCalled: false` |

## Note

Local file store is not production HANA; landscape load test should repeat against BTP destination with concurrent FLP users.
