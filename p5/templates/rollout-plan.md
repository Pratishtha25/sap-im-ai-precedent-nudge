# Rollout Plan (post go-decision)

Use after `GO_BROADER`. If `PAUSE`, document stop below instead.

## Expand scope

| Wave | Plants / users | Date | `pilotMode` | Notes |
|------|----------------|------|-------------|-------|
| Pilot (done) | see `config/pilot-cohort.json` | | `pilot_only` | |
| Wave 2 | | | `pilot_only` (larger cohort) or `all` | |
| General availability | | | `all` | |

## Communications

- [ ] EHS announcement: advisory-only reminder
- [ ] Enablement refresher link
- [ ] Support / runbook owner named

## Monitoring (first 4 weeks of GA)

- [ ] Weekly `/metrics/success` review
- [ ] Alert on GET p95 / AI errors (`ops-runbook`)
- [ ] Feedback still log-only unless AD-8 funding approved

## Explicit stop (if PAUSE)

| Field | Value |
|-------|--------|
| Pause date | |
| Reason | |
| `featureEnabled` set false? | Y/N |
| Revisit date | |
