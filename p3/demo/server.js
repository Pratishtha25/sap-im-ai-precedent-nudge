/**
 * P3 demo server — static UI harness + proxy to Precedent API (P1).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.P3_DEMO_PORT || 4173);
const API_BASE = process.env.PRECEDENT_API || "http://127.0.0.1:4001";
const ROOT = path.join(__dirname);
const WEBAPP = path.join(__dirname, "../webapp");

function loadCjs(filePath) {
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
}

function buildBrowserBundle() {
  const StateMapper = loadCjs(path.join(WEBAPP, "lib/StateMapper.js"));
  const IncidentIdResolver = loadCjs(path.join(WEBAPP, "lib/IncidentIdResolver.js"));
  const TaskAllowList = loadCjs(path.join(WEBAPP, "lib/TaskAllowList.js"));
  const DeepLink = loadCjs(path.join(WEBAPP, "lib/DeepLink.js"));

  return `/* generated from p3/webapp/lib — do not edit */
(function (global) {
  const FORBIDDEN_ACTIONS = ${JSON.stringify(StateMapper.FORBIDDEN_ACTIONS)};
  const DEFAULT_TITLE_PATTERNS = [/Root\\s+Causes\\s+Hierarchy/i, /Review\\s+and\\s+complete\\s+investigation/i, /Review\\s+and\\s+Complete\\s+Incident/i];

  function createEmptyViewModel() {
    return {
      visible: false, mode: "hidden", status: null, showPrecedent: false, showFalseDup: false,
      showNoMatchNote: false, matchedIncidentId: null, matchedIncidentNumber: null,
      matchConfidence: null, summaryText: null, deepLink: null, falseDupCount: 0,
      aiDisclosure: true, pendingHint: false, linkOnly: false
    };
  }

  ${StateMapper.mapPrecedentToViewModel.toString()}

  function assertNoAutoFillActions(actionIds) {
    actionIds = actionIds || [];
    for (const id of actionIds) {
      if (FORBIDDEN_ACTIONS.indexOf(id) !== -1) throw new Error("Forbidden auto-fill action: " + id);
    }
    return true;
  }

  ${IncidentIdResolver.normalizeIncidentKey.toString()}
  ${IncidentIdResolver.incidentIdFromTaskTitle.toString()}
  ${IncidentIdResolver.resolveIncidentId.toString()}

  function isTaskAllowedForPrecedent(taskTitle, allowedStepIds, taskStepId) {
    allowedStepIds = allowedStepIds || [];
    if (taskStepId && allowedStepIds.length > 0) return allowedStepIds.indexOf(taskStepId) !== -1;
    if (!taskTitle || typeof taskTitle !== "string") return false;
    return DEFAULT_TITLE_PATTERNS.some(function (re) { return re.test(taskTitle); });
  }

  ${DeepLink.buildNavigationIntent.toString()}

  global.PrecedentUI = {
    mapPrecedentToViewModel: mapPrecedentToViewModel,
    createEmptyViewModel: createEmptyViewModel,
    assertNoAutoFillActions: assertNoAutoFillActions,
    FORBIDDEN_ACTIONS: FORBIDDEN_ACTIONS,
    resolveIncidentId: resolveIncidentId,
    incidentIdFromTaskTitle: incidentIdFromTaskTitle,
    normalizeIncidentKey: normalizeIncidentKey,
    isTaskAllowedForPrecedent: isTaskAllowedForPrecedent,
    buildNavigationIntent: buildNavigationIntent
  };
})(window);
`;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".properties")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

async function proxyPrecedent(incidentId) {
  const url = `${API_BASE.replace(/\/$/, "")}/precedents/${encodeURIComponent(incidentId)}`;
  const res = await fetch(url);
  const text = await res.text();
  return {
    status: res.status,
    text,
    contentType: res.headers.get("content-type") || "application/json",
  };
}

async function proxyPost(req, res, apiPath) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  try {
    const upstream = await fetch(`${API_BASE.replace(/\/$/, "")}${apiPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": req.headers["x-user-id"] || "demo-manager",
      },
      body: body.length ? body : "{}",
    });
    const text = await upstream.text();
    return send(res, upstream.status, text, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    });
  } catch (err) {
    return send(
      res,
      202,
      JSON.stringify({ accepted: false, soft: true, error: String(err.message || err) }),
      { "Content-Type": "application/json" }
    );
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return send(res, 204, "");

  try {
    if (url.pathname === "/bundle.js") {
      return send(res, 200, buildBrowserBundle(), {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }

    if (url.pathname.startsWith("/api/precedents/") && url.pathname.endsWith("/feedback") && req.method === "POST") {
      return proxyPost(req, res, url.pathname.replace(/^\/api/, ""));
    }
    if (url.pathname === "/api/events" && req.method === "POST") {
      return proxyPost(req, res, "/events");
    }
    if (url.pathname.startsWith("/api/precedents/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/precedents/", "").replace(/\/feedback$/, ""));
      if (url.pathname.endsWith("/feedback")) {
        /* handled above */
      } else {
        try {
          const proxied = await proxyPrecedent(id);
          return send(res, proxied.status, proxied.text, { "Content-Type": proxied.contentType });
        } catch (err) {
          return send(
            res,
            200,
            JSON.stringify({ status: "UNAVAILABLE", states: {}, error: String(err.message || err) }),
            { "Content-Type": "application/json" }
          );
        }
      }
    }

    let filePath;
    if (url.pathname === "/" || url.pathname === "/index.html") {
      filePath = path.join(ROOT, "index.html");
    } else if (url.pathname.startsWith("/css/") || url.pathname.startsWith("/i18n/")) {
      filePath = path.join(WEBAPP, url.pathname);
    } else {
      filePath = path.join(ROOT, url.pathname.replace(/^\//, ""));
    }

    const allowedRoot = filePath.startsWith(ROOT) || filePath.startsWith(WEBAPP);
    if (!allowedRoot) return send(res, 403, "Forbidden");
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return send(res, 404, "Not found");
    }
    return send(res, 200, fs.readFileSync(filePath), { "Content-Type": contentType(filePath) });
  } catch (err) {
    return send(res, 500, String(err.message || err));
  }
});

server.listen(PORT, () => {
  console.log(`P3 UI demo: http://127.0.0.1:${PORT}`);
  console.log(`Proxying precedents → ${API_BASE}`);
  console.log("Start p1 first: cd p1 && npm run seed && npm run backfill && npm run compute && npm start");
});
