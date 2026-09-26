const { findPrecedent } = require("../matching/matchEngine");
const { buildStoredResult } = require("../lib/payload");
const { categorizeIncident, summarizeMatch } = require("../ai/orchestrator");

/**
 * P2 write-path: categorize (soft) → match → summarize (grounded) → persist.
 * Async; never throws to block incident create callers (queue catches).
 */
async function computePrecedentForIncident(store, incidentId) {
  const config = store.getConfig();
  const id = String(incidentId);
  const incident = store.getIncident(id);

  if (!incident) {
    store.upsertPrecedentResult({
      incidentId: id,
      status: "UNAVAILABLE",
      panelState: null,
      matchedIncidentId: null,
      matchedIncidentNumber: null,
      matchConfidence: null,
      summaryText: null,
      falseDupCount: 0,
      deepLinkJson: null,
      modelVersionsJson: JSON.stringify({ embedding: config.embeddingModelVersion }),
      computedAt: new Date().toISOString(),
    });
    return store.getPrecedentResult(id);
  }

  if (!config.featureEnabled) {
    store.upsertPrecedentResult({
      incidentId: id,
      status: "UNAVAILABLE",
      panelState: null,
      matchedIncidentId: null,
      matchedIncidentNumber: null,
      matchConfidence: null,
      summaryText: null,
      falseDupCount: 0,
      deepLinkJson: null,
      modelVersionsJson: JSON.stringify({ embedding: config.embeddingModelVersion, featureDisabled: true }),
      computedAt: new Date().toISOString(),
    });
    return store.getPrecedentResult(id);
  }

  store.setPrecedentPending(id);

  try {
    // FR1 — fail soft: never blocks persistence of match result
    const { aiCategory, meta: catMeta, error: catError } = await categorizeIncident(incident, config);
    if (aiCategory) {
      store.upsertIncident({
        ...incident,
        aiCategory,
        aiCategoryMeta: catMeta,
      });
    }
    const current = store.getIncident(id);

    const { match, falseDup } = findPrecedent(store, current, config);

    let summaryMeta = { summaryMode: "none" };
    if (match) {
      const summary = await summarizeMatch(match.incident, config);
      match.summaryText = summary.summaryText;
      summaryMeta = {
        ...summary.meta,
        linkOnly: summary.linkOnly,
        reason: summary.reason,
      };
    }

    const row = buildStoredResult({
      incidentId: id,
      match,
      falseDup,
      config,
      modelVersionsExtra: {
        categorize: catMeta?.model || null,
        categorizeTemplateId: catMeta?.templateId || config.prompts?.categorizeTemplateId,
        summarizeTemplateId: summaryMeta.templateId || config.prompts?.summarizeTemplateId,
        summaryMode: summaryMeta.summaryMode || (match ? "template-v1" : "none"),
        summarizeModel: summaryMeta.model || null,
        categorizeError: catError || null,
        aiProvider: config.aiProvider || "local",
      },
    });
    return store.upsertPrecedentResult(row);
  } catch (err) {
    store.upsertPrecedentResult({
      incidentId: id,
      status: "UNAVAILABLE",
      panelState: null,
      matchedIncidentId: null,
      matchedIncidentNumber: null,
      matchConfidence: null,
      summaryText: null,
      falseDupCount: 0,
      deepLinkJson: null,
      modelVersionsJson: JSON.stringify({
        embedding: config.embeddingModelVersion,
        error: String(err.message || err),
      }),
      computedAt: new Date().toISOString(),
    });
    return store.getPrecedentResult(id);
  }
}

function significantFieldsChanged(prev, next, fields) {
  if (!prev) return true;
  return fields.some((f) => String(prev[f] ?? "") !== String(next[f] ?? ""));
}

module.exports = {
  computePrecedentForIncident,
  significantFieldsChanged,
};
