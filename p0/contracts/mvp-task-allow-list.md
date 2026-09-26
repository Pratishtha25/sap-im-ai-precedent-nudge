# MVP Task Allow-List (P0.2.2)

Which SAP_WFRT My Inbox tasks show the precedent nudge in MVP.

## Provisional allow-list (pending EHS sign-off)

| # | Task pattern (from live UI) | Include in MVP? | Rationale |
|---|----------------------------|-----------------|-----------|
| 1 | Perform investigation step **'Root Causes Hierarchy'** for Incident ID … | **Yes** | Manager is forming RCA — highest value for precedent |
| 2 | **Review and complete investigation** of Incident ID … | **Yes** | Review moment aligns with original problem statement |
| 3 | Other investigation steps (unnamed / future) | **No** (v1) | Avoid noise until allow-list expands |
| 4 | Non-IM / non-investigation work items | **No** | Out of scope |

## Matching rule (implementation)

Prefer stable **task type / step ID** from workflow definition over title substring.

Provisional title matchers (fallback only):

```text
Root Causes Hierarchy
Review and complete investigation
```

See `../poc/incident-id/taskAllowList.js`.

## Open question (context Q5)

> All investigation steps vs review-only?

**MVP answer:** Start with **(1) + (2)** above. Expand after pilot if show-rate is healthy.

## Sign-off

| Role | Name | Date | Approved allow-list |
|------|------|------|---------------------|
| EHS functional | | | ⏳ |
| Product | | | ⏳ |
