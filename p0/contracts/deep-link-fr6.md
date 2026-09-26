# Contract — Deep Link FR6 (Manage Incidents)

## Requirement

Panel link must open the **exact** historical incident in Manage Incidents — **not** a search results list.

## Navigation pattern (SAP Fiori)

Use `sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")` → `hrefForExternal` / `toExternal` with:

```js
{
  target: {
    semanticObject: "<TBD>",  // e.g. often related to EHS Incident
    action: "<TBD>"           // e.g. display | manage | displayFactSheet
  },
  params: {
    // Exact key names ⏳ LIVE — examples to try:
    // IncidentID: "347"
    // IncidentUUID: "..."
    // EhsIncidentInternalID: "..."
  }
}
```

## Live discovery checklist

| Step | Action | Result (⏳ LIVE) |
|------|--------|------------------|
| 1 | From FLP, open Manage Incidents for known ID (e.g. 388) | |
| 2 | Copy URL / hash after object page loads | |
| 3 | Identify semantic object + action from Intent or App Manager | |
| 4 | Identify mandatory params | |
| 5 | From My Inbox console, call `toExternal` with matched ID | Exact object? Y/N |
| 6 | Try opening Investigation tab via param / query (optional) | Supported? Y/N |
| 7 | User without display auth | Graceful error? Y/N |

## Filled navigation config (complete in landscape)

```json
{
  "semanticObject": "⏳ LIVE",
  "action": "⏳ LIVE",
  "params": {
    "⏳ LIVE": "{matchedIncidentId}"
  },
  "optionalInvestigationTab": {
    "supported": false,
    "how": "⏳ LIVE — section id / query param if any"
  },
  "verifiedIncidentIds": [],
  "verifiedBy": "",
  "verifiedOn": ""
}
```

Store the locked config also in `../poc/deep-link/navigation-config.json` after verification.

## Pass / fail

| Criterion | Required |
|-----------|----------|
| Lands on single incident object page | **Yes** |
| Lands on search/filtered list only | **Fail FR6** |
| Works for closed historical incidents | **Yes** |
| Investigation tab deep-link | Nice-to-have |

## PoC

See `../poc/deep-link/` — portable helper + HTML harness notes for FLP console testing.
