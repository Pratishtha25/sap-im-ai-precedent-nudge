# P0 Exit Gate Checklist

Track until all required items are green. P1 matching may start after ID binding + audit clarity; **P3 UI must wait for AD-1 + FR6**.

## Exit criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | AD-1 locked (B/C/D/E) | 🟡 Provisional **E** | `decisions/AD-1-panel-host.md` — finalize after C/D PoC |
| 2 | Stable Incident ID from work item | ⏳ LIVE | `contracts/incident-id-binding.md` |
| 3 | FR6 deep link to exact incident | ⏳ LIVE | `contracts/deep-link-fr6.md` + PoC |
| 4 | Data quality audit + link-only rule | 🟡 Rule agreed; audit ⏳ | `decisions/link-only-summary-rule.md` + `audit/sample-results.md` |
| 5 | MVP task allow-list agreed | 🟡 Provisional; EHS ⏳ | `contracts/mvp-task-allow-list.md` |
| 6 | GenAI Hub path in landscape | ⏳ LIVE | `checklists/platform-governance.md` |

## Artifact completion

| Artifact | Done? |
|----------|-------|
| Current UX spike note | ✅ |
| Strategy C spike note + live result | 📝 note ✅ / live ⏳ |
| Strategy D spike note + live result | 📝 note ✅ / live ⏳ |
| Strategy B cost estimate | ✅ |
| API key contract | ✅ |
| False/dup code list | 📝 template ✅ / codes ⏳ |
| Platform governance checklist | 📝 ✅ / sign-off ⏳ |
| AD-2 / AD-3 tentative | ✅ |

## Gate decision

| Gate | Open? |
|------|-------|
| Start **P1** (data & match) | After #2 and #4 audit underway / provisional rates known |
| Start **P3** (UI) | Only when #1 FINAL and #3 pass |
| Start **P2** (AI) | After #6 |

**P0 complete when:** all six exit criteria are ✅ (not provisional).
