const path = require("path");
const { FileStore } = require("../src/store/fileStore");
const { computePrecedentForIncident } = require("../src/jobs/compute");

const storePath = process.env.PRECEDENT_STORE || path.join(__dirname, "../data/store.json");
const store = new FileStore(storePath).load();

async function main() {
  const openOrAll = store.listIncidents();
  let n = 0;
  for (const incident of openOrAll) {
    await computePrecedentForIncident(store, incident.ID);
    n += 1;
  }
  console.log(`Computed PrecedentResult for ${n} incidents (P2 AI write-path)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
