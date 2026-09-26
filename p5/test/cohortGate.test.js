const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCohort,
  isPilotAllowed,
  applyPilotGate,
} = require("../../p1/src/pilot/cohortGate");
const fs = require("fs");
const path = require("path");

describe("pilot cohort gate", () => {
  const cohortFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../config/pilot-cohort.json"), "utf8")
  );
  const ctx = loadCohort(cohortFile);

  it("loads sample cohort users and locations", () => {
    assert.equal(ctx.mode, "pilot_only");
    assert.ok(ctx.userIds.has("demo-manager"));
    assert.ok(ctx.locationIds.has("PLANT-A-LINE-3"));
  });

  it("allows cohort user in pilot_only", () => {
    const r = isPilotAllowed(ctx, { userId: "demo-manager", locationId: "OTHER" });
    assert.equal(r.allowed, true);
  });

  it("allows pilot location even for other user", () => {
    const r = isPilotAllowed(ctx, { userId: "stranger", locationId: "PLANT-B-WH" });
    assert.equal(r.allowed, true);
  });

  it("denies non-cohort", () => {
    const r = isPilotAllowed(ctx, { userId: "stranger", locationId: "PLANT-Z" });
    assert.equal(r.allowed, false);
    assert.equal(r.reason, "not_in_cohort");
  });

  it("mode all allows everyone", () => {
    const r = isPilotAllowed({ ...ctx, mode: "all" }, { userId: "x", locationId: "y" });
    assert.equal(r.allowed, true);
  });

  it("applyPilotGate hides panel when not allowed", () => {
    const payload = {
      status: "READY",
      states: { precedent: { show: true }, falseDuplicate: { show: false, count: 0 }, noMatch: {} },
    };
    const gated = applyPilotGate(payload, false);
    assert.equal(gated.status, "UNAVAILABLE");
    assert.equal(gated.pilotGated, true);
    assert.equal(gated.states.precedent.show, false);
  });
});
