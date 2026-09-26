const { toApiPayload } = require("../lib/payload");
const { computePrecedentForIncident, significantFieldsChanged } = require("../jobs/compute");
const { backfillEmbeddings } = require("../jobs/backfill");
const { getCircuitSnapshot } = require("../ai/orchestrator");
const { PROMPT_PACK } = require("../ai/prompts");
const { authorizeRequest, authorizeIncidentRead } = require("../ops/auth");
const { createAuditEntry } = require("../ops/audit");
const {
  normalizeFeedback,
  normalizeEvent,
  aggregateSuccessMetrics,
} = require("../ops/feedback");
const { globalOpsMetrics } = require("../ops/metrics");
const { isPilotAllowed, applyPilotGate } = require("../pilot/cohortGate");

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function createHandler(store, queue, opsMetrics = globalOpsMetrics, pilotContext = null) {
  return async function handler(req, res) {
    const started = Date.now();
    try {
      const url = new URL(req.url, "http://localhost");
      const { pathname } = url;
      const method = req.method || "GET";

      if (method === "OPTIONS") {
        return sendJson(res, 204, {});
      }

      if (method === "GET" && pathname === "/pilot/status") {
        const cfg = store.getConfig();
        return sendJson(res, 200, {
          pilotMode: cfg.pilotMode || pilotContext?.mode || "all",
          cohortLoaded: Boolean(pilotContext),
          userCount: pilotContext?.userIds?.size || 0,
          locationCount: pilotContext?.locationIds?.size || 0,
          featureEnabled: cfg.featureEnabled,
        });
      }

      // AI status / governance (no secrets)
      if (method === "GET" && pathname === "/ai/status") {
        const cfg = store.getConfig();
        return sendJson(res, 200, {
          aiProvider: cfg.aiProvider,
          aiComputeEnabled: cfg.aiComputeEnabled,
          featureEnabled: cfg.featureEnabled,
          circuitBreaker: getCircuitSnapshot(),
          prompts: cfg.prompts,
          models: cfg.models,
          genAiHubConfigured: Boolean(
            cfg.genAiHub?.baseUrl &&
              process.env[cfg.genAiHub?.authTokenEnv || "GENAI_HUB_AUTH_TOKEN"] &&
              cfg.genAiHub?.deploymentId
          ),
          note: "GET /precedents never calls LLM — write path only",
        });
      }

      if (method === "GET" && pathname === "/ai/prompts") {
        return sendJson(res, 200, {
          categorize: {
            templateId: PROMPT_PACK.categorize.templateId,
            version: PROMPT_PACK.categorize.version,
            purpose: PROMPT_PACK.categorize.purpose,
          },
          summarize: {
            templateId: PROMPT_PACK.summarize.templateId,
            version: PROMPT_PACK.summarize.version,
            purpose: PROMPT_PACK.summarize.purpose,
          },
        });
      }

      if (method === "GET" && pathname === "/health") {
        return sendJson(res, 200, {
          ok: true,
          queueSize: queue.size(),
          featureEnabled: store.getConfig().featureEnabled,
        });
      }

      // Ops metrics
      if (method === "GET" && pathname === "/metrics/ops") {
        return sendJson(res, 200, opsMetrics.snapshot());
      }

      if (method === "GET" && pathname === "/metrics/success") {
        const success = aggregateSuccessMetrics(store.listEvents(), store.listFeedback());
        return sendJson(res, 200, success);
      }

      if (method === "GET" && pathname === "/audit") {
        const auth = authorizeRequest(req);
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        const limit = Number(url.searchParams.get("limit") || 100);
        return sendJson(res, 200, { items: store.listAudit(limit) });
      }

      // Config
      if (method === "GET" && pathname === "/config/precedent") {
        return sendJson(res, 200, store.getConfig());
      }
      if (method === "PATCH" && pathname === "/config/precedent") {
        const auth = authorizeRequest(req, { requireUser: true });
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        const body = await readBody(req);
        const cfg = store.updateConfig(body);
        store.addAudit(
          createAuditEntry({
            action: "config_updated",
            userId: auth.userId,
            details: { keys: Object.keys(body) },
          })
        );
        return sendJson(res, 200, cfg);
      }

      // Analytics events
      if (method === "POST" && pathname === "/events") {
        const auth = authorizeRequest(req);
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        const body = await readBody(req);
        const event = normalizeEvent(body, auth.userId);
        if (event.error) return sendJson(res, 400, event);
        store.addEvent(event);
        opsMetrics.counters.eventsRecorded += 1;
        store.addAudit(
          createAuditEntry({
            action: "event_" + event.type,
            incidentId: event.incidentId,
            userId: auth.userId,
            details: {
              matchedIncidentId: event.matchedIncidentId,
              panelState: event.panelState,
              surface: event.surface,
            },
          })
        );
        return sendJson(res, 202, { accepted: true, event });
      }

      if (method === "GET" && pathname === "/events") {
        const auth = authorizeRequest(req);
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        return sendJson(res, 200, { items: store.listEvents() });
      }

      // GET /precedents/:id — fail open, LLM-free, latency tracked
      const getMatch = pathname.match(/^\/precedents\/([^/]+)$/);
      if (method === "GET" && getMatch) {
        const incidentId = decodeURIComponent(getMatch[1]);
        const auth = authorizeIncidentRead(store, incidentId, authorizeRequest(req));
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

        const config = store.getConfig();
        const row = store.getPrecedentResult(incidentId);
        let payload = toApiPayload(row, config);
        if (!row) {
          payload.incidentId = incidentId;
          payload.status = "UNAVAILABLE";
        }

        // P5 pilot scoping
        const mode = config.pilotMode || pilotContext?.mode || "all";
        if (mode === "pilot_only" || mode === "off") {
          const incident = store.getIncident(incidentId);
          const gate = isPilotAllowed(
            {
              mode,
              userIds: pilotContext?.userIds || new Set(),
              locationIds: pilotContext?.locationIds || new Set(),
            },
            { userId: auth.userId, locationId: incident?.locationId }
          );
          payload = applyPilotGate(payload, gate.allowed);
          if (!gate.allowed) {
            store.addAudit(
              createAuditEntry({
                action: "pilot_gated",
                incidentId,
                userId: auth.userId,
                details: { reason: gate.reason, mode },
              })
            );
          }
        }

        const latency = Date.now() - started;
        opsMetrics.recordGet(latency, payload.status);

        // Optional auto panel_shown when client passes ?track=1
        if (url.searchParams.get("track") === "1" && payload.status === "READY") {
          const panelState = row?.panelState || null;
          if (panelState && panelState !== "C") {
            const ev = normalizeEvent(
              {
                type: "panel_shown",
                incidentId,
                matchedIncidentId: row.matchedIncidentId,
                panelState,
                surface: url.searchParams.get("surface") || "api",
              },
              auth.userId
            );
            if (!ev.error) {
              store.addEvent(ev);
              opsMetrics.counters.eventsRecorded += 1;
            }
          }
        }

        store.addAudit(
          createAuditEntry({
            action: "precedent_read",
            incidentId,
            userId: auth.userId,
            details: {
              status: payload.status,
              matchedIncidentId: payload.states?.precedent?.matchedIncidentId || null,
              latencyMs: latency,
              llmCalled: false,
            },
          })
        );

        return sendJson(res, 200, payload);
      }

      // POST /precedents/:id/feedback (FR9)
      const feedbackMatch = pathname.match(/^\/precedents\/([^/]+)\/feedback$/);
      if (method === "POST" && feedbackMatch) {
        const incidentId = decodeURIComponent(feedbackMatch[1]);
        const auth = authorizeRequest(req, { requireUser: false });
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        const body = await readBody(req);
        const row = normalizeFeedback(body, incidentId, auth.userId);
        if (row.error) return sendJson(res, 400, row);

        // Soft-fail: never block UI — always accept when valid
        store.addFeedback(row);
        opsMetrics.counters.feedbackAccepted += 1;

        const ev = normalizeEvent(
          {
            type: "feedback_submitted",
            incidentId,
            matchedIncidentId: row.matchedIncidentId,
            panelState: null,
            surface: row.surface,
            meta: { verdict: row.verdict },
          },
          auth.userId
        );
        if (!ev.error) {
          store.addEvent(ev);
          opsMetrics.counters.eventsRecorded += 1;
        }

        // Also map HELPFUL/NOT_HELPFUL on false-dup as false_dup_rated
        if (row.verdict === "HELPFUL" || row.verdict === "NOT_HELPFUL") {
          const fd = normalizeEvent(
            {
              type: "false_dup_rated",
              incidentId,
              matchedIncidentId: row.matchedIncidentId,
              surface: row.surface,
              meta: { verdict: row.verdict },
            },
            auth.userId
          );
          if (!fd.error) store.addEvent(fd);
        }

        store.addAudit(
          createAuditEntry({
            action: "feedback",
            incidentId,
            userId: auth.userId,
            details: { verdict: row.verdict, matchedIncidentId: row.matchedIncidentId, logOnly: true },
          })
        );

        return sendJson(res, 202, {
          accepted: true,
          feedback: row,
          note: "Logged for future tuning (AD-8) — not applied to match model in v1",
        });
      }

      if (method === "GET" && pathname === "/feedback") {
        const auth = authorizeRequest(req);
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        return sendJson(res, 200, { items: store.listFeedback() });
      }

      // POST /precedents/:id/recompute
      const recomputeMatch = pathname.match(/^\/precedents\/([^/]+)\/recompute$/);
      if (method === "POST" && recomputeMatch) {
        const incidentId = decodeURIComponent(recomputeMatch[1]);
        const auth = authorizeRequest(req);
        if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
        try {
          const row = await queue.enqueue(incidentId);
          opsMetrics.recordCompute(true);
          store.addAudit(
            createAuditEntry({
              action: "recompute",
              incidentId,
              userId: auth.userId,
              details: { status: row?.status },
            })
          );
          return sendJson(
            res,
            200,
            toApiPayload(row || store.getPrecedentResult(incidentId), store.getConfig())
          );
        } catch (err) {
          opsMetrics.recordCompute(false);
          throw err;
        }
      }

      if (method === "POST" && pathname === "/jobs/backfill") {
        const result = backfillEmbeddings(store);
        return sendJson(res, 200, result);
      }

      if (method === "GET" && pathname === "/incidents") {
        return sendJson(res, 200, { items: store.listIncidents() });
      }

      if (method === "POST" && pathname === "/incidents") {
        const body = await readBody(req);
        if (!body.ID && !body.id) {
          return sendJson(res, 400, { error: "ID required" });
        }
        const id = String(body.ID || body.id);
        const prev = store.getIncident(id);
        const incident = store.upsertIncident({ ...body, ID: id });
        const config = store.getConfig();
        const changed = significantFieldsChanged(prev, incident, config.significantFields);
        if (changed) {
          store.setPrecedentPending(id);
          queue.enqueue(id);
        }
        return sendJson(res, 202, { incident, computeEnqueued: changed });
      }

      sendJson(res, 404, { error: "not_found" });
    } catch (err) {
      sendJson(res, 500, { error: "internal_error", message: String(err.message || err) });
    }
  };
}

module.exports = { createHandler, sendJson, readBody };
