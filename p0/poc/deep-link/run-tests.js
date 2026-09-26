/**
 * Unit tests for deep-link intent builder (no FLP required).
 */
const assert = require("assert");
const {
  buildNavigationIntent,
  assertExactObjectIntent,
} = require("./crossAppNav");

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

const sampleConfig = {
  semanticObject: "Incident",
  action: "display",
  incidentParamName: "IncidentID",
  extraParams: { "sap-app-origin-hint": "" },
};

test("builds intent with exact incident param", () => {
  const intent = buildNavigationIntent(sampleConfig, "347");
  assert.strictEqual(intent.target.semanticObject, "Incident");
  assert.strictEqual(intent.target.action, "display");
  assert.strictEqual(intent.params.IncidentID, "347");
  assertExactObjectIntent(intent);
});

test("rejects missing config", () => {
  assert.throws(() => buildNavigationIntent({}, "347"));
});

test("rejects missing matched id", () => {
  assert.throws(() => buildNavigationIntent(sampleConfig, ""));
});

test("assertExactObjectIntent rejects empty params", () => {
  assert.throws(() =>
    assertExactObjectIntent({ target: {}, params: {} })
  );
});

console.log("\nDeep-link PoC tests finished.");
console.log("Next: fill navigation-config.json and call navigateToIncident from FLP console.");
