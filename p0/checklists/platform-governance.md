# Platform & Governance Checklist (P0.5)

## GenAI Hub / AI Core

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Generative AI Hub available in BTP subaccount | ⏳ | |
| 2 | AI Core resource group / deployment possible | ⏳ | |
| 3 | Sample embedding inference succeeds in-landscape | ⏳ | |
| 4 | Sample chat/completion succeeds in-landscape | ⏳ | |
| 5 | No route to public external LLM for incident text | ⏳ | IT/legal |
| 6 | Data processing agreement covers incident/PII in Hub | ⏳ | |

## Service hosting

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7 | CAP on BTP (CF/Kyma) approved pattern | ⏳ | Tentative: CAP Node |
| 8 | HANA Cloud available for PrecedentResult + vectors | ⏳ | AD-2 |
| 9 | Destination to S/4 or IM backend for incident read | ⏳ | |

## Write-path trigger (AD-3)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 10 | Incident create event or equivalent identified | ⏳ | Name: ________ |
| 11 | Update-on-significant-fields feasible | ⏳ | |

## Security

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 12 | Precedent API will use same authz as incident read | ⏳ | Design OK |
| 13 | Audit logging requirements understood | ⏳ | |

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| IT / BTP | | | ⏳ |
| Security | | | ⏳ |
| Legal (if required) | | | ⏳ |
| Architecture | | | ⏳ |
