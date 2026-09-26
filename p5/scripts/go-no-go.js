/**
 * Go / no-go recommendation from telemetry + optional survey summary JSON.
 *
 * Usage:
 *   node p5/scripts/go-no-go.js
 *   node p5/scripts/go-no-go.js ../reports/survey-summary.json
 */
const fs = require("fs");
const path = require("path");

const API = process.env.PRECEDENT_API || "http://127.0.0.1:4001";

async function main() {
  const cohort = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../config/pilot-cohort.json"), "utf8")
  );
  const targets = cohort.successTargets;

  const success = await (await fetch(`${API}/metrics/success`)).json();
  const ops = await (await fetch(`${API}/metrics/ops`)).json();

  let survey = {
    respondents: 0,
    disruptiveShare: null,
    avgUsefulness: null,
    complianceIssues: false,
    timeSavedReported: null,
  };
  const surveyPath = process.argv[2];
  if (surveyPath && fs.existsSync(surveyPath)) {
    survey = { ...survey, ...JSON.parse(fs.readFileSync(surveyPath, "utf8")) };
  }

  const reasons = [];
  let score = 0;

  if (success.clickThroughRate != null && success.clickThroughRate >= targets.minClickThroughRate) {
    score += 2;
  } else {
    reasons.push("Click-through below target or insufficient data");
  }

  if (success.dismissRate == null || success.dismissRate <= targets.maxDismissRate) {
    score += 2;
  } else {
    reasons.push("Dismiss rate too high");
  }

  if (
    success.falseDupUsefulRate == null ||
    success.falseDupUsefulRate >= targets.minFalseDupUsefulRate
  ) {
    score += 1;
  } else {
    reasons.push("False-dup useful rate below target");
  }

  if (survey.disruptiveShare != null) {
    if (survey.disruptiveShare <= targets.maxDisruptiveShareSurvey) score += 2;
    else reasons.push("Survey: too many find panel disruptive");
  } else {
    reasons.push("Survey disruptive share not provided");
  }

  if (survey.timeSavedReported) score += 1;

  if (targets.requireNoComplianceIssues && survey.complianceIssues) {
    score = 0;
    reasons.push("Compliance issue reported — pause");
  }

  if ((ops.alerts || []).length) {
    reasons.push("Ops alerts present: " + ops.alerts.map((a) => a.code).join(", "));
  }

  let decision = "ITERATE";
  if (survey.complianceIssues) decision = "PAUSE";
  else if (score >= 6 && reasons.filter((r) => r.includes("below") || r.includes("high") || r.includes("disruptive")).length === 0) {
    decision = "GO_BROADER";
  } else if (success.dismissRate != null && success.dismissRate > 0.7) {
    decision = "PAUSE";
  } else if (score >= 4) {
    decision = "ITERATE";
  } else if (score < 2) {
    decision = "PAUSE";
  }

  const report = {
    generatedAt: new Date().toISOString(),
    decision,
    score,
    reasons,
    success,
    survey,
    targets,
    interpretation: {
      GO_BROADER: "Expand beyond pilot cohort; keep monitoring.",
      ITERATE: "Keep pilot; raise threshold / improve filters; re-measure.",
      PAUSE: "Disable feature flag; investigate trust/compliance; do not broaden.",
    }[decision],
  };

  const outDir = path.join(__dirname, "../reports");
  fs.mkdirSync(outDir, { recursive: true });
  const mdPath = path.join(outDir, "go-no-go-recommendation.md");
  const md = `# Go / No-Go Recommendation

Generated: ${report.generatedAt}

## Decision: **${decision}**

Score: ${score}  
${report.interpretation}

### Reasons
${reasons.map((r) => `- ${r}`).join("\n") || "- None"}

### Telemetry snapshot
\`\`\`json
${JSON.stringify(success, null, 2)}
\`\`\`

### Survey snapshot
\`\`\`json
${JSON.stringify(survey, null, 2)}
\`\`\`

Next: update \`reports/pilot-results-report.md\` and \`templates/rollout-plan.md\` or \`templates/tuning-backlog.md\`.
`;
  fs.writeFileSync(mdPath, md);
  fs.writeFileSync(path.join(outDir, "go-no-go-recommendation.json"), JSON.stringify(report, null, 2));
  console.log(md);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
