/**
 * Local governed AI provider — deterministic, no network egress.
 * Used for tests/dev; mirrors GenAI Hub contract so swap is config-only.
 */

const { tokenize } = require("../../matching/embedder");
const { CATEGORIZE_V1, SUMMARIZE_V1, renderTemplate } = require("../prompts");

function inferSeverity(tokens) {
  if (tokens.some((t) => ["fatal", "death", "amputat", "critical"].some((k) => t.includes(k)))) {
    return "Critical";
  }
  if (tokens.some((t) => ["injur", "hospital", "fractur", "burn"].some((k) => t.includes(k)))) {
    return "High";
  }
  if (tokens.some((t) => ["near", "miss", "almost"].includes(t))) return "Medium";
  return "Medium";
}

function inferType(tokens, category) {
  if (category && category !== "(none)") return String(category);
  if (tokens.some((t) => ["slip", "fall", "trip"].includes(t))) return "SlipFall";
  if (tokens.some((t) => ["chemical", "exposur", "fume", "odor", "smell"].some((k) => t.includes(k)))) {
    return "Exposure";
  }
  if (tokens.some((t) => ["forklift", "struck", "vehicle"].includes(t))) return "StruckBy";
  if (tokens.some((t) => ["conveyor", "guard", "caught", "machine"].includes(t))) return "CaughtIn";
  return "Other";
}

function inferRecordability(severity) {
  if (severity === "Critical" || severity === "High") return "LikelyRecordable";
  if (severity === "Low") return "LikelyNonRecordable";
  return "Unclear";
}

async function completeJson({ purpose, variables }) {
  if (purpose === "categorize") {
    const description = variables.description || "";
    const tokens = tokenize(description);
    const severity = inferSeverity(tokens);
    const incidentType = inferType(tokens, variables.category);
    return {
      content: {
        incidentType,
        severity,
        recordabilitySignal: inferRecordability(severity),
        confidence: tokens.length >= 5 ? 0.82 : 0.55,
      },
      model: "local-categorize-v1",
      templateId: CATEGORIZE_V1.templateId,
      provider: "local",
      rawPrompt: renderTemplate(CATEGORIZE_V1.userTemplate, variables),
    };
  }

  if (purpose === "summarize") {
    const rca = String(variables.majorRootCause || "").trim();
    const action = String(variables.correctiveAction || "").trim();
    if (!rca && !action) {
      return {
        content: { summaryText: null, grounded: false },
        model: "local-summarize-v1",
        templateId: SUMMARIZE_V1.templateId,
        provider: "local",
      };
    }
    // CAPA-only → null per link-only rule (caller also enforces)
    if (!rca && action) {
      return {
        content: { summaryText: null, grounded: false },
        model: "local-summarize-v1",
        templateId: SUMMARIZE_V1.templateId,
        provider: "local",
      };
    }
    let summaryText = rca && action
      ? `For reference: root cause noted as ${rca}; action taken: ${action}.`
      : `For reference: root cause noted as ${rca}.`;
    return {
      content: { summaryText, grounded: true },
      model: "local-summarize-v1",
      templateId: SUMMARIZE_V1.templateId,
      provider: "local",
      rawPrompt: renderTemplate(SUMMARIZE_V1.userTemplate, variables),
    };
  }

  throw new Error(`Unknown purpose: ${purpose}`);
}

module.exports = { completeJson, name: "local" };
