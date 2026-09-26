/**
 * SAP Generative AI Hub HTTP client (write-path only).
 * Requires GENAI_HUB_BASE_URL + GENAI_HUB_AUTH_TOKEN (+ deployment) in landscape.
 * Never used on GET /precedents.
 */

const { CATEGORIZE_V1, SUMMARIZE_V1, renderTemplate } = require("../prompts");

function getPrompt(purpose) {
  if (purpose === "categorize") return CATEGORIZE_V1;
  if (purpose === "summarize") return SUMMARIZE_V1;
  throw new Error(`Unknown purpose: ${purpose}`);
}

async function completeJson({ purpose, variables, config }) {
  const hub = config.genAiHub || {};
  const baseUrl = hub.baseUrl;
  const token = process.env[hub.authTokenEnv || "GENAI_HUB_AUTH_TOKEN"];
  const deploymentId = hub.deploymentId;

  if (!baseUrl || !token || !deploymentId) {
    const err = new Error(
      "GenAI Hub not configured (GENAI_HUB_BASE_URL, token, GENAI_HUB_DEPLOYMENT_ID)"
    );
    err.code = "GENAI_HUB_NOT_CONFIGURED";
    throw err;
  }

  const prompt = getPrompt(purpose);
  const user = renderTemplate(prompt.userTemplate, variables);
  const url = `${baseUrl.replace(/\/$/, "")}/v2/inference/deployments/${deploymentId}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), hub.timeoutMs || 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "AI-Resource-Group": hub.resourceGroup || "default",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: user },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`GenAI Hub HTTP ${res.status}: ${text.slice(0, 200)}`);
      err.code = "GENAI_HUB_HTTP";
      throw err;
    }

    const data = await res.json();
    const contentText =
      data?.choices?.[0]?.message?.content ||
      data?.content ||
      data?.completion ||
      "";
    let content;
    try {
      content = typeof contentText === "string" ? JSON.parse(contentText) : contentText;
    } catch {
      const err = new Error("GenAI Hub returned non-JSON content");
      err.code = "GENAI_HUB_PARSE";
      throw err;
    }

    return {
      content,
      model: data?.model || config.models?.summarize || "genai-hub",
      templateId: prompt.templateId,
      provider: "genai-hub",
      deploymentId,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { completeJson, name: "genai-hub" };
