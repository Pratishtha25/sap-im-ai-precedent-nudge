# AD-8 — Feedback Ownership (v1 log-only)

| Field | Value |
|-------|--------|
| Decision | **Log-only in v1** — capture FR9 feedback; do not auto-tune threshold/model |
| Status | **Confirmed for MVP** |
| Date | 2026-08-05 |

## Ownership

| Role | Responsibility |
|------|----------------|
| **Product** | Owns backlog of tuning work; decides when to fund closed loop |
| **Safety / EHS ops** | Reviews dismiss / false-dup ratings during pilot; flags bad matches |
| **Engineering** | Keeps `tuningUsed=false` on feedback rows until a funded tuning process exists |

## v1 rules

1. `POST /precedents/{id}/feedback` always persists.
2. Feedback does **not** change `confidenceThreshold` or embeddings automatically.
3. Metrics expose dismiss rate for human review in P5.
4. When tuning is funded: version prompts/threshold changes with audit entries.

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Product | | | ⏳ |
| EHS ops | | | ⏳ |
