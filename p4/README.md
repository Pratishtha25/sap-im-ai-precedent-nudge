# Phase P4 — Feedback, Metrics & Hardening

**Status:** Implemented on `p1` service + `p3` UI dismiss/events  
**Objective:** FR9 feedback, success/ops metrics, auth/audit stubs, pilot runbook.

## Quick verify

```bash
cd p1
npm test
npm start

# Feedback
curl -X POST http://localhost:4001/precedents/388/feedback ^
  -H "Content-Type: application/json" -H "X-User-Id: manager1" ^
  -d "{\"verdict\":\"NOT_RELEVANT\",\"matchedIncidentId\":\"347\",\"surface\":\"myinbox\"}"

# Events + metrics
curl -X POST http://localhost:4001/events -H "Content-Type: application/json" -H "X-User-Id: manager1" ^
  -d "{\"type\":\"panel_shown\",\"incidentId\":\"388\",\"panelState\":\"A\",\"surface\":\"myinbox\"}"
curl http://localhost:4001/metrics/success
curl http://localhost:4001/metrics/ops

# Load test GET path (no LLM)
npm run loadtest
```

## Deliverables

| Item | Path |
|------|------|
| Feedback + events API | `p1/src/ops/feedback.js`, handler routes |
| Ops metrics (p95) | `p1/src/ops/metrics.js` → `GET /metrics/ops` |
| Success metrics | `GET /metrics/success` |
| AuthZ stub | `p1/src/ops/auth.js` |
| Audit log | `p1/src/ops/audit.js` → `GET /audit` |
| UI dismiss / ratings | `p3` fragment + demo |
| AD-8 ownership | `docs/AD-8-feedback-ownership.md` |
| Ops runbook | `docs/ops-runbook.md` |
| Pilot survey | `docs/pilot-survey.md` |
| Load test + report | `p1/scripts/loadtest-get.js`, `docs/loadtest-notes.md` |
| P5 go-live checklist | `docs/p5-go-live-checklist.md` |
| Metrics query guide | `docs/metrics-queries.md` |
