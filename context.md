# Context: AI-Assisted Incident Precedent Nudge (My Inbox)

> Source of truth distilled from `problemStatement.txt`. Use this file as project context for design, build, and validation decisions.

---

## 1. Problem Statement

When an Incident Manager opens an incident review task in **My Inbox**, they have no visibility into whether this type of incident has occurred before, how it was investigated, what root cause was identified, or what corrective action was taken.

Consequences today:

- Every investigation starts from zero — even when the organization has already solved the same problem (sometimes multiple times) at the same location.
- Knowledge of “we’ve seen this before” lives only in the memory of experienced staff: inconsistent, undocumented, and lost when that person leaves or is unavailable.
- Recurring incidents go unrecognized as a pattern because each one is investigated in isolation.

---

## 2. Objective

**Primary:** Give the Incident Manager relevant historical context — a matching past incident, its investigation outcome, and its RCA — at the exact moment they begin reviewing a new incident in My Inbox, with a single click to the full record.

**Secondary:** Flag incidents that resemble past reports later found to be false or invalid, so obviously non-incidents don’t consume full investigation effort.

---

## 3. Target User

| Attribute | Value |
|-----------|--------|
| Role | Incident Manager |
| App | My Inbox (Fiori) |
| Moment of use | Reviewing / completing an assigned incident workflow task |

---

## 4. Current State (Without This Feature)

| Step | What happens today |
|------|--------------------|
| Incident Manager opens My Inbox | Sees task: “Review and complete incident” |
| Selects the task | Sees incident details only — description, location, category, reporter |
| Manager decides next step | Relies entirely on personal memory or manually searches Manage Incidents for similar past cases (often skipped due to time pressure) |
| Investigation begins | Started from scratch, even if an identical incident was closed months ago at the same location |

---

## 5. Proposed Solution — MVP Scope

When the Incident Manager selects an incident task in My Inbox, a **message panel** appears directly below the incident details, before any other action is taken.

### 5.1 Exact UX Flow (MVP)

1. **My Inbox list view** — Task appears as normal: “Review and complete incident” with existing metadata. **No change to list view for MVP.**
2. **Manager selects the task** — Incident detail panel loads as it does today.
3. **New: Precedent panel** renders below the incident details in one of three states:

#### State A — Match found

> This kind of incident has happened before. For reference, you may check Incident **INC-2024-00347**, which had a similar description and location. [Open in Manage Incidents →]

One-line summary: root cause identified + corrective action taken  
Example: *“Root cause: guard rail missing on conveyor. Action taken: guard installed, verified 03 Mar 2025.”*

#### State B — Possible false / duplicate incident

> ⚠ This report resembles [N] past incidents at this location that were later closed as not valid / duplicate. Please verify the details before proceeding with investigation.

#### State C — No match found

No panel shown, **or** a lightweight note: *“No similar past incidents found — this may be a new pattern”* (prevents the manager from thinking the feature is broken).

4. **Manager clicks the link** → Deep-navigates into the **Manage Incidents** app, opened to that specific historical incident record (not a search results list).
5. **Manager proceeds** with their own review/investigation as normal.

**Advisory only:** The panel does **not** pre-fill or auto-complete any field in the current incident.

### 5.2 MVP Guardrail — What’s Deliberately Excluded

The panel shows **where to look**, not a conclusion to copy.

- Does **not** auto-fill the new incident’s category, RCA, or closure fields from the matched incident.
- Decision stays with the Incident Manager.
- Rationale: investigation quality + OSHA recordkeeping requires an actual investigation, not a copied one.

---

## 6. Functional Requirements

| ID | Requirement |
|----|-------------|
| **FR1** | On incident creation, an AI service categorizes the incident (type, severity, recordability signal) using description + structured fields |
| **FR2** | The system searches historical closed incidents for matches, filtered first by location / equipment / category, then ranked by description similarity |
| **FR3** | Match confidence must exceed a configurable threshold before any panel is shown — no panel for weak / low-confidence matches (avoids noise) |
| **FR4** | If a match is found, the system retrieves that incident’s root cause and corrective action (from linked investigation / CAPA data) and generates a one-line, plain-language summary |
| **FR5** | The panel renders inside the My Inbox task view, positioned directly below the standard incident detail fields — no separate app or tab |
| **FR6** | The incident reference number in the panel is a working deep link that opens the exact historical incident in Manage Incidents, not a search |
| **FR7** | Separately from the precedent match, the system checks whether similar past reports at this location were closed as “not valid” / “duplicate,” and if so, surfaces a distinct warning-style message |
| **FR8** | The panel must clearly distinguish itself as AI-generated advisory content (visually and in wording) — never presented as a system-verified fact |
| **FR9** | Manager can dismiss / mark the suggestion “not relevant” — this feedback is logged for future match-quality tuning (not required to block MVP, but the field should be captured even if unused in v1) |

---

## 7. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Latency** | Panel should render within the same load time as the existing incident detail view — a multi-second delay will train managers to ignore or skip it |
| **Governance** | AI processing must run within SAP’s governed AI layer (**SAP AI Core / Generative AI Hub**) so incident data doesn’t leave the SAP landscape — likely a hard requirement from IT / legal given sensitive incident data |
| **Graceful degradation** | If the AI service is unavailable, the incident task must still open and function normally — this is an enhancement layer, never a blocker |

---

## 8. Observed Environment (from live Fiori screens)

Grounding for UX and integration — captured from the customer Fiori Launchpad.

### 8.1 Fiori Launchpad — EHS Apps

| Observation | Implication |
|-------------|-------------|
| Home group **EHS Apps** hosts the IM suite | Solution lives in SAP **EHS Incident Management**, not a custom-only inbox |
| Tiles include **Report Incident**, **Manage Incidents**, **My Inbox (Incident Management)**, **Monitor Incident Work Items**, **Workplace Safety Overview**, analytics | Precedent nudge should deep-link to **Manage Incidents**; optional later surfaces: Report Incident / Monitor Work Items |
| My Inbox tile shows a task count (e.g. 6) | Workflow-driven; managers already live in My Inbox for IM work |

### 8.2 My Inbox — actual task UI

| Observation | Implication |
|-------------|-------------|
| Master–detail My Inbox; list titled **Incident Management** | Standard My Inbox app, IM-filtered task list |
| **Source System: SAP_WFRT** | Tasks come from **SAP Business Workflow** runtime (classic WFRT), not a pure custom CAP inbox |
| Example tasks: *Perform investigation step 'Root Causes Hierarchy' for Incident ID 388*; *Review and complete investigation of Incident ID …* | Multiple investigation workflow steps — not only a single “review” task. Precedent panel must work for **investigation-step** tasks keyed by Incident ID |
| Detail pane is a **generic task preview**: title, due/created dates, status, priority, short assignment text | **Not** a custom object page with full incident fields (description/location/category). Original MVP wording assumed “below incident details” — that layout does **not** exist in the current detail pane |
| Icon tabs: Information, Notes (0), Attachments (0), Related Links (0) | Limited extension surface in the standard preview |
| Footer: Show Log, Claim, Forward, Suspend, **Open Task** | Primary work often continues via **Open Task** into the investigation/incident UI. Panel placement options: (1) extend My Inbox Information area, (2) surface on the Open Task target / Manage Incidents, or (3) both |

### 8.3 Manage Incidents — object page

| Observation | Implication |
|-------------|-------------|
| Object page tabs: **Details**, **Location**, **People**, **Investigation**, **Tasks**, **Reports**, **Documents** | Rich structured context for matching filters (location, people) and for RCA retrieval (**Investigation**) |
| Investigation facet: Status, Start/End, Lead, **Major Root Cause**, Comment, **Open Investigation Details** | FR4 summary should prefer **Major Root Cause** + investigation details / CAPA behind “Open Investigation Details” |
| Header actions: Check, Category, Classification, Regulations, Status, Create Investigation, Linked Objects | Category/classification available as structured match keys (FR1/FR2) |
| Example title supports **OSHA 301** scenarios | Reinforces MVP guardrail: advisory only — no auto-filled investigation/RCA |

### 8.4 Screenshot references

Stored under the workspace assets for design reference (My Inbox detail, EHS Home tiles, Manage Incidents Investigation tab).

---

## 9. Technical Dependencies (Validate Early)

| Dependency | Detail | Risk |
|------------|--------|------|
| **My Inbox extensibility** | Live UI is the **standard generic My Inbox preview** + **Open Task**, sourced from **SAP_WFRT**. Extending “below incident details” is **not** straightforward — spike must choose: enhance Information tab content, custom task UI replacement, Related Links, or panel on Manage Incidents / investigation step UI | **Still the critical path** — now narrowed: Strategy A (already-custom UI) is unlikely |
| **Deep link** | Target confirmed: **Manage Incidents** object page by Incident ID (e.g. 388). Need semantic-object navigation to that object, ideally Investigation tab for RCA context | Blocks FR6 |
| **Historical data quality** | Matching depends on Investigation **Major Root Cause** and detail/CAPA completeness on closed incidents — audit fill rates before scoping accuracy | Affects FR2 / FR4 |
| **Task → Incident ID binding** | Workflow task titles embed Incident ID; confirm stable technical parameter (not only title text) for Precedent API lookup | Blocks reliable panel fetch |

---

## 10. Success Metrics (MVP Validation — Not Full Rollout)

1. % of incidents where a precedent match is shown and the manager actually clicks through
2. Manager-reported time saved on investigation start (even a rough before/after estimate from a pilot group)
3. % of flagged “possible false incident” warnings the manager confirms were correct
4. Manager feedback: is the panel trusted, ignored, or actively disruptive?

---

## 11. Open Questions (Resolve Before Build)

1. What confidence threshold is “good enough” to show a match without creating false confidence?
2. Should the false-incident flag **block** the manager from proceeding, or remain **purely advisory**?  
   → **Recommend: advisory only for MVP** — don’t let AI gate a workflow step.
3. Who owns tuning the matching logic post-launch — is there a real feedback loop resourced, or is FR9 logged-but-unused for now?
4. **Where should the panel live given the generic My Inbox preview?**  
   → **P0 provisional: Strategy E (hybrid)** — My Inbox teaser + Manage Incidents Investigation. See `p0/decisions/AD-1-panel-host.md`. Finalize after live C/D spike.
5. Which workflow tasks get the nudge in MVP — all investigation steps (e.g. Root Causes Hierarchy) or only “Review and complete investigation”?  
   → **P0 provisional allow-list:** both Root Causes Hierarchy **and** Review and complete investigation. See `p0/contracts/mvp-task-allow-list.md`.

---

## Design Principles (Derived)

- **Advisory, never authoritative** — AI suggests context; the manager decides.
- **Show where to look, not what to copy** — no auto-fill of RCA / category / closure.
- **Same-moment value** — context appears at task open in My Inbox, not in a separate tool.
- **Fail open** — AI outage must not block the incident workflow.
- **Governed AI only** — stay inside SAP AI Core / Generative AI Hub.
- **Noise control** — configurable confidence threshold; weak matches stay hidden.
- **Honest empty state** — State C should not look like a broken feature.
- **Feedback ready** — capture “not relevant” even if unused in v1 (FR9).

---

## Glossary

| Term | Meaning in this project |
|------|-------------------------|
| My Inbox | SAP Fiori app where Incident Managers complete workflow tasks |
| Manage Incidents | App holding full incident records (destination of deep links) |
| RCA | Root Cause Analysis |
| CAPA | Corrective and Preventive Action |
| Precedent panel | The MVP UI message panel under incident details in My Inbox |
| Precedent match | A historical closed incident judged similar enough (above threshold) to surface |
| False / invalid / duplicate | Past reports at the same location later closed as not valid or duplicate |

---

*Generated from `problemStatement.txt` — keep in sync when the problem statement changes.*
