# Deep Link PoC — How to run in Fiori Launchpad

1. Complete live discovery in `../../contracts/deep-link-fr6.md`.
2. Update `navigation-config.json` with real `semanticObject`, `action`, `incidentParamName`.
3. Open My Inbox in FLP → F12 console.
4. Paste a minimal harness:

```javascript
// Adjust names after bundling or copy buildNavigationIntent inline
const config = {
  semanticObject: "…",
  action: "…",
  incidentParamName: "IncidentID"
};
const matchedIncidentId = "347"; // known closed incident

const intent = {
  target: { semanticObject: config.semanticObject, action: config.action },
  params: { [config.incidentParamName]: matchedIncidentId }
};

sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then((nav) => {
  nav.toExternal(intent);
});
```

5. **Pass:** Manage Incidents opens on that single incident’s object page.  
6. **Fail:** Search list or wrong app — FR6 not met; do not start P3.

Record results in `navigation-config.json` `_comments` fields.
