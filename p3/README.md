# Phase P3 — UI Integration (My Inbox + Manage Incidents)

**Status:** Implemented (UI5 fragments/controllers + runnable hybrid demo)  
**AD-1:** Strategy **E (hybrid)** — My Inbox teaser + Manage Incidents Investigation full panel

## Quick demo

```bash
# terminal 1 — API
cd p1
npm run seed && npm run backfill && npm run compute
npm start

# terminal 2 — UI demo
cd p3
npm test
npm run demo
# open http://127.0.0.1:4173
```

## Deliverables

| Item | Path |
|------|------|
| Shared panel fragment | `webapp/fragment/PrecedentPanel.fragment.xml` |
| AI-advisory CSS (FR8) | `webapp/css/precedentPanel.css` |
| i18n (advisory copy) | `webapp/i18n/i18n.properties` |
| State mapper / client libs | `webapp/lib/` |
| My Inbox teaser extension | `webapp/extension/myinbox/` |
| Manage Incidents panel | `webapp/extension/manageIncidents/` |
| Demo harness (Inbox + Manage) | `demo/` |
| UX acceptance checklist | `docs/ux-acceptance-checklist.md` |

## Behaviour

| Case | UI |
|------|-----|
| READY State A | Advisory panel + deep link to matched incident (not self) |
| READY State B | Warning only — workflow actions stay enabled |
| READY State C | Lightweight note (AD-5) |
| PENDING | Omit (optional non-blocking hint) |
| UNAVAILABLE / timeout | Silent omit (fail open) |
| Out-of-allow-list task | No teaser |
| Apply / Copy RCA | **Not present** |

## FLP deploy

See integration notes:

- `webapp/extension/myinbox/integration.md`
- `webapp/extension/manageIncidents/integration.md`

Live Strategy C/D extension points still require P0 spike confirmation in landscape.
