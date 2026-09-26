# False / Duplicate Closure Codes (FR7)

## Purpose

Define which closure / status / reason values put a historical incident into the **false/duplicate candidate pool**.

## Live fill-in

Discover in Manage Incidents / customizing / domain values:

| Code / value (⏳ LIVE) | Meaning | Include in FR7 pool? |
|------------------------|---------|----------------------|
| | Not valid | Yes (expected) |
| | Duplicate | Yes (expected) |
| | | |
| | | |

### How to find codes

1. Open closed incidents known to be invalid/duplicate.
2. Note Status, Closure Reason, Classification, or equivalent fields.
3. Check value help / domain in backend (RAP/CDS or SPRO EHS IM).
4. Confirm with EHS functional that these mean “should not have been full incidents”.

## MVP detection rule (once codes known)

```text
FR7 candidate IF
  location matches current (same location id)
  AND closureReason IN (configured false/dup codes)
  AND description similarity ≥ falseDupSimilarityThreshold (separate from State A threshold)
THEN count toward N and may show State B
```

Exclude self. Do **not** use State B as a workflow gate.

## Provisional placeholders (replace after discovery)

```json
{
  "falseDuplicateClosureCodes": [],
  "falseDupSimilarityThreshold": 0.75,
  "notes": "Fill falseDuplicateClosureCodes from live value list before P2.3"
}
```

## Sign-off

| Role | Name | Date | Codes approved |
|------|------|------|----------------|
| EHS functional | | | ⏳ |
