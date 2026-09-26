# Metrics Queries / Dashboard Guide

## Success metrics (`GET /metrics/success`)

| Field | Maps to context.md §10 |
|-------|-------------------------|
| `clickThroughRate` | % matches shown with click-through |
| `dismissRate` | Trust / ignore signal |
| `falseDupUsefulRate` | % false-dup warnings confirmed useful |
| Time saved | **Survey only** (`pilot-survey.md`) — not in telemetry |

### Example weekly readout

```bash
curl -s http://localhost:4001/metrics/success
curl -s http://localhost:4001/metrics/ops
```

## Event stream (`GET /events`)

Filter client-side / SIEM:

- `panel_shown` + `panelState` in `A`,`AB`,`B`
- `deep_link_clicked`
- `feedback_submitted` / `false_dup_rated`

## Ops (`GET /metrics/ops`)

- `getLatencyMs.p95` — must stay low (no LLM on GET)
- `counters.aiErrors`, `computeSuccess` / `computeFailure`
- `alerts[]` — initial warn rules

## Audit (`GET /audit?limit=100`)

Sample trail for security review: `precedent_read` (includes `llmCalled: false`), `feedback`, `config_updated`, `recompute`.
