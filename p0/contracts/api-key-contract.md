# Contract — Precedent API Key (P0.2.3)

## Endpoint

```http
GET /precedents/{incidentId}
```

## Key definition

| Concept | Description | Example (from screens) |
|---------|-------------|------------------------|
| **Business number** | Human-visible Incident ID in task titles / UI | `388` |
| **Technical key** | Primary key for Manage Incidents OData/RAP | ⏳ LIVE — may equal `388` or be a UUID |
| **Display number** | Formatted label in State A | e.g. `INC-2024-00347` or `388` |

### MVP rule

- Path parameter `{incidentId}` = **technical key** used by Manage Incidents object page.
- Response payload includes:
  - `incidentId` — technical key of **current** incident  
  - `matchedIncidentId` — technical key of match  
  - `matchedIncidentNumber` — display label for UI  

If business number ≠ technical key, My Inbox adapter must map BO container value → technical key before GET (via IM API lookup if needed).

## Response status values

| status | UI |
|--------|-----|
| `READY` | Render A/B/C per payload |
| `PENDING` | Fail open — omit panel (AD-7) |
| `UNAVAILABLE` | Fail open — omit panel |

## Mock for P0 UI spikes

```json
{
  "incidentId": "388",
  "status": "READY",
  "states": {
    "precedent": {
      "show": true,
      "matchedIncidentId": "347",
      "matchedIncidentNumber": "INC-2024-00347",
      "matchConfidence": 0.87,
      "summaryText": "Root cause: guard rail missing on conveyor. Action taken: guard installed, verified 03 Mar 2025.",
      "deepLink": {
        "semanticObject": "Incident",
        "action": "display",
        "params": { "IncidentID": "347" }
      }
    },
    "falseDuplicate": { "show": false, "count": 0 },
    "noMatch": { "show": false, "showLightweightNote": false }
  },
  "aiDisclosure": {
    "labelKey": "AI_GENERATED_ADVISORY",
    "isAuthoritative": false
  },
  "computedAt": "2026-08-05T12:00:00Z"
}
```

> Replace `semanticObject`, `action`, and `params` with live values from [deep-link-fr6.md](deep-link-fr6.md).
