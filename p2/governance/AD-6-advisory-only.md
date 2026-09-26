# AD-6 — False/Duplicate Warning Is Advisory Only

| Field | Value |
|-------|--------|
| Decision | **Advisory only** — State B never blocks workflow |
| Status | **Confirmed for MVP** (product) |
| Date | 2026-08-05 |

## Rules

1. State B may show with or without State A.
2. My Inbox actions remain enabled: Claim, Forward, Suspend, Open Task, complete.
3. No API or UI control prevents task completion based on `falseDupCount`.
4. Copy must say “verify” / “resembles” — not “this is a false incident”.

## Evidence in code

- Precedent API is read-only for panel consumers.
- No workflow gateway integration that gates on State B.
- UI non-goal documented in `architecture.md` / `edge-case.md` (EC-FD-06, EC-FD-07).
