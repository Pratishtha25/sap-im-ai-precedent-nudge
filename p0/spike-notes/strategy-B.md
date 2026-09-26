# Spike — Strategy B (Custom My Inbox Task UI) — Optional Cost Estimate

**Goal:** Rough effort if C and D both fail.

## What it entails

1. Build custom SAPUI5 task UI showing incident summary + Precedent Panel.
2. Register UI with Task Gateway / workflow task type for EHS IM work items.
3. Wire Open Task / in-place display to custom UI.
4. Keep Claim / Forward / Suspend via My Inbox APIs.

## Rough estimate (indicative)

| Work | Person-weeks |
|------|----------------|
| Custom UI (incident header + panel) | 2–3 |
| Workflow / Task Gateway registration | 1–2 |
| Auth, testing, FLP integration | 1–2 |
| **Total** | **~4–7** |

Higher coordination cost with Basis/workflow than C or D extensions.

## Recommendation

Do **not** start B unless C and D are blocked. Prefer AD-1 fallback **D-only** first.
