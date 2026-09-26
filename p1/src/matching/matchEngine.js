/**
 * Match search engine — filter → similarity → confidence → single best (FR2/FR3).
 * Summary text is filled by P2 AI orchestrator on the write path (not here for LLM).
 */

const { embedText, cosineSimilarity, isUsableDescription } = require("./embedder");
const { filterCandidates, confidenceBoost } = require("./filter");
const { detectFalseDuplicates } = require("./falseDup");

/**
 * Build one-line template summary (grounded fallback). Link-only if no RCA/CAPA.
 */
function buildTemplateSummary(matched) {
  const rca = (matched.majorRootCause || "").trim();
  const action = (matched.correctiveAction || "").trim();
  if (!rca && !action) return null;
  if (rca && action) return `Root cause: ${rca}. Action taken: ${action}`;
  if (rca) return `Root cause: ${rca}`;
  return null; // CAPA-only → link-only per P0 rule
}

function pickBest(ranked) {
  if (!ranked.length) return null;
  ranked.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const da = a.incident.closedAt || "";
    const db = b.incident.closedAt || "";
    if (db !== da) return db.localeCompare(da);
    return String(a.incident.ID).localeCompare(String(b.incident.ID));
  });
  return ranked[0];
}

/**
 * @param {object} store FileStore
 * @param {object} currentIncident
 * @param {object} [configOverride]
 */
function findPrecedent(store, currentIncident, configOverride) {
  const config = configOverride || store.getConfig();
  const current = currentIncident;

  if (!isUsableDescription(current.description)) {
    return {
      match: null,
      falseDup: { count: 0, ids: [] },
      reason: "unusable_description",
    };
  }

  const currentVec = embedText(current.description);
  const closed = store.listIncidents((i) => String(i.status).toUpperCase() === "CLOSED");

  let candidates = filterCandidates(closed, current, config.filterLooseness, config);
  if (!candidates.length && config.filterLooseness !== "LOOSE") {
    candidates = filterCandidates(closed, current, "LOOSE", config);
  }

  const embeddingById = {};
  for (const e of store.listEmbeddings()) {
    embeddingById[e.incidentId] = e;
  }

  const ranked = [];
  for (const c of candidates) {
    const reason = String(c.closureReason || "").toUpperCase();
    if (reason === "NOT_VALID" || reason === "DUPLICATE" || reason === "INVALID" || reason === "FALSE") {
      continue;
    }

    let emb = embeddingById[c.ID]?.embedding;
    if (!emb) {
      if (!isUsableDescription(c.description)) continue;
      emb = embedText(c.description);
    }
    const sim = cosineSimilarity(currentVec, emb);
    const confidence = Math.min(1, sim + confidenceBoost(c, current, config));
    ranked.push({ incident: c, similarity: sim, confidence });
  }

  const best = pickBest(ranked);
  const threshold = config.confidenceThreshold;
  const match =
    best && best.confidence >= threshold
      ? {
          incident: best.incident,
          confidence: Number(best.confidence.toFixed(4)),
          // placeholder — P2 summarizeMatch overwrites on write path
          summaryText: buildTemplateSummary(best.incident),
        }
      : null;

  const falseDup = detectFalseDuplicates(
    closed,
    current,
    embeddingById,
    currentVec,
    config.falseDupSimilarityThreshold
  );

  return { match, falseDup, rankedCount: ranked.length, bestConfidence: best?.confidence ?? 0 };
}

module.exports = {
  findPrecedent,
  buildTemplateSummary,
  pickBest,
};
