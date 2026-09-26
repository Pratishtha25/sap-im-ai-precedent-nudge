/**
 * AuthZ stub — precedent read requires same class of access as incident/task read.
 * Landscape: replace with IAS / XSUAA + IM authorization checks.
 *
 * Modes:
 * - AUTH_DISABLED=true (default for local demo): allow, stamp user from header or "anonymous"
 * - AUTH_DISABLED=false: require X-User-Id; optional PRECEDENT_AUTH_TOKEN via X-Auth-Token
 */

function extractUser(req) {
  const userId =
    req.headers["x-user-id"] ||
    req.headers["x-sap-user"] ||
    null;
  return userId ? String(userId) : null;
}

function authorizeRequest(req, { requireUser = false } = {}) {
  const authDisabled = String(process.env.AUTH_DISABLED || "true").toLowerCase() !== "false";
  const userId = extractUser(req) || (authDisabled ? "anonymous" : null);
  const expectedToken = process.env.PRECEDENT_AUTH_TOKEN;

  if (!authDisabled && expectedToken) {
    const token = req.headers["x-auth-token"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
    if (token !== expectedToken) {
      return { ok: false, status: 401, error: "unauthorized", userId: null };
    }
  }

  if (requireUser && !userId) {
    return { ok: false, status: 401, error: "user_required", userId: null };
  }

  if (!authDisabled && !userId) {
    return { ok: false, status: 401, error: "user_required", userId: null };
  }

  return { ok: true, userId, authDisabled };
}

/**
 * Incident-level read check — MVP: incident must exist OR status UNAVAILABLE still allowed
 * so UI can fail open. Denied only when auth fails.
 */
function authorizeIncidentRead(store, incidentId, auth) {
  if (!auth.ok) return auth;
  // Placeholder for plant/role scoping — log intent for security review
  return {
    ...auth,
    incidentExists: Boolean(store.getIncident(incidentId)),
  };
}

module.exports = {
  extractUser,
  authorizeRequest,
  authorizeIncidentRead,
};
