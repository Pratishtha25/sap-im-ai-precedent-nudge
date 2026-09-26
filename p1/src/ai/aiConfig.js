/**
 * P2 AI / feature configuration defaults.
 * GenAI Hub credentials via env — never hardcode secrets.
 */
const AI_DEFAULTS = {
  /** Master flag — disables panel + skips AI write-path when false */
  featureEnabled: true,
  /** When false, matching still runs but categorize/summarize use templates only */
  aiComputeEnabled: true,
  /** local | genai-hub */
  aiProvider: process.env.AI_PROVIDER || "local",
  genAiHub: {
    baseUrl: process.env.GENAI_HUB_BASE_URL || "",
    resourceGroup: process.env.GENAI_HUB_RESOURCE_GROUP || "default",
    deploymentId: process.env.GENAI_HUB_DEPLOYMENT_ID || "",
    /** Bearer / destination token — set via env in BTP */
    authTokenEnv: "GENAI_HUB_AUTH_TOKEN",
    timeoutMs: Number(process.env.GENAI_HUB_TIMEOUT_MS || 8000),
  },
  circuitBreaker: {
    failureThreshold: 3,
    cooldownMs: 30_000,
  },
  retry: {
    maxAttempts: 2,
    backoffMs: 200,
  },
  prompts: {
    categorizeTemplateId: "categorize-v1",
    summarizeTemplateId: "summarize-v1",
  },
  models: {
    categorize: "sap-genai-categorize",
    summarize: "sap-genai-summarize",
    embedding: "bow-v1",
  },
  /** Prefer human category over AI when both present (EC-CAT-03) */
  preferHumanCategory: true,
};

module.exports = { AI_DEFAULTS };
