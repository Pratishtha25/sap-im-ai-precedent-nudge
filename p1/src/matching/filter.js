/**
 * Structured candidate filter (FR2) with configurable looseness.
 * P2: optional AI category used when human category missing (or as soft boost).
 */

function effectiveCategory(incident, config = {}) {
  const human = (incident.category || "").trim();
  const aiType = (incident.aiCategory?.incidentType || "").trim();
  if (config.preferHumanCategory !== false) {
    return human || aiType || null;
  }
  return aiType || human || null;
}

function matchesStrict(candidate, current, config) {
  const curCat = effectiveCategory(current, config);
  const candCat = effectiveCategory(candidate, config);
  return (
    candidate.locationId &&
    current.locationId &&
    candidate.locationId === current.locationId &&
    (!curCat || !candCat || candCat === curCat) &&
    (!current.equipmentId || !candidate.equipmentId || candidate.equipmentId === current.equipmentId)
  );
}

function matchesModerate(candidate, current) {
  if (!candidate.locationId || !current.locationId) return false;
  if (candidate.locationId !== current.locationId) return false;
  return true;
}

function matchesLoose(candidate, current, config) {
  const curCat = effectiveCategory(current, config);
  const candCat = effectiveCategory(candidate, config);
  if (current.locationId && candidate.locationId === current.locationId) return true;
  if (curCat && candCat === curCat) return true;
  if (current.equipmentId && candidate.equipmentId === current.equipmentId) return true;
  return false;
}

/**
 * @param {object[]} closedIncidents
 * @param {object} current
 * @param {"STRICT"|"MODERATE"|"LOOSE"} looseness
 * @param {object} [config]
 */
function filterCandidates(closedIncidents, current, looseness = "MODERATE", config = {}) {
  const pred =
    looseness === "STRICT"
      ? (c) => matchesStrict(c, current, config)
      : looseness === "LOOSE"
        ? (c) => matchesLoose(c, current, config)
        : (c) => matchesModerate(c, current);

  return closedIncidents.filter((c) => {
    if (String(c.ID) === String(current.ID)) return false;
    if (String(c.status || "").toUpperCase() !== "CLOSED") return false;
    return pred(c);
  });
}

function confidenceBoost(candidate, current, config = {}) {
  let boost = 0;
  const curCat = effectiveCategory(current, config);
  const candCat = effectiveCategory(candidate, config);
  if (curCat && candCat === curCat) boost += 0.05;
  if (current.equipmentId && candidate.equipmentId === current.equipmentId) boost += 0.05;
  return boost;
}

module.exports = {
  filterCandidates,
  confidenceBoost,
  matchesStrict,
  matchesModerate,
  matchesLoose,
  effectiveCategory,
};
