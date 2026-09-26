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
const { loadCohort } = require("../src/pilot/cohortGate");
const { OpsMetrics } = require("../src/ops/metrics");

function request(server, method, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

describe("P5 pilot_only API gate", () => {
  let server;
  let store;

  before(async () => {
    const tmp = path.join(os.tmpdir(), `p5-${Date.now()}.json`);
    store = new FileStore(tmp);
    store.data = emptyState({
      ...DEFAULT_CONFIG,
      aiProvider: "local",
      pilotMode: "pilot_only",
    });
    const samples = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/sample-incidents.json"), "utf8")
    );
    for (const row of samples) store.upsertIncident(row);
    backfillEmbeddings(store);
    await computePrecedentForIncident(store, "388");
    await computePrecedentForIncident(store, "391");

    const cohort = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../p5/config/pilot-cohort.json"), "utf8")
    );
    const pilotContext = loadCohort(cohort);
    const queue = new ComputeQueue(async (id) => computePrecedentForIncident(store, id));
    server = http.createServer(createHandler(store, queue, new OpsMetrics(), pilotContext));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it("serves READY for cohort location incident 388", async () => {
    const res = await request(server, "GET", "/precedents/388", { "X-User-Id": "outsider" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "READY");
    assert.equal(res.body.pilotGated, undefined);
  });

  it("gates non-cohort location for outsider (391 Plant C)", async () => {
    const res = await request(server, "GET", "/precedents/391", { "X-User-Id": "outsider" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "UNAVAILABLE");
    assert.equal(res.body.pilotGated, true);
  });

  it("allows cohort user even on non-pilot location", async () => {
    const res = await request(server, "GET", "/precedents/391", { "X-User-Id": "demo-manager" });
    assert.equal(res.status, 200);
    // 391 may be READY State C or UNAVAILABLE from match — but not pilot-gated
    assert.notEqual(res.body.pilotGated, true);
  });

  it("GET /pilot/status", async () => {
    const res = await request(server, "GET", "/pilot/status");
    assert.equal(res.status, 200);
    assert.equal(res.body.pilotMode, "pilot_only");
    assert.equal(res.body.cohortLoaded, true);
  });
});
