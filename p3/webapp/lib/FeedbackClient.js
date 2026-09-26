/**
 * Client helpers for FR9 feedback + analytics events (P4).
 */
async function postJson(baseUrl, path, body, { userId, fetchImpl } = {}) {
  const fetchFn = fetchImpl || globalThis.fetch;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (userId) headers["X-User-Id"] = userId;

  try {
    const res = await fetchFn(`${String(baseUrl).replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => ({}));
    // Soft: never throw to UI
    return { ok: res.ok || res.status === 202, status: res.status, payload };
  } catch (err) {
    return { ok: false, soft: true, error: String(err.message || err) };
  }
}

function submitNotRelevant(baseUrl, incidentId, { matchedIncidentId, surface, userId, fetchImpl }) {
  return postJson(
    baseUrl,
    `/precedents/${encodeURIComponent(incidentId)}/feedback`,
    {
      verdict: "NOT_RELEVANT",
      matchedIncidentId,
      surface,
    },
    { userId, fetchImpl }
  );
}

function submitFalseDupRating(baseUrl, incidentId, helpful, { surface, userId, fetchImpl }) {
  return postJson(
    baseUrl,
    `/precedents/${encodeURIComponent(incidentId)}/feedback`,
    {
      verdict: helpful ? "HELPFUL" : "NOT_HELPFUL",
      surface,
    },
    { userId, fetchImpl }
  );
}

function trackEvent(baseUrl, event, { userId, fetchImpl } = {}) {
  return postJson(baseUrl, "/events", event, { userId, fetchImpl });
}

module.exports = {
  postJson,
  submitNotRelevant,
  submitFalseDupRating,
  trackEvent,
};
