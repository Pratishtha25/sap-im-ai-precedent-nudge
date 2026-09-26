const path = require("path");
const fs = require("fs");
const { FileStore, emptyState } = require("../src/store/fileStore");
const { DEFAULT_CONFIG } = require("../src/config");

const storePath = process.env.PRECEDENT_STORE || path.join(__dirname, "../data/store.json");
const samplesPath = path.join(__dirname, "../data/sample-incidents.json");

const store = new FileStore(storePath);
store.data = emptyState(DEFAULT_CONFIG);

const samples = JSON.parse(fs.readFileSync(samplesPath, "utf8"));
for (const row of samples) {
  store.upsertIncident(row);
}
store.save();

console.log(`Seeded ${samples.length} incidents → ${storePath}`);
