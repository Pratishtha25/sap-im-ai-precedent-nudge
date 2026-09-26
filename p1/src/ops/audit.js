/**
 * Append-only audit trail for pilot / IT (model versions, matches shown, user actions).
 */
const crypto = require("crypto");

function createAuditEntry({ action, incidentId, userId, details = {} }) {
  return {
    auditId: crypto.randomUUID ? crypto.randomUUID() : `aud-${Date.now()}-${Math.random()}`,
    action,
    incidentId: incidentId ? String(incidentId) : null,
    userId: userId || null,
    details,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createAuditEntry };
