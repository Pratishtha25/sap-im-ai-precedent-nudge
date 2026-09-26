# Contract — Work Item → Incident ID Binding (P0.2)

## API consumer need

```
GET /precedents/{incidentId}
```

`incidentId` **must** be the same technical key Manage Incidents uses for object-page navigation (UUID and/or numeric Incident ID — see [api-key-contract.md](api-key-contract.md)).

## Observed (screenshots)

Task titles embed a business-facing id:

```text
Perform investigation step 'Root Causes Hierarchy' for Incident ID 388
Review and complete investigation of Incident ID 388
```

**Title parsing is a fallback only — not acceptable as sole production binding** (EC-IN-01).

## Required live discovery (workflow admin)

Fill during P0 spike:

| Field | Value (⏳ LIVE) |
|-------|-----------------|
| Business object type | e.g. `INM_INCIDENT` / TBD |
| Container element name for incident | TBD |
| Data type | NUMC / RAW / CHAR / UUID |
| Example raw value | e.g. `388` or GUID |
| Task Gateway property path | TBD |
| Available in My Inbox custom attributes? | Yes / No |

### How to find it

1. Transaction `SWI1` / `SWIA` — open a live work item → Container.
2. Or Task Gateway OData `$metadata` / work item detail payload in network tab when selecting a task in My Inbox.
3. Confirm value equals Manage Incidents technical key used in URL/hash.

## Extraction priority (runtime)

1. **Primary:** Work-item container / Task Gateway attribute (stable).  
2. **Secondary:** Explicit custom attribute mapped by IM workflow template.  
3. **Last resort (dev only):** Parse title with `incidentIdFromTaskTitle()` — log warning; never silent in prod without feature flag.

## PoC code

See `../poc/incident-id/` — helpers for (3) and unit tests; production must use (1).

## Sign-off

| Role | Name | Date | OK? |
|------|------|------|-----|
| Workflow admin | | | ⏳ |
| Fiori/UX5 | | | ⏳ |
| CAP/API | | | ⏳ |
