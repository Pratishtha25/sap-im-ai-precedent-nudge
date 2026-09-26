/**
 * False/duplicate candidate detection prep (FR7) — full AI assist in P2.
 * Uses closure codes + description similarity.
 */

const { cosineSimilarity } = require("./embedder");

const DEFAULT_FALSE_DUP_CODES = new Set(["NOT_VALID", "DUPLICATE", "INVALID", "FALSE"]);

/**
 * @param {object[]} closedIncidents
 * @param {object} current
 * @param {Record<string, object>} embeddingById map incidentId -> { embedding }
 * @param {object} currentEmbedding sparse vec
 * @param {number} threshold
 * @param {Set<string>} [codes]
 */
function detectFalseDuplicates(
  closedIncidents,
  current,
  embeddingById,
  currentEmbedding,
  threshold,
  codes = DEFAULT_FALSE_DUP_CODES
) {
  if (!current.locationId) {
    return { count: 0, ids: [] };
  }

  const ids = [];
  for (const c of closedIncidents) {
    if (String(c.ID) === String(current.ID)) continue;
    if (c.locationId !== current.locationId) continue;
    const reason = String(c.closureReason || "").toUpperCase();
    if (!codes.has(reason)) continue;

    const emb = embeddingById[c.ID]?.embedding;
    const sim = emb ? cosineSimilarity(currentEmbedding, emb) : 0;
    if (sim >= threshold) ids.push(c.ID);
  }

  return { count: ids.length, ids };
}

module.exports = {
  detectFalseDuplicates,
  DEFAULT_FALSE_DUP_CODES,
};
