/**
 * Versioned prompt pack — mirrored in p2/prompts for governance review.
 * Deploy these templates to Generative AI Hub in landscape.
 */

const CATEGORIZE_V1 = {
  templateId: "categorize-v1",
  version: "1.0.0",
  purpose: "FR1 — categorize incident from description + structured fields",
  system: `You are an SAP EHS incident categorization assistant operating inside SAP Generative AI Hub.
Return ONLY valid JSON matching the schema. Do not invent facts beyond the provided fields.
Do not write to any system. Advisory classification only — never an OSHA legal determination.`,
  userTemplate: `Categorize this workplace incident.

Description: {{description}}
Location: {{locationId}}
Equipment: {{equipmentId}}
Existing category (human): {{category}}

Respond with JSON:
{
  "incidentType": "string",
  "severity": "Low|Medium|High|Critical",
  "recordabilitySignal": "LikelyRecordable|LikelyNonRecordable|Unclear",
  "confidence": 0.0
}`,
  outputSchema: {
    type: "object",
    required: ["incidentType", "severity", "recordabilitySignal", "confidence"],
    properties: {
      incidentType: { type: "string" },
      severity: { enum: ["Low", "Medium", "High", "Critical"] },
      recordabilitySignal: {
        enum: ["LikelyRecordable", "LikelyNonRecordable", "Unclear"],
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
  },
};

const SUMMARIZE_V1 = {
  templateId: "summarize-v1",
  version: "1.0.0",
  purpose: "FR4 — one-line grounded summary from Major Root Cause + corrective action only",
  system: `You are an SAP EHS investigation summary assistant inside SAP Generative AI Hub.
Produce ONE plain-language advisory sentence for an Incident Manager.
GROUNDING RULES (mandatory):
- Use ONLY the provided Major Root Cause and Corrective Action text.
- Do NOT invent causes, actions, dates, people, or equipment not present in the inputs.
- If inputs are insufficient, return JSON { "summaryText": null, "grounded": false }.
- Tone: advisory reference ("for reference"), never a directive or verified fact.
- No OSHA legal conclusions.`,
  userTemplate: `Create a one-line reference summary for a past similar incident.

Major Root Cause: {{majorRootCause}}
Corrective Action: {{correctiveAction}}

Respond with JSON:
{
  "summaryText": "string or null",
  "grounded": true
}`,
  outputSchema: {
    type: "object",
    required: ["summaryText", "grounded"],
    properties: {
      summaryText: { type: ["string", "null"] },
      grounded: { type: "boolean" },
    },
  },
};

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v === null || v === undefined || v === "" ? "(none)" : String(v);
  });
}

module.exports = {
  CATEGORIZE_V1,
  SUMMARIZE_V1,
  PROMPT_PACK: {
    categorize: CATEGORIZE_V1,
    summarize: SUMMARIZE_V1,
  },
  renderTemplate,
};
