const localProvider = require("./providers/localProvider");
const genAiHubProvider = require("./providers/genAiHubProvider");
const { CircuitBreaker, withRetry } = require("./circuitBreaker");
const { AI_DEFAULTS } = require("./aiConfig");
const { canAttemptSummary, isSummaryGrounded } = require("./grounding");
const { buildTemplateSummary } = require("../matching/matchEngine");

const breaker = new CircuitBreaker(AI_DEFAULTS.circuitBreaker);

function mergeAiConfig(storeConfig = {}) {
  return {
    ...AI_DEFAULTS,
    ...storeConfig,
    genAiHub: { ...AI_DEFAULTS.genAiHub, ...(storeConfig.genAiHub || {}) },
    circuitBreaker: { ...AI_DEFAULTS.circuitBreaker, ...(storeConfig.circuitBreaker || {}) },
    retry: { ...AI_DEFAULTS.retry, ...(storeConfig.retry || {}) },
    prompts: { ...AI_DEFAULTS.prompts, ...(storeConfig.prompts || {}) },
    models: { ...AI_DEFAULTS.models, ...(storeConfig.models || {}) },
  };
}

function getProvider(name) {
  if (name === "genai-hub") return genAiHubProvider;
  return localProvider;
}

/**
 * Safe AI completion with circuit breaker + retry. Never throws to callers — returns { ok, ... }.
 */
async function safeComplete(purpose, variables, config) {
  const cfg = mergeAiConfig(config);
  if (!cfg.aiComputeEnabled || !cfg.featureEnabled) {
    return { ok: false, skipped: true, reason: "ai_disabled" };
  }
  if (!breaker.canRequest()) {
    return { ok: false, skipped: true, reason: "circuit_open", circuit: breaker.snapshot() };
  }

  const provider = getProvider(cfg.aiProvider);
  try {
    const result = await withRetry(
      () => provider.completeJson({ purpose, variables, config: cfg }),
      cfg.retry
    );
    breaker.recordSuccess();
    return { ok: true, ...result };
  } catch (err) {
    breaker.recordFailure();
    return {
      ok: false,
      error: String(err.message || err),
      code: err.code || "AI_ERROR",
      circuit: breaker.snapshot(),
    };
  }
}

/**
 * FR1 — categorize incident. Fail soft: returns null category on error.
 */
async function categorizeIncident(incident, config) {
  const cfg = mergeAiConfig(config);
  const result = await safeComplete(
    "categorize",
    {
      description: incident.description || "",
      locationId: incident.locationId || "",
      equipmentId: incident.equipmentId || "",
      category: incident.category || "",
    },
    cfg
  );

  if (!result.ok) {
    return {
      aiCategory: null,
      error: result.error || result.reason,
      meta: {
        templateId: cfg.prompts.categorizeTemplateId,
        provider: cfg.aiProvider,
        skipped: result.skipped || false,
        circuit: result.circuit,
      },
    };
  }

  const c = result.content || {};
  return {
    aiCategory: {
      incidentType: c.incidentType || null,
      severity: c.severity || null,
      recordabilitySignal: c.recordabilitySignal || null,
      confidence: typeof c.confidence === "number" ? c.confidence : null,
    },
    meta: {
      templateId: result.templateId,
      model: result.model,
      provider: result.provider,
    },
  };
}

/**
 * FR4 — grounded one-line summary. Link-only (null) if missing RCA or ungrounded.
 */
async function summarizeMatch(matchedIncident, config) {
  const cfg = mergeAiConfig(config);
  const gate = canAttemptSummary(matchedIncident);
  if (!gate.ok) {
    return {
      summaryText: null,
      linkOnly: true,
      reason: gate.reason,
      meta: { templateId: cfg.prompts.summarizeTemplateId },
    };
  }

  const result = await safeComplete(
    "summarize",
    {
      majorRootCause: matchedIncident.majorRootCause || "",
      correctiveAction: matchedIncident.correctiveAction || "",
    },
    cfg
  );

  if (!result.ok) {
    // Fail soft → template fallback (still grounded), not invent
    const fallback = buildTemplateSummary(matchedIncident);
    return {
      summaryText: fallback,
      linkOnly: !fallback,
      reason: result.skipped ? result.reason : "ai_error_template_fallback",
      meta: {
        templateId: cfg.prompts.summarizeTemplateId,
        error: result.error,
        circuit: result.circuit,
        summaryMode: fallback ? "template-v1" : "link-only",
      },
    };
  }

  let summaryText = result.content?.summaryText ?? null;
  const claimedGrounded = result.content?.grounded !== false;

  if (
    !summaryText ||
    !claimedGrounded ||
    !isSummaryGrounded(
      summaryText,
      matchedIncident.majorRootCause,
      matchedIncident.correctiveAction
    )
  ) {
    const fallback = buildTemplateSummary(matchedIncident);
    return {
      summaryText: fallback,
      linkOnly: !fallback,
      reason: "ungrounded_or_empty",
      meta: {
        templateId: result.templateId,
        model: result.model,
        provider: result.provider,
        summaryMode: fallback ? "template-v1" : "link-only",
      },
    };
  }

  return {
    summaryText,
    linkOnly: false,
    reason: "ok",
    meta: {
      templateId: result.templateId,
      model: result.model,
      provider: result.provider,
      summaryMode: "llm-grounded",
    },
  };
}

function getCircuitSnapshot() {
  return breaker.snapshot();
}

function resetCircuitForTests() {
  breaker.failures = 0;
  breaker.state = "CLOSED";
  breaker.openedAt = null;
}

module.exports = {
  mergeAiConfig,
  categorizeIncident,
  summarizeMatch,
  safeComplete,
  getCircuitSnapshot,
  resetCircuitForTests,
  breaker,
};
