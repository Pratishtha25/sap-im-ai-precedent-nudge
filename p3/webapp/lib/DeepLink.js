/**
 * FR6 deep link — exact Manage Incidents object (not search).
 */

function buildNavigationIntent(config, matchedIncidentId) {
  if (!config?.semanticObject || !config?.action) {
    throw new Error("Deep link config missing semanticObject/action");
  }
  if (!config.incidentParamName) {
    throw new Error("Deep link config missing incidentParamName");
  }
  if (!matchedIncidentId) {
    throw new Error("matchedIncidentId required");
  }
  if (config.currentIncidentId && String(matchedIncidentId) === String(config.currentIncidentId)) {
    throw new Error("Deep link must not open current incident (self)");
  }

  return {
    target: {
      semanticObject: config.semanticObject,
      action: config.action,
    },
    params: {
      ...(config.extraParams || {}),
      [config.incidentParamName]: String(matchedIncidentId),
    },
  };
}

/**
 * Navigate via FLP; falls back to callback in demo/non-FLP.
 */
async function navigateToIncident(config, matchedIncidentId, opts = {}) {
  const intent = buildNavigationIntent(config, matchedIncidentId);

  if (typeof opts.onNavigate === "function") {
    opts.onNavigate(intent);
    return intent;
  }

  if (typeof sap !== "undefined" && sap.ushell?.Container) {
    const nav = await sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
    nav.toExternal(intent);
    return intent;
  }

  throw new Error("FLP ushell not available — provide onNavigate for demo");
}

module.exports = {
  buildNavigationIntent,
  navigateToIncident,
};
