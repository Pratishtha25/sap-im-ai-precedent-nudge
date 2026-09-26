# Decision — Link-Only State A When RCA/CAPA Missing

| Field | Value |
|-------|--------|
| Status | **AGREED for MVP** (confirm fill rates in live audit) |
| Date | 2026-08-05 |
| Relates to | FR4, EC-DQ-01…03 |

## Rule

When a precedent match exceeds the confidence threshold:

| Matched incident data | Panel behavior |
|-----------------------|----------------|
| Major Root Cause **and** corrective action / CAPA present | State A with **one-line grounded summary** + deep link |
| Only Major Root Cause | State A with summary from root cause only **or** link-only — **MVP default: root-cause-only one-liner** |
| Only CAPA / corrective action | State A **link-only** (do not invent root cause) |
| Neither RCA nor CAPA | State A **link-only** — reference number + deep link + advisory chrome; **empty summary** |
| Summary LLM fails / ungrounded | Fall back to **link-only**; never show speculative text |

## Rationale

- Historical RCA fill rates are unknown until audit (`../audit/sample-results.md`).
- Inventing root cause violates OSHA / investigation integrity guardrail.
- A match without summary still delivers primary value: “we’ve seen this — open INC-…”.

## Non-negotiable

- No auto-fill of current incident Major Root Cause / category / closure from the match.
