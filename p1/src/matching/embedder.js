/**
 * Deterministic bag-of-words embedder (P1 stand-in for GenAI Hub / HANA Vector).
 * Same modelVersion => comparable vectors. Swap implementation in P2.
 */

const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "at", "by",
  "is", "was", "were", "be", "been", "with", "from", "as", "that", "this",
  "it", "its", "are", "has", "had", "have",
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * @param {string} text
 * @returns {Record<string, number>} sparse unit vector as map
 */
function embedText(text) {
  const tokens = tokenize(text);
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
  const norm = Math.sqrt(Object.values(counts).reduce((s, v) => s + v * v, 0)) || 1;
  const vec = {};
  for (const [k, v] of Object.entries(counts)) vec[k] = v / norm;
  return vec;
}

function cosineSimilarity(a, b) {
  if (!a || !b) return 0;
  let dot = 0;
  const keys = Object.keys(a).length < Object.keys(b).length ? Object.keys(a) : Object.keys(b);
  const other = keys === Object.keys(a) ? b : a;
  const self = keys === Object.keys(a) ? a : b;
  for (const k of keys) {
    if (other[k]) dot += self[k] * other[k];
  }
  return dot;
}

function isUsableDescription(description) {
  const tokens = tokenize(description);
  if (tokens.length < 3) return false;
  const boilerplate = new Set(["injury", "see", "attachment", "incident", "report", "test"]);
  const meaningful = tokens.filter((t) => !boilerplate.has(t));
  return meaningful.length >= 2;
}

module.exports = {
  tokenize,
  embedText,
  cosineSimilarity,
  isUsableDescription,
  MODEL_VERSION: "bow-v1",
};
