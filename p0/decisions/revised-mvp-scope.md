# Revised MVP Scope Statement (Post–UI Observation)

## Original FR5 wording

> The panel renders inside the My Inbox task view, positioned directly below the standard incident detail fields.

## Reality

My Inbox shows a **generic SAP_WFRT task preview**, not standard incident detail fields. Full investigation context is in **Manage Incidents**.

## Revised MVP scope (AD-1 Strategy E)

| Surface | What ships in MVP |
|---------|-------------------|
| My Inbox list | **Unchanged** |
| My Inbox Information tab | **Teaser** — advisory State A/B/C strip under assignment text |
| Manage Incidents → Investigation | **Full Precedent Panel** near Major Root Cause |
| Deep link | Opens **exact** historical Manage Incidents record (FR6) |
| Behavior | Advisory only; no auto-fill; fail open |

If Strategy C is blocked in live spike, MVP may ship **D-only** (panel on Manage Incidents) and treat My Inbox as entry via existing Open Task — still meets primary user value at investigation time.

## Non-goals unchanged

- No list-view badges  
- No RCA auto-fill  
- No workflow blocking on State B  
- No public LLM  
