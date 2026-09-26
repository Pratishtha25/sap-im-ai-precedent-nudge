/**
 * Fiori cross-app navigation helper for FR6 deep link PoC.
 *
 * Usage inside FLP (browser console or UI5 controller):
 *   const { navigateToIncident, buildNavigationIntent } = await import(...) 
 *   // or copy into a controller
 *
 * Fill navigation-config.json from live discovery first.
 */

/**
 * @typedef {object} NavConfig
 * @property {string} semanticObject
 * @property {string} action
 * @property {string} incidentParamName  e.g. "IncidentID"
 * @property {Record<string, string>} [extraParams]
 */

/**
 * @param {NavConfig} config
 * @param {string} matchedIncidentId
 */
function buildNavigationIntent(config, matchedIncidentId) {
  if (!config?.semanticObject || !config?.action) {
    throw new Error("navigation-config missing semanticObject/action — complete P0.3 live discovery");
  }
  if (!config.incidentParamName) {
    throw new Error("navigation-config missing incidentParamName");
  }
  if (!matchedIncidentId) {
    throw new Error("matchedIncidentId required");
  }

  const params = {
    ...(config.extraParams || {}),
    [config.incidentParamName]: String(matchedIncidentId),
  };

  return {
    target: {
      semanticObject: config.semanticObject,
      action: config.action,
    },
    params,
  };
}

/**
 * Navigate via FLP CrossApplicationNavigation (must run inside Launchpad).
 * @param {NavConfig} config
 * @param {string} matchedIncidentId
 * @returns {Promise<void>}
 */
async function navigateToIncident(config, matchedIncidentId) {
  const intent = buildNavigationIntent(config, matchedIncidentId);

  // sap is provided by FLP runtime
  // eslint-disable-next-line no-undef
  if (typeof sap === "undefined" || !sap.ushell?.Container) {
    throw new Error("FLP ushell not available — run this PoC inside Fiori Launchpad");
  }

  // eslint-disable-next-line no-undef
  const nav = await sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
  nav.toExternal(intent);
}

/**
 * Validate that intent would not be a bare search (heuristic for reviewers).
 * Real proof is visual: object page for one ID.
 */
function assertExactObjectIntent(intent) {
  const values = Object.values(intent.params || {});
  if (!values.some((v) => String(v).length > 0)) {
    throw new Error("FR6 fail: no incident key in params — would not open exact object");
  }
  return true;
}

module.exports = {
  buildNavigationIntent,
  navigateToIncident,
  assertExactObjectIntent,
};
