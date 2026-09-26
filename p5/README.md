# Phase P5 — Pilot & MVP Validation

**Status:** Implemented as pilot operations kit + `pilot_only` API scoping  
**Objective:** Run a limited cohort, measure against `context.md` §10, decide GO / ITERATE / PAUSE.

## Start the pilot

1. Edit [`config/pilot-cohort.json`](config/pilot-cohort.json) — real managers + location IDs.
2. Fill [`templates/baseline-and-survey-log.md`](templates/baseline-and-survey-log.md).
3. Train managers with [`enablement/manager-enablement.md`](enablement/manager-enablement.md).
4. Enable scoped mode:

```bash
cd ../p1
set PILOT_MODE=pilot_only
set APPLY_PILOT_COHORT=true
npm start
```

5. Day-0 checks: [`../p4/docs/p5-go-live-checklist.md`](../p4/docs/p5-go-live-checklist.md)

## Weekly loop

```bash
cd p5
npm run readout
# review reports/week-N-readout.md
# spot-check → templates/match-quality-log.md
# optional: node scripts/adjust-threshold.js 0.55 "week 2 noise"
```

## End of pilot

1. Tally surveys into `reports/survey-summary.json`
2. `npm run go-no-go`
3. Complete `reports/pilot-results-report.md`
4. If GO → `templates/rollout-plan.md`  
   If ITERATE → `templates/tuning-backlog.md`  
   If PAUSE → `featureEnabled=false` + stop section in rollout plan

## Layout

| Path | Purpose |
|------|---------|
| `config/pilot-cohort.json` | Cohort + success targets |
| `scripts/weekly-readout.js` | Telemetry → markdown |
| `scripts/adjust-threshold.js` | Audited AD-4 changes |
| `scripts/go-no-go.js` | Decision helper |
| `templates/*` | Baseline, quality log, interviews, backlog, rollout |
| `enablement/*` | Manager training |
| `reports/*` | Readouts + results report |
| `../p1/src/pilot/cohortGate.js` | Runtime scoping |

## Decision criteria (default)

| Signal | GO leaning | ITERATE | PAUSE |
|--------|------------|---------|-------|
| Click-through | ≥ 15% | Low but trust OK | — |
| Dismiss rate | ≤ 50% | High noise | > 70% |
| Disruptive (survey) | ≤ 25% | — | High + low trust |
| Compliance issue | — | — | **Any → PAUSE** |
