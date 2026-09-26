const http = require("http");
const fs = require("fs");
const path = require("path");
const { FileStore } = require("./store/fileStore");
const { ComputeQueue } = require("./jobs/queue");
const { computePrecedentForIncident } = require("./jobs/compute");
const { createHandler } = require("./api/handler");
const { DEFAULT_CONFIG } = require("./config");
const { loadCohort } = require("./pilot/cohortGate");

const storePath = process.env.PRECEDENT_STORE || path.join(__dirname, "../data/store.json");
const store = new FileStore(storePath).load();

const defaultCohortPath = path.join(__dirname, "../../p5/config/pilot-cohort.json");
const cohortPath = store.getConfig().pilotCohortPath || process.env.PILOT_COHORT_PATH || defaultCohortPath;

let pilotContext = null;
try {
  if (fs.existsSync(cohortPath)) {
    const raw = JSON.parse(fs.readFileSync(cohortPath, "utf8"));
    pilotContext = loadCohort(raw);
    // Activate scoped mode only when explicitly requested
    if (process.env.PILOT_MODE) {
      store.updateConfig({ pilotMode: process.env.PILOT_MODE });
    } else if (process.env.APPLY_PILOT_COHORT === "true" && raw.featureFlag?.mode) {
      store.updateConfig({ pilotMode: raw.featureFlag.mode });
    }
  }
} catch (err) {
  console.warn("Pilot cohort not loaded:", err.message);
}

const queue = new ComputeQueue(async (incidentId) =>
  computePrecedentForIncident(store, incidentId)
);

const server = http.createServer(createHandler(store, queue, undefined, pilotContext));
const port = store.getConfig().serverPort || DEFAULT_CONFIG.serverPort;

server.listen(port, () => {
  console.log(`Precedent service v0.4 listening on http://localhost:${port}`);
  console.log(`Store: ${storePath}`);
  console.log(
    `Feature enabled: ${store.getConfig().featureEnabled}; threshold: ${store.getConfig().confidenceThreshold}; pilotMode: ${store.getConfig().pilotMode}`
  );
  if (pilotContext) {
    console.log(`Pilot cohort: ${pilotContext.userIds.size} users, ${pilotContext.locationIds.size} locations`);
  }
});

module.exports = { server, store, queue, pilotContext };
