# P5 Go-Live Checklist (from P4)

Use before enabling pilot cohort.

## Prerequisites

- [ ] P0 AD-1 FINAL + FR6 deep link verified in FLP  
- [ ] P1 index backfilled for pilot plants  
- [ ] P2 GenAI Hub config or local provider accepted for pilot  
- [ ] P3 UI extensions deployed to test FLP (or demo signed as interim)  
- [ ] P4 feedback + metrics endpoints reachable  
- [ ] AD-8 log-only ownership acknowledged  

## Pilot enablement

- [ ] Pilot managers + locations named  
- [ ] `featureEnabled=true` only for pilot (or role-based flag)  
- [ ] Auth: `AUTH_DISABLED=false` + user headers / XSUAA wired  
- [ ] Ops runbook reviewed with support  
- [ ] Baseline survey questions captured (`pilot-survey.md`)  
- [ ] Enablement: advisory-only, deep link, dismiss  

## Day-0 checks

- [ ] `GET /health` ok  
- [ ] `GET /metrics/ops` p95 healthy  
- [ ] Sample State A/B/C in My Inbox + Manage Incidents  
- [ ] Claim / Forward / Open Task still work  
- [ ] Feedback `NOT_RELEVANT` persists  

## Rollback

- [ ] `PATCH /config/precedent { "featureEnabled": false }`  
- [ ] Confirm panels gone; workflow unaffected  
