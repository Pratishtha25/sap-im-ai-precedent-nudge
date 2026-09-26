/**
 * Incident ID resolution for My Inbox SAP_WFRT work items.
 * Prefer container/custom attribute; title fallback only when allowed.
 */

function normalizeIncidentKey(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function incidentIdFromTaskTitle(title) {
  if (!title || typeof title !== "string") return null;
  const match = title.match(/Incident\s+ID\s+(\d+)\b/i);
  return match ? match[1] : null;
}

/**
 * @param {object} input
 * @param {unknown} [input.containerIncidentId]
 * @param {unknown} [input.customAttributeIncidentId]
 * @param {string} [input.taskTitle]
 * @param {boolean} [input.allowTitleFallback=false]
 */
function resolveIncidentId(input = {}) {
  const fromContainer = normalizeIncidentKey(input.containerIncidentId);
  if (fromContainer) return { incidentId: fromContainer, source: "container" };

  const fromCustom = normalizeIncidentKey(input.customAttributeIncidentId);
  if (fromCustom) return { incidentId: fromCustom, source: "customAttribute" };

  if (input.allowTitleFallback) {
    const fromTitle = incidentIdFromTaskTitle(input.taskTitle || "");
    if (fromTitle) {
      return {
        incidentId: fromTitle,
        source: "titleFallback",
        warning: "Title parsing used — replace with BO container in production",
      };
    }
  }

  return { incidentId: null, source: "unresolved" };
}

module.exports = {
  normalizeIncidentKey,
  incidentIdFromTaskTitle,
  resolveIncidentId,
};
