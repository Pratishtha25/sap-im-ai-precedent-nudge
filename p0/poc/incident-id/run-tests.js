const assert = require("assert");
const {
  incidentIdFromTaskTitle,
  normalizeIncidentKey,
  resolveIncidentId,
} = require("./extractIncidentId");
const { isTaskAllowedForPrecedent } = require("./taskAllowList");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

test("extracts Incident ID from Root Causes Hierarchy title", () => {
  const title =
    "Perform investigation step 'Root Causes Hierarchy' for Incident ID 388";
  assert.strictEqual(incidentIdFromTaskTitle(title), "388");
});

test("extracts Incident ID from review title", () => {
  const title = "Review and complete investigation of Incident ID 188";
  assert.strictEqual(incidentIdFromTaskTitle(title), "188");
});

test("returns null when no Incident ID in title", () => {
  assert.strictEqual(incidentIdFromTaskTitle("Approve leave request"), null);
});

test("normalizeIncidentKey handles number and string", () => {
  assert.strictEqual(normalizeIncidentKey(388), "388");
  assert.strictEqual(normalizeIncidentKey(" 347 "), "347");
  assert.strictEqual(normalizeIncidentKey(""), null);
});

test("resolve prefers container over title", () => {
  const result = resolveIncidentId({
    containerIncidentId: "999",
    taskTitle: "… Incident ID 388",
    allowTitleFallback: true,
  });
  assert.deepStrictEqual(result, { incidentId: "999", source: "container" });
});

test("resolve title fallback warns", () => {
  const result = resolveIncidentId({
    taskTitle: "Perform investigation step for Incident ID 388",
    allowTitleFallback: true,
  });
  assert.strictEqual(result.incidentId, "388");
  assert.strictEqual(result.source, "titleFallback");
  assert.ok(result.warning);
});

test("resolve unresolved without fallback", () => {
  const result = resolveIncidentId({
    taskTitle: "Perform investigation step for Incident ID 388",
    allowTitleFallback: false,
  });
  assert.strictEqual(result.incidentId, null);
  assert.strictEqual(result.source, "unresolved");
});

test("allow-list matches Root Causes Hierarchy", () => {
  assert.ok(
    isTaskAllowedForPrecedent(
      "Perform investigation step 'Root Causes Hierarchy' for Incident ID 388"
    )
  );
});

test("allow-list matches review investigation", () => {
  assert.ok(
    isTaskAllowedForPrecedent(
      "Review and complete investigation of Incident ID 388"
    )
  );
});

test("allow-list rejects unrelated task", () => {
  assert.ok(!isTaskAllowedForPrecedent("Approve purchase order 123"));
});

test("allow-list prefers step id when provided", () => {
  assert.ok(isTaskAllowedForPrecedent("anything", ["RC_HIER"], "RC_HIER"));
  assert.ok(!isTaskAllowedForPrecedent("anything", ["RC_HIER"], "OTHER"));
});

console.log("\nIncident ID PoC tests finished.");
