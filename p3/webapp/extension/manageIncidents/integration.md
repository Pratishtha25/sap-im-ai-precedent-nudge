# Manage Incidents — Investigation Panel Integration (Strategy D / E)

## Placement

Add `PrecedentPanel.fragment.xml` on the **Investigation** facet, ideally **above or beside Major Root Cause** (and before “Open Investigation Details”).

If Investigation does not exist yet for the incident, optionally show on **Details** until investigation is created.

## Wiring steps (after P0 Strategy D spike)

1. Confirm Manage Incidents UI tech (Fiori Elements vs freestyle).
2. Extension / adaptation: add section hosting the fragment.
3. On object page context load, pass current `IncidentID` into `loadPrecedentPanel(incidentId, deps)`.
4. Deep link uses matched incident id from payload — verify ≠ current id.

## Guardrails

- No controls that write Major Root Cause / Category / Status.
- AI disclosure text always visible when panel shown (FR8).
- Works when opened from FLP tile **without** My Inbox (standalone).

## Consistency

Same `GET /precedents/{id}` as My Inbox teaser → identical State A/B/C content.
