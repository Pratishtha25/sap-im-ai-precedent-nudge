# Phase P0 — Discovery & Technical Spike

**Status:** Implemented as project artifacts — **live landscape validation still required** for exit gate.  
**Objective:** Resolve UI host, Incident ID binding, deep link (FR6), data quality, and platform prerequisites before P1/P3 build.

## Contents

| Path | Purpose |
|------|---------|
| [decisions/AD-1-panel-host.md](decisions/AD-1-panel-host.md) | Locked AD-1 decision (Strategy E hybrid) |
| [decisions/link-only-summary-rule.md](decisions/link-only-summary-rule.md) | FR4 rule when RCA/CAPA missing |
| [decisions/AD-2-AD-3-tentative.md](decisions/AD-2-AD-3-tentative.md) | Tentative vector store + write trigger |
| [spike-notes/current-task-ux.md](spike-notes/current-task-ux.md) | Observed My Inbox / Manage Incidents UX |
| [spike-notes/strategy-C.md](spike-notes/strategy-C.md) | My Inbox Information-tab injection spike |
| [spike-notes/strategy-D.md](spike-notes/strategy-D.md) | Manage Incidents Investigation panel spike |
| [spike-notes/strategy-B.md](spike-notes/strategy-B.md) | Custom task UI cost estimate |
| [contracts/incident-id-binding.md](contracts/incident-id-binding.md) | Work item → Incident ID contract |
| [contracts/api-key-contract.md](contracts/api-key-contract.md) | `GET /precedents/{incidentId}` key contract |
| [contracts/deep-link-fr6.md](contracts/deep-link-fr6.md) | Semantic navigation parameters |
| [contracts/mvp-task-allow-list.md](contracts/mvp-task-allow-list.md) | Which SAP_WFRT tasks get the nudge |
| [audit/data-quality-audit-template.md](audit/data-quality-audit-template.md) | How to run the corpus audit |
| [audit/false-dup-closure-codes.md](audit/false-dup-closure-codes.md) | FR7 closure reason code list |
| [audit/sample-results.md](audit/sample-results.md) | Fill with live audit numbers |
| [checklists/p0-exit-gate.md](checklists/p0-exit-gate.md) | Exit criteria tracker |
| [checklists/platform-governance.md](checklists/platform-governance.md) | GenAI Hub / IT checklist |
| [poc/incident-id/](poc/incident-id/) | ID extraction helpers + tests |
| [poc/deep-link/](poc/deep-link/) | Cross-app navigation PoC module |

## How to complete live validation

1. Walk [checklists/p0-exit-gate.md](checklists/p0-exit-gate.md) in the customer Fiori landscape.
2. Fill TBD fields marked `⏳ LIVE` in contracts and audit files.
3. Run Manage Incidents deep-link PoC from a test button (see `poc/deep-link`).
4. Confirm BO container parameters with workflow admin (do **not** rely on title parsing alone).
5. When all exit boxes are green, mark P0 complete and open P1.

## Provisional decisions (pending live confirm)

| Decision | Provisional value | Confirm in |
|----------|-------------------|------------|
| AD-1 | **E — Hybrid** | Live Strategy C + D spike |
| AD-2 | HANA Vector Engine preferred | IT / HANA availability |
| AD-3 | Event on create + significant field update | Integration team |
| Link-only State A | **Yes** when RCA/CAPA missing | EHS sign-off |
| Task allow-list | Root Causes Hierarchy + Review and complete investigation | EHS sign-off |
