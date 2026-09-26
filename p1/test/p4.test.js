const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { FileStore, emptyState } = require("../src/store/fileStore");
const { DEFAULT_CONFIG } = require("../src/config");
const { backfillEmbeddings } = require("../src/jobs/backfill");
const { computePrecedentForIncident } = require("../src/jobs/compute");
const { ComputeQueue } = require("../src/jobs/queue");
const { createHandler } = require("../src/api/handler");
const { OpsMetrics } = require("../src/ops/metrics");
const { aggregateSuccessMetrics, normalizeFeedback } = require("../src/ops/feedback");
const { authorizeRequest } = require("../src/ops/auth");

function request(server, method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            body: text ? JSON.parse(text) : null,
          });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("P4 feedback + metrics", () => {
  let server;
  let store;
  let metrics;

  before(async () => {
    const tmp = path.join(os.tmpdir(), `p4-${Date.now()}.json`);
    store = new FileStore(tmp);
    store.data = emptyState({ ...DEFAULT_CONFIG, aiProvider: "local" });
    const samples = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/sample-incidents.json"), "utf8")
    );
    for (const row of samples) store.upsertIncident(row);
    backfillEmbeddings(store);
    await computePrecedentForIncident(store, "388");
    await computePrecedentForIncident(store, "390");

    metrics = new OpsMetrics();
    const queue = new ComputeQueue(async (id) => computePrecedentForIncident(store, id));
    server = http.createServer(createHandler(store, queue, metrics));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it("accepts NOT_RELEVANT feedback (FR9)", async () => {
    const res = await request(
      server,
      "POST",
      "/precedents/388/feedback",
      { verdict: "NOT_RELEVANT", matchedIncidentId: "347", surface: "myinbox" },
      { "X-User-Id": "mgr1" }
    );
    assert.equal(res.status, 202);
    assert.equal(res.body.accepted, true);
    assert.equal(res.body.feedback.tuningUsed, false);
    assert.ok(store.listFeedback().some((f) => f.verdict === "NOT_RELEVANT"));
  });

  it("records panel_shown and deep_link events; success metrics compute", async () => {
    await request(
      server,
      "POST",
      "/events",
      { type: "panel_shown", incidentId: "388", panelState: "A", surface: "myinbox", matchedIncidentId: "347" },
      { "X-User-Id": "mgr1" }
    );
    await request(
      server,
      "POST",
      "/events",
      { type: "deep_link_clicked", incidentId: "388", matchedIncidentId: "347", panelState: "A" },
      { "X-User-Id": "mgr1" }
    );
    const res = await request(server, "GET", "/metrics/success");
    assert.equal(res.status, 200);
    assert.ok(res.body.panelShownStateA >= 1);
    assert.ok(res.body.deepLinkClicked >= 1);
    assert.ok(res.body.clickThroughRate > 0);
    assert.equal(res.body.feedbackLogOnly, true);
  });

  it("GET /precedents tracks ops latency and audit llmCalled false", async () => {
    const res = await request(server, "GET", "/precedents/388", null, { "X-User-Id": "mgr1" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "READY");
    const ops = await request(server, "GET", "/metrics/ops");
    assert.ok(ops.body.counters.getRequests >= 1);
    assert.ok(ops.body.getLatencyMs.p95 != null);
    const audit = store.listAudit(20);
    const read = audit.filter((a) => a.action === "precedent_read").pop();
    assert.equal(read.details.llmCalled, false);
  });

  it("feedback API soft-accepts without blocking on invalid? rejects bad verdict", async () => {
    const res = await request(server, "POST", "/precedents/388/feedback", {
      verdict: "NOPE",
    });
    assert.equal(res.status, 400);
  });

  it("aggregateSuccessMetrics helper", () => {
    const agg = aggregateSuccessMetrics(
      [
        { type: "panel_shown", panelState: "A" },
        { type: "panel_shown", panelState: "A" },
        { type: "deep_link_clicked" },
      ],
      [{ verdict: "NOT_RELEVANT" }]
    );
    assert.equal(agg.clickThroughRate, 0.5);
    assert.equal(agg.dismissRate, 0.5);
  });

  it("auth disabled allows anonymous; enabled requires user", () => {
    const prev = process.env.AUTH_DISABLED;
    process.env.AUTH_DISABLED = "true";
    assert.equal(authorizeRequest({ headers: {} }).ok, true);
    process.env.AUTH_DISABLED = "false";
    assert.equal(authorizeRequest({ headers: {} }).ok, false);
    assert.equal(authorizeRequest({ headers: { "x-user-id": "u1" } }).ok, true);
    process.env.AUTH_DISABLED = prev;
  });

  it("normalizeFeedback sets log-only flag", () => {
    const row = normalizeFeedback(
      { verdict: "not_relevant", matchedIncidentId: "347" },
      "388",
      "u1"
    );
    assert.equal(row.verdict, "NOT_RELEVANT");
    assert.equal(row.tuningUsed, false);
  });
});
