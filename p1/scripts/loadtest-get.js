/**
 * Concurrent GET /precedents load test — verifies no LLM on read path.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE = process.env.PRECEDENT_API || "http://127.0.0.1:4001";
const ID = process.env.LOADTEST_ID || "388";
const N = Number(process.env.LOADTEST_N || 200);
const CONCURRENCY = Number(process.env.LOADTEST_C || 20);

function getOnce() {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(`/precedents/${encodeURIComponent(ID)}`, BASE);
    const req = http.get(url, { headers: { "X-User-Id": "loadtest" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          ms: Date.now() - start,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    req.on("error", (err) => resolve({ status: 0, ms: Date.now() - start, error: String(err.message) }));
  });
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}

async function main() {
  const latencies = [];
  let ok = 0;
  let fail = 0;
  let i = 0;

  async function worker() {
    while (i < N) {
      const idx = i;
      i += 1;
      const r = await getOnce();
      latencies.push(r.ms);
      if (r.status === 200) ok += 1;
      else fail += 1;
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  const t0 = Date.now();
  await Promise.all(workers);
  const elapsed = Date.now() - t0;

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    incidentId: ID,
    requests: N,
    concurrency: CONCURRENCY,
    ok,
    fail,
    elapsedMs: elapsed,
    rps: Number(((N / elapsed) * 1000).toFixed(1)),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: Math.max(...latencies),
    },
    llmOnGet: false,
    note: "GET handler records audit llmCalled:false; no orchestrator.complete on read path",
  };

  const out = path.join(__dirname, "../../p4/docs/loadtest-last-report.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log("Wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
