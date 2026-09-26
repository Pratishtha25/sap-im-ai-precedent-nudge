const path = require("path");
const { FileStore } = require("../src/store/fileStore");
const { backfillEmbeddings } = require("../src/jobs/backfill");

const storePath = process.env.PRECEDENT_STORE || path.join(__dirname, "../data/store.json");
const store = new FileStore(storePath).load();
const result = backfillEmbeddings(store);
console.log("Backfill complete:", result);
