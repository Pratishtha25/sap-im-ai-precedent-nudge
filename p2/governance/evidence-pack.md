# AI Governance Evidence Pack (P2)

For IT / legal / security review before landscape GenAI Hub enablement.

## 1. Data boundary

| Control | Implementation |
|---------|----------------|
| No public LLM | Providers: `local` (dev) or `genai-hub` only |
| Incident text egress | Only to SAP Generative AI Hub / AI Core when `AI_PROVIDER=genai-hub` |
| Secrets | `GENAI_HUB_AUTH_TOKEN` via env / BTP destination — not in repo |
| GET path | **Zero** AI calls — precomputed store read only |

## 2. Purpose limitation

| Capability | Purpose | Writes incident fields? |
|------------|---------|-------------------------|
| Categorize | Match filter assist + advisory signals | Stores `aiCategory` side fields only — **not** OSHA determination |
| Summarize | One-line reference from matched RCA/CAPA | **No** write to current incident RCA |
| False/dup | Advisory warning count | **No** workflow gate |

## 3. Prompt governance

| Template | ID | Version | File |
|----------|-----|---------|------|
| Categorize | categorize-v1 | 1.0.0 | `../prompts/categorize-v1.md` |
| Summarize | summarize-v1 | 1.0.0 | `../prompts/summarize-v1.md` |

Logged per result: `categorizeTemplateId`, `summarizeTemplateId`, `summaryMode`, `aiProvider`.

## 4. Resilience

| Control | Behavior |
|---------|----------|
| Circuit breaker | Opens after N AI failures; write path degrades to template / skip AI |
| Retry | Limited backoff on write path |
| `aiComputeEnabled` | Disables AI without redeploy |
| `featureEnabled` | Hides panel entirely |
| Categorization error | Incident create / match still proceeds |

## 5. Grounding & compliance

| Control | Behavior |
|---------|----------|
| Link-only rule | No RCA → no invented summary |
| Grounding check | Rejects speculative summary tokens |
| FR8 disclosure | API always returns `aiDisclosure.isAuthoritative: false` |
| AD-6 | State B advisory only — see `AD-6-advisory-only.md` |

## 6. Landscape checklist (⏳ LIVE)

- [ ] GenAI Hub resource group + deployment created
- [ ] Destination / token configured in BTP
- [ ] Network policy: no route to public LLM endpoints
- [ ] DPA / processing record covers EHS incident text
- [ ] `GET /ai/status` shows `genAiHubConfigured: true` in test subaccount
- [ ] Sample inference logged with template IDs

## 7. Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| IT / BTP | | | ⏳ |
| Security | | | ⏳ |
| Legal (if required) | | | ⏳ |
| Architecture | | | ⏳ |
