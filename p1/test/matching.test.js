const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  embedText,
  cosineSimilarity,
  isUsableDescription,
} = require("../src/matching/embedder");
const { filterCandidates } = require("../src/matching/filter");
const { findPrecedent, buildTemplateSummary } = require("../src/matching/matchEngine");
const { FileStore, emptyState } = require("../src/store/fileStore");
const { DEFAULT_CONFIG } = require("../src/config");
const { backfillEmbeddings } = require("../src/jobs/backfill");
const { computePrecedentForIncident } = require("../src/jobs/compute");
const { toApiPayload } = require("../src/lib/payload");
const fs = require("fs");
const path = require("path");
const os = require("os");

function loadSampleStore() {
  const tmp = path.join(os.tmpdir(), `precedent-test-${Date.now()}.json`);
  const store = new FileStore(tmp);
  store.data = emptyState({ ...DEFAULT_CONFIG, confidenceThreshold: 0.35 });
  const samples = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/sample-incidents.json"), "utf8")
  );
  for (const row of samples) store.upsertIncident(row);
  backfillEmbeddings(store);
  return store;
}

describe("embedder", () => {
  it("rejects boilerplate descriptions", () => {
    assert.equal(isUsableDescription("Injury"), false);
    assert.equal(isUsableDescription("see attachment"), false);
  });

  it("scores similar conveyor texts higher than unrelated", () => {
    const a = embedText("missing guard rail on conveyor belt production line");
    const b = embedText("conveyor guard rail removed operator injured");
    const c = embedText("slipped on wet cafeteria floor");
    assert.ok(cosineSimilarity(a, b) > cosineSimilarity(a, c));
  });
});

describe("filter", () => {
  it("excludes self and open incidents", () => {
    const current = { ID: "388", locationId: "PLANT-A-LINE-3", category: "CaughtIn" };
    const closed = [
      { ID: "388", status: "CLOSED", locationId: "PLANT-A-LINE-3" },
      { ID: "347", status: "CLOSED", locationId: "PLANT-A-LINE-3" },
      { ID: "1", status: "OPEN", locationId: "PLANT-A-LINE-3" },
    ];
    const out = filterCandidates(closed, current, "MODERATE");
    assert.deepEqual(out.map((x) => x.ID), ["347"]);
  });
});

describe("matchEngine", () => {
  it("matches conveyor incident 388 to historical guard-rail case", () => {
    const store = loadSampleStore();
    const current = store.getIncident("388");
    const { match } = findPrecedent(store, current);
    assert.ok(match);
    assert.ok(["347", "360"].includes(match.incident.ID));
    assert.ok(match.confidence >= 0.35);
  });

  it("does not promote NOT_VALID as State A match", () => {
    const store = loadSampleStore();
    const current = store.getIncident("390");
    const { match, falseDup } = findPrecedent(store, current);
    if (match) {
      assert.notEqual(match.incident.closureReason, "NOT_VALID");
      assert.notEqual(match.incident.closureReason, "DUPLICATE");
    }
    assert.ok(falseDup.count >= 1);
  });

  it("returns link-only summary when RCA missing", () => {
    assert.equal(
      buildTemplateSummary({ majorRootCause: null, correctiveAction: null }),
      null
    );
    assert.equal(
      buildTemplateSummary({ majorRootCause: null, correctiveAction: "x" }),
      null
    );
    assert.match(
      buildTemplateSummary({
        majorRootCause: "Guard missing",
        correctiveAction: "Installed",
      }),
      /Root cause/
    );
  });

  it("State C for novel pattern", () => {
    const store = loadSampleStore();
    const current = store.getIncident("391");
    const { match, falseDup } = findPrecedent(store, current);
    assert.equal(match, null);
    assert.equal(falseDup.count, 0);
  });
});

describe("compute + API payload", () => {
  it("persists READY State A for 388", async () => {
    const store = loadSampleStore();
    const row = await computePrecedentForIncident(store, "388");
    assert.equal(row.status, "READY");
    assert.ok(row.matchedIncidentId);
    const api = toApiPayload(row, store.getConfig());
    assert.equal(api.status, "READY");
    assert.equal(api.states.precedent.show, true);
    assert.equal(api.aiDisclosure.isAuthoritative, false);
    assert.ok(api.states.precedent.deepLink.params.IncidentID);
  });

  it("GET miss maps to UNAVAILABLE soft payload", () => {
    const store = loadSampleStore();
    const api = toApiPayload(null, store.getConfig());
    assert.equal(api.status, "UNAVAILABLE");
    assert.equal(api.states.precedent.show, false);
  });

  it("feature flag disables panel", async () => {
    const store = loadSampleStore();
    const row = await computePrecedentForIncident(store, "388");
    const api = toApiPayload(row, { ...store.getConfig(), featureEnabled: false });
    assert.equal(api.status, "UNAVAILABLE");
    assert.equal(api.featureDisabled, true);
  });

  it("recompute is idempotent for same inputs", async () => {
    const store = loadSampleStore();
    const a = await computePrecedentForIncident(store, "388");
    const b = await computePrecedentForIncident(store, "388");
    assert.equal(a.matchedIncidentId, b.matchedIncidentId);
  });
});
