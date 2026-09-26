/**
 * Map stored PrecedentResult → UI API contract (P0 api-key-contract).
 */

function buildDeepLink(config, matchedIncidentId) {
  const dl = config.deepLink || {};
  return {
    semanticObject: dl.semanticObject || "Incident",
    action: dl.action || "display",
    params: {
      [dl.incidentParamName || "IncidentID"]: String(matchedIncidentId),
    },
  };
}

function panelStatesFromResult(row, config) {
  const showA = Boolean(row.matchedIncidentId) && row.status === "READY";
  const showB = (row.falseDupCount || 0) > 0 && row.status === "READY";
  const showC = row.status === "READY" && !showA && !showB;

  const stateCNote = config.stateCMode === "LIGHTWEIGHT_NOTE";

  return {
    precedent: {
      show: showA,
      matchedIncidentId: row.matchedIncidentId || null,
      matchedIncidentNumber: row.matchedIncidentNumber || null,
      matchConfidence: row.matchConfidence,
      summaryText: row.summaryText || null,
      deepLink: showA
        ? row.deepLinkJson
          ? JSON.parse(row.deepLinkJson)
          : buildDeepLink(config, row.matchedIncidentId)
        : null,
    },
    falseDuplicate: {
      show: showB,
      count: row.falseDupCount || 0,
      messageKey: showB ? "PRECEDENT_FALSE_DUP_WARNING" : null,
    },
    noMatch: {
      show: showC && !stateCNote ? false : false,
      showLightweightNote: showC && stateCNote,
    },
  };
}

function toApiPayload(row, config) {
  if (!row) {
    return {
      incidentId: null,
      status: "UNAVAILABLE",
      states: {
        precedent: { show: false },
        falseDuplicate: { show: false, count: 0 },
        noMatch: { show: false, showLightweightNote: false },
      },
      aiDisclosure: {
        labelKey: "AI_GENERATED_ADVISORY",
        isAuthoritative: false,
      },
      computedAt: null,
      modelVersions: {},
    };
  }

  if (!config.featureEnabled) {
    return {
      incidentId: row.incidentId,
      status: "UNAVAILABLE",
      states: {
        precedent: { show: false },
        falseDuplicate: { show: false, count: 0 },
        noMatch: { show: false, showLightweightNote: false },
      },
      aiDisclosure: {
        labelKey: "AI_GENERATED_ADVISORY",
        isAuthoritative: false,
      },
      computedAt: row.computedAt,
      modelVersions: {},
      featureDisabled: true,
    };
  }

  let modelVersions = {};
  try {
    modelVersions = row.modelVersionsJson ? JSON.parse(row.modelVersionsJson) : {};
  } catch {
    modelVersions = {};
  }

  return {
    incidentId: row.incidentId,
    status: row.status,
    states: panelStatesFromResult(row, config),
    aiDisclosure: {
      labelKey: "AI_GENERATED_ADVISORY",
      isAuthoritative: false,
    },
    computedAt: row.computedAt,
    modelVersions,
  };
}

function buildStoredResult({ incidentId, match, falseDup, config, modelVersionsExtra = {} }) {
  const showA = Boolean(match);
  const showB = (falseDup?.count || 0) > 0;
  let panelState = "C";
  if (showA && showB) panelState = "AB";
  else if (showA) panelState = "A";
  else if (showB) panelState = "B";

  const deepLink = showA ? buildDeepLink(config, match.incident.ID) : null;

  return {
    incidentId: String(incidentId),
    status: "READY",
    panelState,
    matchedIncidentId: showA ? String(match.incident.ID) : null,
    matchedIncidentNumber: showA
      ? match.incident.incidentNumber || String(match.incident.ID)
      : null,
    matchConfidence: showA ? match.confidence : null,
    summaryText: showA ? match.summaryText : null,
    falseDupCount: falseDup?.count || 0,
    deepLinkJson: deepLink ? JSON.stringify(deepLink) : null,
    modelVersionsJson: JSON.stringify({
      embedding: config.embeddingModelVersion,
      summary: modelVersionsExtra.summaryMode || "template-v1",
      ...modelVersionsExtra,
    }),
    computedAt: new Date().toISOString(),
  };
}

module.exports = {
  toApiPayload,
  buildStoredResult,
  buildDeepLink,
  panelStatesFromResult,
};
