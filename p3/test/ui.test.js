const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  mapPrecedentToViewModel,
  assertNoAutoFillActions,
  FORBIDDEN_ACTIONS,
} = require("../webapp/lib/StateMapper");
const { resolveIncidentId } = require("../webapp/lib/IncidentIdResolver");
const { isTaskAllowedForPrecedent } = require("../webapp/lib/TaskAllowList");
const { buildNavigationIntent } = require("../webapp/lib/DeepLink");
const { fetchPrecedent } = require("../webapp/lib/PrecedentClient");

describe("StateMapper", () => {
  it("maps State A READY to visible teaser/full", () => {
    const vm = mapPrecedentToViewModel(
      {
        status: "READY",
        states: {
          precedent: {
            show: true,
            matchedIncidentId: "347",
            matchedIncidentNumber: "INC-2024-00347",
            summaryText: "For reference: root cause noted as Guard rail missing",
            deepLink: { semanticObject: "Incident", action: "display", params: { IncidentID: "347" } },
          },
          falseDuplicate: { show: false, count: 0 },
          noMatch: { showLightweightNote: false },
        },
        aiDisclosure: { isAuthoritative: false },
      },
      "teaser"
    );
    assert.equal(vm.visible, true);
    assert.equal(vm.showPrecedent, true);
    assert.equal(vm.matchedIncidentId, "347");
    assert.equal(vm.linkOnly, false);
  });

  it("maps State B only", () => {
    const vm = mapPrecedentToViewModel({
      status: "READY",
      states: {
        precedent: { show: false },
        falseDuplicate: { show: true, count: 2 },
        noMatch: { showLightweightNote: false },
      },
    });
    assert.equal(vm.visible, true);
    assert.equal(vm.showFalseDup, true);
    assert.equal(vm.falseDupCount, 2);
  });

  it("maps State C lightweight note", () => {
    const vm = mapPrecedentToViewModel({
      status: "READY",
      states: {
        precedent: { show: false },
        falseDuplicate: { show: false, count: 0 },
        noMatch: { showLightweightNote: true },
      },
    });
    assert.equal(vm.visible, true);
    assert.equal(vm.showNoMatchNote, true);
  });

  it("PENDING omits by default (AD-7)", () => {
    const vm = mapPrecedentToViewModel({ status: "PENDING", states: {} });
    assert.equal(vm.visible, false);
  });

  it("PENDING can show non-blocking hint", () => {
    const vm = mapPrecedentToViewModel({ status: "PENDING", states: {} }, "full", {
      showPendingHint: true,
    });
    assert.equal(vm.visible, true);
    assert.equal(vm.pendingHint, true);
  });

  it("UNAVAILABLE and errors fail open (hidden)", () => {
    assert.equal(mapPrecedentToViewModel({ status: "UNAVAILABLE", states: {} }).visible, false);
    assert.equal(mapPrecedentToViewModel(null).visible, false);
  });

  it("link-only when State A without summary", () => {
    const vm = mapPrecedentToViewModel({
      status: "READY",
      states: {
        precedent: { show: true, matchedIncidentId: "392", matchedIncidentNumber: "INC-2025-00392", summaryText: null },
        falseDuplicate: { show: false, count: 0 },
        noMatch: {},
      },
    });
    assert.equal(vm.linkOnly, true);
  });

  it("forbids auto-fill actions", () => {
    assert.throws(() => assertNoAutoFillActions(["copyRca"]));
    assert.ok(FORBIDDEN_ACTIONS.includes("applyRca"));
    assert.equal(assertNoAutoFillActions(["openDeepLink"]), true);
  });
});

describe("My Inbox allow-list + ID", () => {
  it("allows Root Causes Hierarchy and review tasks", () => {
    assert.ok(
      isTaskAllowedForPrecedent(
        "Perform investigation step 'Root Causes Hierarchy' for Incident ID 388"
      )
    );
    assert.ok(isTaskAllowedForPrecedent("Review and complete investigation of Incident ID 390"));
    assert.ok(isTaskAllowedForPrecedent("Review and Complete Incident for Incident ID 388"));
    assert.ok(!isTaskAllowedForPrecedent("Approve purchase order 9001"));
  });

  it("resolves container id over title", () => {
    const r = resolveIncidentId({
      containerIncidentId: "388",
      taskTitle: "… Incident ID 999",
      allowTitleFallback: true,
    });
    assert.equal(r.incidentId, "388");
    assert.equal(r.source, "container");
  });
});

describe("Deep link", () => {
  it("builds exact object intent", () => {
    const intent = buildNavigationIntent(
      { semanticObject: "Incident", action: "display", incidentParamName: "IncidentID" },
      "347"
    );
    assert.equal(intent.params.IncidentID, "347");
  });

  it("rejects self-link", () => {
    assert.throws(() =>
      buildNavigationIntent(
        {
          semanticObject: "Incident",
          action: "display",
          incidentParamName: "IncidentID",
          currentIncidentId: "388",
        },
        "388"
      )
    );
  });
});

describe("PrecedentClient fail-open", () => {
  it("returns UNAVAILABLE soft payload on network error", async () => {
    const { payload, soft } = await fetchPrecedent("http://127.0.0.1:9", "388", {
      timeoutMs: 200,
      fetchImpl: async () => {
        throw new Error("network");
      },
    });
    assert.equal(soft, true);
    assert.equal(payload.status, "UNAVAILABLE");
  });
});
