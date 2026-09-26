/**
 * In-memory ops metrics (GET latency, compute, AI errors) — queryable for pilot dashboards.
 */
class OpsMetrics {
  constructor({ maxSamples = 500 } = {}) {
    this.maxSamples = maxSamples;
    this.getLatenciesMs = [];
    this.counters = {
      getRequests: 0,
      getReady: 0,
      getPending: 0,
      getUnavailable: 0,
      computeSuccess: 0,
      computeFailure: 0,
      aiErrors: 0,
      feedbackAccepted: 0,
      eventsRecorded: 0,
    };
  }

  recordGet(latencyMs, status) {
    this.counters.getRequests += 1;
    this.getLatenciesMs.push(latencyMs);
    if (this.getLatenciesMs.length > this.maxSamples) {
      this.getLatenciesMs.shift();
    }
    if (status === "READY") this.counters.getReady += 1;
    else if (status === "PENDING") this.counters.getPending += 1;
    else this.counters.getUnavailable += 1;
  }

  recordCompute(ok) {
    if (ok) this.counters.computeSuccess += 1;
    else this.counters.computeFailure += 1;
  }

  recordAiError() {
    this.counters.aiErrors += 1;
  }

  percentile(p) {
    if (!this.getLatenciesMs.length) return null;
    const sorted = [...this.getLatenciesMs].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
  }

  snapshot() {
    return {
      counters: { ...this.counters },
      getLatencyMs: {
        count: this.getLatenciesMs.length,
        p50: this.percentile(50),
        p95: this.percentile(95),
        p99: this.percentile(99),
        max: this.getLatenciesMs.length ? Math.max(...this.getLatenciesMs) : null,
      },
      alerts: this.evaluateAlerts(),
    };
  }

  evaluateAlerts() {
    const p95 = this.percentile(95);
    const alerts = [];
    if (p95 != null && p95 > 1000) {
      alerts.push({ level: "warn", code: "GET_P95_HIGH", message: `GET p95 ${p95}ms > 1000ms` });
    }
    if (this.counters.aiErrors >= 10) {
      alerts.push({ level: "warn", code: "AI_ERROR_SPIKE", message: `AI errors=${this.counters.aiErrors}` });
    }
    return alerts;
  }
}

const globalOpsMetrics = new OpsMetrics();

module.exports = { OpsMetrics, globalOpsMetrics };
