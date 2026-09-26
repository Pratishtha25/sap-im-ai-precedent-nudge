# Data Quality Audit Template (P0.4)

## Purpose

Measure how often closed incidents have the fields matching depends on. Sets expectations for State A summary vs link-only (see `../decisions/link-only-summary-rule.md`).

## Sample selection

| Parameter | Guidance |
|-----------|----------|
| Population | Closed incidents (last 12–24 months) |
| Sample size | ≥ 100 random, or all if smaller plant |
| Stratify | By location / plant if possible |
| Exclude | Test / training incidents if identifiable |

## Fields to score

For each sample row, mark **Present (1)** / **Absent (0)**:

| Field | Used for |
|-------|----------|
| Description (non-empty, non-boilerplate) | Embedding similarity |
| Location | Structured filter + FR7 |
| Category / classification | Structured filter |
| Equipment | Structured filter (optional) |
| Major Root Cause | FR4 summary |
| Corrective action / CAPA | FR4 summary |
| Closure reason = invalid/duplicate (if applicable) | FR7 pool membership |

## Metrics to report

| Metric | Formula |
|--------|---------|
| Description fill rate | Present / N |
| Location fill rate | Present / N |
| Category fill rate | Present / N |
| Major Root Cause fill rate | Present / N |
| CAPA fill rate | Present / N |
| Both RCA + CAPA | Both present / N |
| Usable for link-only State A | Description + Location (+ closed) / N |
| Usable for summarized State A | Usable link-only **and** (RCA or CAPA) / N |

## Decision thresholds (suggested)

| Major Root Cause fill rate | Implication |
|----------------------------|-------------|
| ≥ 60% | Summaries common; link-only is fallback |
| 30–60% | Expect mixed; UI must handle link-only cleanly |
| < 30% | Emphasize link-only; invest in data quality before trusting summaries |

## Output

Fill [sample-results.md](sample-results.md) after running the audit (export from Manage Incidents / analytics / backend query).
