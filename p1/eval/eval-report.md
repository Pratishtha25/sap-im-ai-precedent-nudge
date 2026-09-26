# Offline Eval Report (P1.5)

Generated: 2026-08-05T16:45:29.579Z

## Recommended threshold (AD-4)

**0.5** (F1=1.000 on sample labeled pairs)

Default shipped in `src/config.js` should match this value after review.

## Sweep

| Threshold | Precision | Recall | TP | FP | FN | TN | FalseDup hits |
|-----------|-----------|--------|----|----|----|----|---------------|
| 0.2 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.25 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.3 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.35 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.4 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.45 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.5 | 1.00 | 1.00 | 1 | 0 | 0 | 2 | 1 |
| 0.6 | 1.00 | 0.00 | 0 | 0 | 1 | 2 | 1 |

## Best-threshold case details

```json
[
  {
    "pair": "positive_same_location_conveyor_guard",
    "expectedMatchId": "347",
    "predictedId": "347",
    "confidence": 0.5352,
    "falseDupCount": 0,
    "ok": true
  },
  {
    "pair": "positive_alt_acceptable",
    "predictedId": "347",
    "skipped": true
  },
  {
    "pair": "false_dup_warehouse_chemical",
    "expectedMatchId": null,
    "predictedId": null,
    "confidence": null,
    "falseDupCount": 2,
    "ok": true
  },
  {
    "pair": "negative_new_pattern",
    "expectedMatchId": null,
    "predictedId": null,
    "confidence": null,
    "falseDupCount": 0,
    "ok": true
  }
]
```

## False-positive risk (for EHS)

- Boilerplate descriptions (e.g. 'Injury') are excluded from indexing via isUsableDescription.
- Same-location dissimilar text should stay below threshold — raise threshold if pilot shows noise.
- False/dup closures are excluded from State A promotion (EC-FD-10).
- Tiny labeled set — re-run after P0 live audit corpus is available; EHS must review before pilot.

## Next

1. Replace `data/labeled-pairs.json` with audit-derived pairs (≥20).
2. Re-run `npm run eval` and lock AD-4 with EHS sign-off.
3. Update `confidenceThreshold` via `PATCH /config/precedent`.
