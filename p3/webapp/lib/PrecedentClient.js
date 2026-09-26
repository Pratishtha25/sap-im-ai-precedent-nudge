/**
 * Precedent API client — fail-open fetch for panel hosts.
 */

async function fetchPrecedent(baseUrl, incidentId, { timeoutMs = 2500, fetchImpl } = {}) {
  const fetchFn = fetchImpl || globalThis.fetch;
  if (!incidentId) {
    return { ok: true, payload: { status: "UNAVAILABLE", states: {} } };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const url = `${String(baseUrl).replace(/\/$/, "")}/precedents/${encodeURIComponent(incidentId)}`;
    const res = await fetchFn(url, {
      method: "GET",
      signal: controller?.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      // Fail open — treat as unavailable, never throw to UI shell
      return { ok: false, soft: true, payload: { status: "UNAVAILABLE", states: {} } };
    }
    const payload = await res.json();
    return { ok: true, payload };
  } catch {
    return { ok: false, soft: true, payload: { status: "UNAVAILABLE", states: {} } };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

module.exports = { fetchPrecedent };
