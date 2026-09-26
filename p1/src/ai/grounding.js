/**
 * Grounding validation for FR4 summaries — reject speculative text.
 */

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(text) {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 2);
}

/**
 * Every content word in summary (length>3) that looks factual should appear in source.
 * Allows short connector words. Rejects if too many novel tokens.
 */
function isSummaryGrounded(summaryText, majorRootCause, correctiveAction) {
  if (!summaryText || !String(summaryText).trim()) return false;
  const source = normalize(`${majorRootCause || ""} ${correctiveAction || ""}`);
  if (!source || source === "none") return false;

  const sourceTokens = new Set(significantTokens(source));
  const summaryTokens = significantTokens(summaryText).filter(
    (t) =>
      ![
        "for",
        "reference",
        "root",
        "cause",
        "noted",
        "action",
        "taken",
        "the",
        "and",
        "with",
        "from",
        "that",
        "this",
        "as",
        "was",
        "were",
        "been",
        "have",
        "has",
      ].includes(t)
  );

  if (!summaryTokens.length) return false;

  let novel = 0;
  for (const t of summaryTokens) {
    // allow token if any source token starts with it or vice versa (light stem)
    const ok = [...sourceTokens].some(
      (s) => s === t || s.startsWith(t) || t.startsWith(s)
    );
    if (!ok) novel += 1;
  }

  const novelRatio = novel / summaryTokens.length;
  return novelRatio <= 0.35;
}

/**
 * Apply P0 link-only rules before/after LLM.
 */
function canAttemptSummary(matched) {
  const rca = (matched.majorRootCause || "").trim();
  const action = (matched.correctiveAction || "").trim();
  if (!rca && !action) return { ok: false, reason: "no_rca_capa" };
  if (!rca && action) return { ok: false, reason: "capa_only" }; // link-only
  return { ok: true, reason: "ok" };
}

module.exports = {
  isSummaryGrounded,
  canAttemptSummary,
  normalize,
};
