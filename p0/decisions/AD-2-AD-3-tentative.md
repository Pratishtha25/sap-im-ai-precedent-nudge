# AD-2 / AD-3 — Tentative Platform Decisions

| Field | Value |
|-------|--------|
| Status | **TENTATIVE** — confirm in P0.5 live checklist |
| Date | 2026-08-05 |

## AD-2 — Vector store

| Option | Notes |
|--------|--------|
| **Preferred: HANA Cloud Vector Engine** | Keep embeddings next to incident app data; single landscape |
| Alternative: AI Core–attached vector store | If HANA vector not licensed / available |

**Action:** IT confirms HANA vector availability → lock AD-2 in P1 kickoff.

## AD-3 — Write-path trigger

| Option | Notes |
|--------|--------|
| **Preferred: Event on incident create + update** of description, location, category, equipment | Freshest results before My Inbox review |
| Fallback: scheduled batch every N minutes | If events unavailable in landscape |
| Optional: workflow step exit before review task | Aligns with task creation timing |

**Significant field change set (recompute):**

- Description  
- Location  
- Category / classification  
- Equipment  

**Action:** Integration team names concrete event (e.g. RAP business event, Enterprise Event Mesh, or Change Documents job).

## Service host

| Layer | Tentative choice |
|-------|------------------|
| Precedent API | CAP (Node.js) on SAP BTP |
| AI | Generative AI Hub → AI Core |
| UI | SAPUI5 extensions (My Inbox + Manage Incidents) |
