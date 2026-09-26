const { embedText, isUsableDescription, MODEL_VERSION } = require("../matching/embedder");
const { DEFAULT_FALSE_DUP_CODES } = require("../matching/falseDup");

/**
 * Index closed incidents into embedding store (P1.2).
 */
function backfillEmbeddings(store, { modelVersion = MODEL_VERSION } = {}) {
  const config = store.getConfig();
  const closed = store.listIncidents((i) => String(i.status).toUpperCase() === "CLOSED");
  let indexed = 0;
  let skipped = 0;

  for (const incident of closed) {
    if (!isUsableDescription(incident.description)) {
      skipped += 1;
      continue;
    }
    const reason = String(incident.closureReason || "").toUpperCase();
    const pool = DEFAULT_FALSE_DUP_CODES.has(reason) ? "FALSE_DUP" : "CLOSED";
    store.upsertEmbedding({
      incidentId: incident.ID,
      embedding: embedText(incident.description),
      modelVersion: modelVersion || config.embeddingModelVersion,
      pool,
    });
    indexed += 1;
  }

  return { indexed, skipped, totalClosed: closed.length, modelVersion: modelVersion || config.embeddingModelVersion };
}

module.exports = { backfillEmbeddings };
