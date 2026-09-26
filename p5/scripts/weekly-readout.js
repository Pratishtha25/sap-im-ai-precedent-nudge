/**
 * Weekly pilot readout — pulls success + ops metrics and writes a markdown report.
 *
 * Usage:
 *   node p5/scripts/weekly-readout.js
 *   PRECEDENT_API=http://127.0.0.1:4001 WEEK=1 node p5/scripts/weekly-readout.js
 */
const fs = require("fs");
const path = require("path");

const API = process.env.PRECEDENT_API || "http://127.0.0.1:4001";
const WEEK = process.env.WEEK || String(Math.ceil(new Date().getDate() / 7));
const OUT_DIR = path.join(__dirname, "../reports");

async function getJson(p) {
  const res = await fetch(`${API.replace(/\/$/, "")}${p}`);
  if (!res.ok) throw new Error(`${p} → HTTP ${res.status}`);
  return res.json();
}

function decideHint(success, targets) {
  const ctr = success.clickThroughRate;
  const dismiss = success.dismissRate;
  const issues = [];
  if (ctr != null && ctr < targets.minClickThroughRate) {
    issues.push(`Click-through ${ctr} below target ${targets.minClickThroughRate}`);
  }
  if (dismiss != null && dismiss > targets.maxDismissRate) {
    issues.push(`Dismiss rate ${dismiss} above max ${targets.maxDismissRate}`);
  }
  if (!issues.length) return { leaning: "on_track", issues };
  if (dismiss != null && dismiss > 0.7) return { leaning: "pause_risk", issues };
  return { leaning: "iterate", issues };
}

async function main() {
  const cohort = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../config/pilot-cohort.json"), "utf8")
  );
  const targets = cohort.successTargets;

  let success;
  let ops;
  let pilot;
  try {
    success = await getJson("/metrics/success");
    ops = await getJson("/metrics/ops");
    pilot = await getJson("/pilot/status").catch(() => null);
  } catch (err) {
    console.error("Could not reach API:", err.message);
    console.error("Start p1 service first.");
    process.exit(1);
  }

  const hint = decideHint(success, targets);
  const stamp = new Date().toISOString();
  const file = path.join(OUT_DIR, `week-${WEEK}-readout.md`);

  const md = `# Pilot Weekly Readout — Week ${WEEK}

Generated: ${stamp}  
API: ${API}  
Pilot: ${cohort.pilotId}

## Telemetry (context.md §10)

| Metric | Value | Target |
|--------|-------|--------|
| State A panels shown | ${success.panelShownStateA} | — |
| State B panels shown | ${success.panelShownStateB} | — |
| Deep link clicks | ${success.deepLinkClicked} | — |
| Click-through rate | ${success.clickThroughRate ?? "n/a"} | ≥ ${targets.minClickThroughRate} |
| Dismiss (NOT_RELEVANT) | ${success.dismissNotRelevant} | — |
| Dismiss rate | ${success.dismissRate ?? "n/a"} | ≤ ${targets.maxDismissRate} |
| False-dup useful rate | ${success.falseDupUsefulRate ?? "n/a"} | ≥ ${targets.minFalseDupUsefulRate} |

Time saved / trust qualitative: see survey responses in \`templates/baseline-and-survey-log.md\`.

## Ops health

| Signal | Value |
|--------|-------|
| GET p95 (ms) | ${ops.getLatencyMs?.p95 ?? "n/a"} |
| GET requests | ${ops.counters?.getRequests ?? "n/a"} |
| AI errors | ${ops.counters?.aiErrors ?? "n/a"} |
| Alerts | ${(ops.alerts || []).map((a) => a.code).join(", ") || "none"} |
| Pilot mode | ${pilot?.pilotMode ?? "n/a"} |

## Lean signal (automated)

**${hint.leaning}**
${hint.issues.length ? hint.issues.map((i) => `- ${i}`).join("\n") : "- Within configured targets (telemetry only)"}

> Final go/no-go uses \`scripts/go-no-go.js\` + survey + EHS spot-checks — not this hint alone.

## Actions this week

- [ ] Spot-check 5–10 State A matches (\`templates/match-quality-log.md\`)
- [ ] Review dismiss reasons with EHS
- [ ] Threshold change? (\`scripts/adjust-threshold.js\` — audited)
- [ ] Schedule mid-pilot interviews if week ≥ 2

## Notes

_
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(file, md);
  const jsonOut = path.join(OUT_DIR, `week-${WEEK}-readout.json`);
  fs.writeFileSync(
    jsonOut,
    JSON.stringify({ stamp, week: WEEK, success, ops, pilot, hint, targets }, null, 2)
  );
  console.log(md);
  console.log("Wrote", file);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
