# Spike — Strategy D (Manage Incidents Investigation)

**Goal:** Add full Precedent Panel on Manage Incidents **Investigation** facet near Major Root Cause.

## Approaches to try (in order)

| # | Approach | Notes | Effort |
|---|----------|-------|--------|
| 1 | Fiori Elements / RAP **annotation extension** or section | If Manage Incidents is FE-based | M |
| 2 | UI adaptation / controller extension on object page | Add block under Investigation | M |
| 3 | Side-by-side CAP UI embedded via reuse component | Heavier but isolated | H |
| 4 | Custom action “View precedent” opening a fragment | Minimal invasive | L–M |

## PoC steps (live)

1. Identify Manage Incidents app (semantic object, app id) from FLP tile.
2. Open incident with Investigation tab (e.g. sample like “Testing OSHA 301 Form”).
3. Determine UI technology (Fiori Elements object page vs freestyle).
4. Add a section/fragment: load `GET /precedents/{currentIncidentId}` (mock JSON OK for spike).
5. Render State A mock with deep link to **another** incident ID.
6. Confirm Major Root Cause field still editable; no auto-fill.

## Pass criteria

- [ ] Panel visible on Investigation (or Details if Investigation absent)
- [ ] No write to RCA / category / status from panel
- [ ] Deep link opens matched incident object page
- [ ] Works when opened from tile (no My Inbox required)

## Fail / blocker

Document → AD-1 falls back to **C-only** or escalate **B**.

## Result

| Field | Value |
|-------|--------|
| Status | ⏳ LIVE — not yet executed in landscape |
| Feasible? | TBD |
| App id / semantic object | TBD |
| UI tech | TBD |
| Notes | |
| Tester | |
| Date | |
