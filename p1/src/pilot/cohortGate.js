/**
 * Pilot-only feature scoping (P5.1.2).
 * When config.pilotMode === 'pilot_only', panel payloads are UNAVAILABLE
 * unless the request user and/or incident location is in the cohort allow-list.
 */

function loadCohort(cohort) {
  if (!cohort || typeof cohort !== "object") {
    return { userIds: new Set(), locationIds: new Set(), mode: "all" };
  }
  const userIds = new Set(
    (cohort.cohort?.managers || cohort.managers || []).map((m) => String(m.userId))
  );
  const locationIds = new Set(
    (cohort.cohort?.plants || cohort.plants || []).map((p) => String(p.locationId))
  );
  const mode = cohort.featureFlag?.mode || cohort.mode || "all";
  return { userIds, locationIds, mode };
}

/**
 * @returns {{ allowed: boolean, reason: string }}
 */
function isPilotAllowed({ mode, userIds, locationIds }, { userId, locationId }) {
  if (!mode || mode === "all" || mode === "off") {
    if (mode === "off") return { allowed: false, reason: "pilot_off" };
    return { allowed: true, reason: "open" };
  }

  // pilot_only
  const userOk = userId && userIds.has(String(userId));
  const locOk = locationId && locationIds.has(String(locationId));

  // Allow if user is in cohort OR incident is at pilot location
  if (userOk || locOk) {
    return {
      allowed: true,
      reason: userOk && locOk ? "user_and_location" : userOk ? "user" : "location",
    };
  }

  return { allowed: false, reason: "not_in_cohort" };
}

function applyPilotGate(payload, allowed) {
  if (allowed) return payload;
  return {
    ...payload,
    status: "UNAVAILABLE",
    states: {
      precedent: { show: false },
      falseDuplicate: { show: false, count: 0 },
      noMatch: { show: false, showLightweightNote: false },
    },
    pilotGated: true,
    aiDisclosure: payload.aiDisclosure || {
      labelKey: "AI_GENERATED_ADVISORY",
      isAuthoritative: false,
    },
  };
}

module.exports = {
  loadCohort,
  isPilotAllowed,
  applyPilotGate,
};
