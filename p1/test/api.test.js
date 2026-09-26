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

function request(server, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("HTTP API", () => {
  let server;
  let store;

  before(async () => {
    const tmp = path.join(os.tmpdir(), `precedent-api-${Date.now()}.json`);
    store = new FileStore(tmp);
    store.data = emptyState({ ...DEFAULT_CONFIG, confidenceThreshold: 0.35 });
    const samples = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/sample-incidents.json"), "utf8")
    );
    for (const row of samples) store.upsertIncident(row);
    backfillEmbeddings(store);
    await computePrecedentForIncident(store, "388");
    await computePrecedentForIncident(store, "391");

    const queue = new ComputeQueue(async (id) => computePrecedentForIncident(store, id));
    server = http.createServer(createHandler(store, queue));
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it("GET /precedents/388 returns READY State A with 200", async () => {
    const res = await request(server, "GET", "/precedents/388");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "READY");
    assert.equal(res.body.states.precedent.show, true);
  });

  it("GET unknown id returns 200 UNAVAILABLE (fail open)", async () => {
    const res = await request(server, "GET", "/precedents/missing-id");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "UNAVAILABLE");
    assert.equal(res.body.states.precedent.show, false);
  });

  it("GET /config/precedent returns threshold", async () => {
    const res = await request(server, "GET", "/config/precedent");
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.confidenceThreshold === "number");
  });

  it("POST recompute returns payload", async () => {
    const res = await request(server, "POST", "/precedents/388/recompute");
    assert.equal(res.status, 200);
    assert.equal(res.body.incidentId, "388");
  });

  it("POST /incidents enqueues compute on significant change", async () => {
    const res = await request(server, "POST", "/incidents", {
      ID: "388",
      description:
        "Operator cut hand on conveyor line after guard rail was removed for maintenance and not replaced — updated detail",
      locationId: "PLANT-A-LINE-3",
      equipmentId: "CONV-01",
      category: "CaughtIn",
      status: "OPEN",
    });
    assert.equal(res.status, 202);
    assert.equal(res.body.computeEnqueued, true);
  });
});
