/**
 * Runtime configuration (AD-4, feature flags, AI / GenAI Hub).
 */
const { AI_DEFAULTS } = require("./ai/aiConfig");

const DEFAULT_CONFIG = {
  featureEnabled: true,
  aiComputeEnabled: true,
  aiProvider: AI_DEFAULTS.aiProvider,
  confidenceThreshold: 0.5,
  falseDupSimilarityThreshold: 0.25,
  stateCMode: "LIGHTWEIGHT_NOTE", // HIDE | LIGHTWEIGHT_NOTE
  filterLooseness: "MODERATE", // STRICT | MODERATE | LOOSE
  embeddingModelVersion: "bow-v1",
  preferHumanCategory: true,
  /** all | pilot_only | off — P5 scoped rollout */
  pilotMode: process.env.PILOT_MODE || "all",
  pilotCohortPath: process.env.PILOT_COHORT_PATH || "",
  deepLink: {
    semanticObject: "Incident",
    action: "display",
    incidentParamName: "IncidentID",
  },
  significantFields: ["description", "locationId", "category", "equipmentId"],
  serverPort: Number(process.env.PORT || 4001),
  genAiHub: { ...AI_DEFAULTS.genAiHub },
  circuitBreaker: { ...AI_DEFAULTS.circuitBreaker },
  retry: { ...AI_DEFAULTS.retry },
  prompts: { ...AI_DEFAULTS.prompts },
  models: { ...AI_DEFAULTS.models },
};

module.exports = { DEFAULT_CONFIG };
