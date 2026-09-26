# Spike Note — Current Task UX (P0.1.1)

**Status:** Complete (from live screenshots, 2026-08)  
**Source:** Customer Fiori Launchpad — EHS Apps

## My Inbox (Incident Management)

| Element | Observation |
|---------|-------------|
| Layout | Master–detail |
| List title | Incident Management (count shown) |
| Source system | **SAP_WFRT** |
| Example tasks | `Perform investigation step 'Root Causes Hierarchy' for Incident ID 388` |
| | `Review and complete investigation of Incident ID …` |
| Detail header | e.g. “Perform Investigation Step” |
| Metadata | Due date, Created on, Status (Ready), Priority (Medium), Source System |
| Tabs | Information (selected), Notes (0), Attachments (0), Related Links (0) |
| Body | Assignment description text only — **not** full incident object fields |
| Footer | Show Log, Claim, Forward, Suspend, **Open Task** |

### Implication

There is **no** embedded incident detail (description / location / category / reporter) in the My Inbox preview. Precedent UI must attach to assignment text area, Related Links, custom task UI, and/or Manage Incidents.

## Fiori Home — EHS Apps tiles (relevant)

- Report Incident  
- Manage Incidents (Incident Management)  
- My Inbox (Incident Management)  
- Monitor Incident Work Items  
- Workplace Safety Overview  
- Incidents — Detailed Analysis  

## Manage Incidents object page

| Element | Observation |
|---------|-------------|
| Tabs | Details, Location, People, **Investigation**, Tasks, Reports, Documents |
| Investigation fields | Investigation Status, Start/End, Investigation Lead, **Major Root Cause**, Comment |
| Action | **Open Investigation Details** |
| Header actions | Check, Category, Classification, Regulations, Status, Create Investigation, Linked Objects |
| Domain signal | OSHA 301 form scenarios present |

### Implication

FR4 summary should ground on **Major Root Cause** + investigation/CAPA details. Deep link target = this object page by Incident ID. Full precedent panel fits naturally on Investigation facet.

## Screenshots

Workspace assets (My Inbox, EHS Home, Manage Incidents Investigation) — see Cursor workspace `assets/` image captures from design session.
