# P3 UX Acceptance Checklist

Pilot-ready walkthrough for Incident Managers / EHS / UX.

## My Inbox teaser

- [ ] List view unchanged (no badges/counts)
- [ ] Selecting Root Causes Hierarchy / Review task shows teaser under assignment text when READY
- [ ] Non-allow-listed tasks show no teaser
- [ ] Claim / Forward / Suspend / Open Task remain clickable while teaser loads or is hidden
- [ ] AI disclosure visible (“AI-generated advisory…”)
- [ ] No Apply / Copy RCA controls
- [ ] Deep link control present for State A

## Manage Incidents Investigation

- [ ] Full panel visible near Major Root Cause
- [ ] Same match/summary as My Inbox for same incident id
- [ ] Major Root Cause field not auto-filled by panel
- [ ] Deep link opens **matched** historical incident (not current)

## States

- [ ] State A: match number + optional summary + link
- [ ] State B: false/dup warning; can complete task anyway
- [ ] State C: lightweight “new pattern” note (or hidden if config HIDE)
- [ ] API down: task UI still works; panel omitted

## Accessibility

- [ ] Region labelled; disclosure announced (`aria-live` / labelledBy)
- [ ] Deep link keyboard reachable + focus visible
- [ ] Contrast acceptable on advisory / warning backgrounds

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| UX | | | ⏳ |
| EHS / Incident Manager pilot lead | | | ⏳ |
| Product | | | ⏳ |

**Demo evidence:** `npm run demo` against seeded p1 (`388` State A, `390` State B, `391` State C).
