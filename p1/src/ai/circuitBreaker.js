/**
 * Circuit breaker for GenAI Hub / AI Core write-path calls.
 */
class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 30_000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.openedAt = null;
    this.state = "CLOSED"; // CLOSED | OPEN | HALF_OPEN
  }

  canRequest() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN — allow probe
  }

  recordSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
    this.openedAt = null;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.openedAt = Date.now();
    }
  }

  snapshot() {
    return {
      state: this.state,
      failures: this.failures,
      openedAt: this.openedAt,
    };
  }
}

async function withRetry(fn, { maxAttempts = 2, backoffMs = 200 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoffMs * attempt));
      }
    }
  }
  throw lastErr;
}

module.exports = { CircuitBreaker, withRetry };
