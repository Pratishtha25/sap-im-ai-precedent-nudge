/**
 * FR9 feedback + analytics event helpers.
 */

const crypto = require("crypto");

const FEEDBACK_VERDICTS = new Set([
  "NOT_RELEVANT",
  "HELPFUL",
  "NOT_HELPFUL",
]);

const EVENT_TYPES = new Set([
  "panel_shown",
  "deep_link_clicked",
  "feedback_submitted",
  "false_dup_rated",
]);

function newId(prefix) {
  return crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function normalizeFeedback(body, incidentId, userId) {
  const verdict = String(body.verdict || "").toUpperCase();
  if (!FEEDBACK_VERDICTS.has(verdict)) {
    return { error: "invalid_verdict", allowed: [...FEEDBACK_VERDICTS] };
  }
  return {
    feedbackId: newId("fb"),
    incidentId: String(incidentId),
    matchedIncidentId: body.matchedIncidentId ? String(body.matchedIncidentId) : null,
    verdict,
    userId: userId || body.userId || "anonymous",
    surface: body.surface || "unknown",
    createdAt: new Date().toISOString(),
    tuningUsed: false, // AD-8: log-only in v1
  };
}

function normalizeEvent(body, userId) {
  const type = String(body.type || body.eventType || "");
  if (!EVENT_TYPES.has(type)) {
    return { error: "invalid_event_type", allowed: [...EVENT_TYPES] };
  }
  return {
    eventId: newId("ev"),
    type,
    incidentId: body.incidentId ? String(body.incidentId) : null,
    matchedIncidentId: body.matchedIncidentId ? String(body.matchedIncidentId) : null,
    panelState: body.panelState || null,
    surface: body.surface || "unknown",
    userId: userId || body.userId || "anonymous",
    meta: body.meta || {},
    createdAt: new Date().toISOString(),
  };
}

/**
 * Aggregate success metrics for MVP validation dashboards.
 */
function aggregateSuccessMetrics(events, feedback) {
  const panelShownA = events.filter(
    (e) => e.type === "panel_shown" && (e.panelState === "A" || e.panelState === "AB")
  ).length;
  const panelShownB = events.filter(
    (e) => e.type === "panel_shown" && (e.panelState === "B" || e.panelState === "AB")
  ).length;
  const clicks = events.filter((e) => e.type === "deep_link_clicked").length;
  const dismiss = feedback.filter((f) => f.verdict === "NOT_RELEVANT").length;
  const helpfulB = feedback.filter((f) => f.verdict === "HELPFUL").length;
  const notHelpfulB = feedback.filter((f) => f.verdict === "NOT_HELPFUL").length;

  const clickThroughRate =
    panelShownA === 0 ? null : Number((clicks / panelShownA).toFixed(4));
  const dismissRate =
    panelShownA === 0 ? null : Number((dismiss / panelShownA).toFixed(4));
  const falseDupUsefulRate =
    helpfulB + notHelpfulB === 0
      ? null
      : Number((helpfulB / (helpfulB + notHelpfulB)).toFixed(4));

  return {
    panelShownStateA: panelShownA,
    panelShownStateB: panelShownB,
    deepLinkClicked: clicks,
    dismissNotRelevant: dismiss,
    falseDupHelpful: helpfulB,
    falseDupNotHelpful: notHelpfulB,
    clickThroughRate,
    dismissRate,
    falseDupUsefulRate,
    feedbackLogOnly: true,
    note: "v1 feedback is logged for tuning readiness (AD-8) — not auto-applied to threshold",
  };
}

module.exports = {
  FEEDBACK_VERDICTS,
  EVENT_TYPES,
  normalizeFeedback,
  normalizeEvent,
  aggregateSuccessMetrics,
};
