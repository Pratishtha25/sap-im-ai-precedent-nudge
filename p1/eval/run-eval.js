/**
 * Offline evaluation — threshold sweep (P1.5 / AD-4).
 */
const fs = require("fs");
const path = require("path");
const { FileStore, emptyState } = require("../src/store/fileStore");
const { DEFAULT_CONFIG } = require("../src/config");
const { backfillEmbeddings } = require("../src/jobs/backfill");
const { findPrecedent } = require("../src/matching/matchEngine");

const root = path.join(__dirname, "..");
const samples = JSON.parse(fs.readFileSync(path.join(root, "data/sample-incidents.json"), "utf8"));
const pairs = JSON.parse(fs.readFileSync(path.join(root, "data/labeled-pairs.json"), "utf8"));

function buildStore() {
  const store = new FileStore(path.join(root, "data/.eval-store.json"));
  store.data = emptyState(DEFAULT_CONFIG);
  for (const row of samples) store.upsertIncident(row);
  backfillEmbeddings(store);
  return store;
}

function evaluateAtThreshold(store, threshold) {
  const config = { ...store.getConfig(), confidenceThreshold: threshold };
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  let falseDupHits = 0;
  const details = [];

  for (const pair of pairs) {
    const current = store.getIncident(pair.currentId);
    const { match, falseDup } = findPrecedent(store, current, config);
    const predictedId = match?.incident?.ID || null;

    if (pair.expectFalseDupMin) {
      if ((falseDup.count || 0) >= pair.expectFalseDupMin) falseDupHits += 1;
    }

    // For positive_alt_acceptable, treat as soft — skip hard scoring
    if (pair.label === "positive_alt_acceptable") {
      details.push({ pair: pair.label, predictedId, skipped: true });
      continue;
    }

    const expectsMatch = pair.expectedMatchId != null;
    const ok =
      (expectsMatch && predictedId === pair.expectedMatchId) ||
      (!expectsMatch && predictedId == null);

    if (expectsMatch && predictedId === pair.expectedMatchId) tp += 1;
    else if (expectsMatch && !predictedId) fn += 1;
    else if (expectsMatch && predictedId !== pair.expectedMatchId) fp += 1;
    else if (!expectsMatch && predictedId) fp += 1;
    else tn += 1;

    details.push({
      pair: pair.label,
      expectedMatchId: pair.expectedMatchId,
      predictedId,
      confidence: match?.confidence ?? null,
      falseDupCount: falseDup.count,
      ok,
    });
  }

  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  return { threshold, tp, fp, fn, tn, precision, recall, falseDupHits, details };
}

function main() {
  const store = buildStore();
  const thresholds = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6];
  const rows = thresholds.map((t) => evaluateAtThreshold(store, t));

  // Prefer highest F1; break ties with higher threshold (less noise), then precision
  let best = rows[0];
  let bestF1 = -1;
  for (const r of rows) {
    const f1 = r.precision + r.recall === 0 ? 0 : (2 * r.precision * r.recall) / (r.precision + r.recall);
    if (
      f1 > bestF1 ||
      (f1 === bestF1 && r.threshold > best.threshold) ||
      (f1 === bestF1 && r.threshold === best.threshold && r.precision > best.precision)
    ) {
      bestF1 = f1;
      best = r;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    recommendedThreshold: best.threshold,
    f1: bestF1,
    sweep: rows.map(({ details, ...rest }) => rest),
    bestDetails: best.details,
    falsePositiveRiskNotes: [
      "Boilerplate descriptions (e.g. 'Injury') are excluded from indexing via isUsableDescription.",
      "Same-location dissimilar text should stay below threshold — raise threshold if pilot shows noise.",
      "False/dup closures are excluded from State A promotion (EC-FD-10).",
      "Tiny labeled set — re-run after P0 live audit corpus is available; EHS must review before pilot.",
    ],
  };

  const outJson = path.join(__dirname, "eval-report.json");
  const outMd = path.join(__dirname, "eval-report.md");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  const md = `# Offline Eval Report (P1.5)

Generated: ${report.generatedAt}

## Recommended threshold (AD-4)

**${report.recommendedThreshold}** (F1=${report.f1.toFixed(3)} on sample labeled pairs)

Default shipped in \`src/config.js\` should match this value after review.

## Sweep

| Threshold | Precision | Recall | TP | FP | FN | TN | FalseDup hits |
|-----------|-----------|--------|----|----|----|----|---------------|
${rows
  .map(
    (r) =>
      `| ${r.threshold} | ${r.precision.toFixed(2)} | ${r.recall.toFixed(2)} | ${r.tp} | ${r.fp} | ${r.fn} | ${r.tn} | ${r.falseDupHits} |`
  )
  .join("\n")}

## Best-threshold case details

\`\`\`json
${JSON.stringify(report.bestDetails, null, 2)}
\`\`\`

## False-positive risk (for EHS)

${report.falsePositiveRiskNotes.map((n) => `- ${n}`).join("\n")}

## Next

1. Replace \`data/labeled-pairs.json\` with audit-derived pairs (≥20).
2. Re-run \`npm run eval\` and lock AD-4 with EHS sign-off.
3. Update \`confidenceThreshold\` via \`PATCH /config/precedent\`.
`;

  fs.writeFileSync(outMd, md);
  console.log(md);
  console.log(`\nWrote ${outMd}`);
}

main();
