/**
 * Incident ID extraction helpers for P0 spike.
 *
 * Production MUST prefer work-item container / Task Gateway attributes.
 * Title parsing is last-resort / diagnostic only (EC-IN-01).
 */

/**
 * Extract a trailing "Incident ID <n>" style business number from My Inbox task titles.
 * @param {string} title
 * @returns {string|null} numeric id as string, or null
 */
function incidentIdFromTaskTitle(title) {
  if (!title || typeof title !== "string") return null;
  const match = title.match(/Incident\s+ID\s+(\d+)\b/i);
  return match ? match[1] : null;
}

/**
 * Normalize possible container values to a string technical key.
 * @param {unknown} raw
 * @returns {string|null}
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

/**
 * Resolve incident id using priority: container → custom attribute → title (flagged).
 * @param {object} input
 * @param {unknown} [input.containerIncidentId]
 * @param {unknown} [input.customAttributeIncidentId]
 * @param {string} [input.taskTitle]
 * @param {boolean} [input.allowTitleFallback=false]
 * @returns {{ incidentId: string|null, source: string, warning?: string }}
 */
function resolveIncidentId(input = {}) {
  const fromContainer = normalizeIncidentKey(input.containerIncidentId);
  if (fromContainer) {
    return { incidentId: fromContainer, source: "container" };
  }

  const fromCustom = normalizeIncidentKey(input.customAttributeIncidentId);
  if (fromCustom) {
    return { incidentId: fromCustom, source: "customAttribute" };
  }

  if (input.allowTitleFallback) {
    const fromTitle = incidentIdFromTaskTitle(input.taskTitle || "");
    if (fromTitle) {
      return {
        incidentId: fromTitle,
        source: "titleFallback",
        warning: "Title parsing used — not valid as sole production binding",
      };
    }
  }

  return { incidentId: null, source: "unresolved" };
}

module.exports = {
  incidentIdFromTaskTitle,
  normalizeIncidentKey,
  resolveIncidentId,
};
