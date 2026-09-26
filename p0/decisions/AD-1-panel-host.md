# AD-1 Decision Record — Panel Host UI

| Field | Value |
|-------|--------|
| Decision ID | AD-1 |
| Status | **PROVISIONALLY LOCKED** — pending live Strategy C/D PoC |
| Date | 2026-08-05 |
| Decided value | **Strategy E — Hybrid** |
| Owner | Product + Fiori/UX5 |

## Context

Live Fiori screens show:

- My Inbox detail = **generic SAP_WFRT task preview** (assignment text + Information / Notes / Attachments / Related Links).
- Footer actions: Show Log, Claim, Forward, Suspend, **Open Task**.
- Full incident/RCA context lives in **Manage Incidents → Investigation** (Major Root Cause, Open Investigation Details).

Original FR5 (“panel below incident details in My Inbox”) is **not literally feasible** on the current generic preview.

## Options considered

| Option | Feasibility (observed) | Pros | Cons |
|--------|------------------------|------|------|
| A — Already-custom My Inbox UI | Unlikely | N/A | Not present |
| B — Custom task UI replacement | Possible, high cost | Full control | Long lead; workflow registration |
| C — Enhance Information tab | Likely with effort | Nudge at task select | Limited space; extension APIs TBD |
| D — Manage Incidents Investigation | Likely | Right moment for RCA | Not “in My Inbox” alone |
| **E — Hybrid (C teaser + D full)** | Preferred | Matches real work path | Two surfaces to maintain |

## Decision

**Adopt Strategy E (hybrid) for MVP:**

1. **My Inbox teaser** (Strategy C): short advisory strip under assignment text on Information tab — State A one-liner + link, or State B warning, or State C note.
2. **Manage Incidents full panel** (Strategy D): full State A/B/C on **Investigation** facet near Major Root Cause.

If live spike finds **C blocked** but **D works** → fall back to **D-only** (still acceptable MVP; update FR5 wording).  
If **D blocked** but **C works** → **C-only** with deep link to Manage Incidents.  
If both blocked → escalate to **B** (custom task UI) before P3 schedule commit.

## Consequences

- Revise FR5 interpretation: “at moment of review” = My Inbox task select **and/or** investigation UI — not necessarily a full object page inside My Inbox.
- P3 builds two thin UI adapters over one `GET /precedents/{incidentId}` API.
- P0 exit still requires live PoC for C and/or D (see `../spike-notes/strategy-C.md`, `strategy-D.md`).

## Live validation checklist

- [ ] Strategy C PoC: inject control without breaking Claim/Forward/Open Task
- [ ] Strategy D PoC: section on Investigation facet
- [ ] Product confirms hybrid copy/UX
- [ ] Update this status from PROVISIONAL → FINAL

## Related

- `architecture.md` §6.1, §15
- `../spike-notes/current-task-ux.md`
