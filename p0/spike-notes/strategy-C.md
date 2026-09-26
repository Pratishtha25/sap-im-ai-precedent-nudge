# Spike — Strategy C (My Inbox Information Tab)

**Goal:** Inject precedent teaser under assignment text without breaking Claim / Forward / Suspend / Open Task.

## Approaches to try (in order)

| # | Approach | Where to look | Effort |
|---|----------|---------------|--------|
| 1 | My Inbox **custom attribute** / extension for scenario | SAP Note / My Inbox extensibility for Task Gateway | M |
| 2 | **Component enhancement** on standard detail view | UI5 flexibility / adaptation project | M–H |
| 3 | **Related Links** entry “View similar past incident” | Related Links tab (count currently 0) | L — weaker UX |
| 4 | Replace with custom task UI (becomes Strategy B) | Task UI registration for IM BO | H |

## PoC steps (live)

1. Identify My Inbox app id / BSP / UI5 component for this FLP tile (Incident Management filter).
2. In browser devtools, inspect Information tab control tree under selected work item.
3. Confirm whether Task Gateway returns custom attributes for the IM work item.
4. Attempt Adaptation Project or controller extension to add a `sap.m.MessageStrip` / custom panel bound to `GET /precedents/{id}`.
5. Verify footer actions still fire (Claim, Forward, Open Task).

## Pass criteria

- [ ] Teaser visible on Information tab for allow-listed task
- [ ] Claim / Forward / Suspend / Open Task unchanged
- [ ] Fail open if Precedent API down
- [ ] No list-view changes

## Fail / blocker

Document exact blocker (no extension point, unsupported standard app, etc.) → AD-1 falls back to **D-only**.

## Result

| Field | Value |
|-------|--------|
| Status | ⏳ LIVE — not yet executed in landscape |
| Feasible? | TBD |
| Notes | |
| Tester | |
| Date | |
