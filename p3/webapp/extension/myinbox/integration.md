# My Inbox — Precedent Teaser Integration (Strategy C / E)

## Placement

Insert `PrecedentPanel.fragment.xml` **below the assignment text** on the Information tab of the generic My Inbox detail pane.

Do **not** change:

- Master list items / badges  
- Footer: Show Log, Claim, Forward, Suspend, Open Task  

## Wiring steps (after P0 Strategy C spike)

1. Identify My Inbox detail controller / extension point (Adaptation Project or custom attribute).
2. Add dependent CSS: `webapp/css/precedentPanel.css`.
3. Register i18n bundle model `i18n` from `webapp/i18n/i18n.properties`.
4. On task selection / Information tab `onAfterRendering` / route matched:
   - Read work item title + container Incident ID (preferred).
   - Call `loadPrecedentTeaser(workItem, deps)`.
5. Point `apiBaseUrl` at Precedent service destination (BTP destination → CAP/Node).

## Allow-list

Only tasks matching:

- `Root Causes Hierarchy`
- `Review and complete investigation`

See `webapp/lib/TaskAllowList.js` and `p0/contracts/mvp-task-allow-list.md`.

## Fail-open

Any fetch error / PENDING / UNAVAILABLE → panel `visible=false`. Workflow actions must remain clickable (EC-IN-07).

## Demo

Use `p3/demo` harness to validate UX before FLP deploy.
