/**
 * Controlled threshold change (AD-4 / P5.2.3) — PATCH config + local change log.
 *
 * Usage:
 *   node p5/scripts/adjust-threshold.js 0.55 "Pilot week 2: reduce noise"
 */
const fs = require("fs");
const path = require("path");

const API = process.env.PRECEDENT_API || "http://127.0.0.1:4001";
const threshold = Number(process.argv[2]);
const reason = process.argv.slice(3).join(" ") || "No reason provided";

async function main() {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    console.error("Usage: node adjust-threshold.js <0..1> <reason>");
    process.exit(1);
  }

  const beforeRes = await fetch(`${API}/config/precedent`);
  const before = await beforeRes.json();
  const prev = before.confidenceThreshold;

  const res = await fetch(`${API}/config/precedent`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": process.env.PILOT_ACTOR || "pilot-admin",
    },
    body: JSON.stringify({ confidenceThreshold: threshold }),
  });
  const after = await res.json();
  if (!res.ok) {
    console.error("PATCH failed", after);
    process.exit(1);
  }

  const logPath = path.join(__dirname, "../reports/threshold-changelog.md");
  const entry = `\n## ${new Date().toISOString()}\n\n- Previous: **${prev}**\n- New: **${threshold}**\n- Reason: ${reason}\n- Actor: ${process.env.PILOT_ACTOR || "pilot-admin"}\n`;
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "# Threshold change log (P5)\n\nAll changes must include a reason.\n");
  }
  fs.appendFileSync(logPath, entry);
  console.log(`Threshold ${prev} → ${threshold}`);
  console.log("Logged to", logPath);
  console.log("Recompute open incidents if needed: POST /precedents/{id}/recompute");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
