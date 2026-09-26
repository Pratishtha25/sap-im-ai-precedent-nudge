/**
 * Maps GET /precedents payload → UI view model (States A/B/C, fail-open).
 * Shared by My Inbox teaser + Manage Incidents panel. No LLM. No auto-fill actions.
 */

function createEmptyViewModel() {
  return {
    visible: false,
    mode: "hidden", // hidden | teaser | full
    status: null,
    showPrecedent: false,
    showFalseDup: false,
    showNoMatchNote: false,
    matchedIncidentId: null,
    matchedIncidentNumber: null,
    matchConfidence: null,
    summaryText: null,
    deepLink: null,
    falseDupCount: 0,
    aiDisclosure: true,
    pendingHint: false,
    linkOnly: false,
  };
}

/**
 * @param {object|null} payload API body
 * @param {"teaser"|"full"} mode
 * @param {object} [opts]
 * @param {boolean} [opts.showPendingHint=false] AD-7: brief non-blocking hint
 */
function mapPrecedentToViewModel(payload, mode = "full", opts = {}) {
  const vm = createEmptyViewModel();
  vm.mode = mode;

  if (!payload || payload.featureDisabled) {
    return vm; // silent omit
  }

  const status = payload.status;
  vm.status = status;

  if (status === "PENDING") {
    if (opts.showPendingHint) {
      vm.visible = true;
      vm.pendingHint = true;
    }
    return vm; // default AD-7: omit
  }

  if (status !== "READY") {
    return vm; // UNAVAILABLE → silent omit
  }

  const states = payload.states || {};
  const prec = states.precedent || {};
  const fd = states.falseDuplicate || {};
  const nm = states.noMatch || {};

  vm.showPrecedent = Boolean(prec.show);
  vm.showFalseDup = Boolean(fd.show);
  vm.showNoMatchNote = Boolean(nm.showLightweightNote);
  vm.matchedIncidentId = prec.matchedIncidentId || null;
  vm.matchedIncidentNumber = prec.matchedIncidentNumber || null;
  vm.matchConfidence = prec.matchConfidence ?? null;
  vm.summaryText = prec.summaryText || null;
  vm.linkOnly = Boolean(prec.show && !prec.summaryText);
  vm.deepLink = prec.deepLink || null;
  vm.falseDupCount = fd.count || 0;
  vm.aiDisclosure = payload.aiDisclosure ? payload.aiDisclosure.isAuthoritative === false : true;

  vm.visible = vm.showPrecedent || vm.showFalseDup || vm.showNoMatchNote;
  return vm;
}

/** Guardrail: UI must never expose Apply/Copy RCA actions */
const FORBIDDEN_ACTIONS = ["applyRca", "copyRca", "autoFillCategory", "autoFillClosure"];

function assertNoAutoFillActions(actionIds = []) {
  for (const id of actionIds) {
    if (FORBIDDEN_ACTIONS.includes(id)) {
      throw new Error(`Forbidden auto-fill action: ${id}`);
    }
  }
  return true;
}

module.exports = {
  createEmptyViewModel,
  mapPrecedentToViewModel,
  assertNoAutoFillActions,
  FORBIDDEN_ACTIONS,
};
