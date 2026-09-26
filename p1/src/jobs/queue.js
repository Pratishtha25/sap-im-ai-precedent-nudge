/**
 * Simple async queue for write-path (AD-3 simulation).
 */
class ComputeQueue {
  constructor(workerFn) {
    this.workerFn = workerFn;
    this.pending = new Map(); // id -> Promise
  }

  enqueue(incidentId) {
    const id = String(incidentId);
    if (this.pending.has(id)) return this.pending.get(id);

    const job = Promise.resolve()
      .then(() => this.workerFn(id))
      .finally(() => {
        this.pending.delete(id);
      });

    this.pending.set(id, job);
    return job;
  }

  size() {
    return this.pending.size;
  }
}

module.exports = { ComputeQueue };
