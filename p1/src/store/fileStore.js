const fs = require("fs");
const path = require("path");
const { DEFAULT_CONFIG } = require("../config");

const DEFAULT_STORE_PATH = path.join(__dirname, "../../data/store.json");

function emptyState(config = DEFAULT_CONFIG) {
  return {
    incidents: {},
    embeddings: {},
    precedentResults: {},
    feedback: [],
    events: [],
    auditLog: [],
    config: {
      ...DEFAULT_CONFIG,
      ...config,
      deepLink: { ...DEFAULT_CONFIG.deepLink, ...(config.deepLink || {}) },
      genAiHub: { ...DEFAULT_CONFIG.genAiHub, ...(config.genAiHub || {}) },
      circuitBreaker: { ...DEFAULT_CONFIG.circuitBreaker, ...(config.circuitBreaker || {}) },
      retry: { ...DEFAULT_CONFIG.retry, ...(config.retry || {}) },
      prompts: { ...DEFAULT_CONFIG.prompts, ...(config.prompts || {}) },
      models: { ...DEFAULT_CONFIG.models, ...(config.models || {}) },
    },
  };
}

class FileStore {
  constructor(storePath = DEFAULT_STORE_PATH) {
    this.storePath = storePath;
    this.data = emptyState();
  }

  load() {
    if (!fs.existsSync(this.storePath)) {
      this.data = emptyState();
      this.save();
      return this;
    }
    const raw = JSON.parse(fs.readFileSync(this.storePath, "utf8"));
    this.data = {
      ...emptyState(),
      ...raw,
      config: {
        ...DEFAULT_CONFIG,
        ...(raw.config || {}),
        deepLink: { ...DEFAULT_CONFIG.deepLink, ...(raw.config?.deepLink || {}) },
        genAiHub: { ...DEFAULT_CONFIG.genAiHub, ...(raw.config?.genAiHub || {}) },
        circuitBreaker: { ...DEFAULT_CONFIG.circuitBreaker, ...(raw.config?.circuitBreaker || {}) },
        retry: { ...DEFAULT_CONFIG.retry, ...(raw.config?.retry || {}) },
        prompts: { ...DEFAULT_CONFIG.prompts, ...(raw.config?.prompts || {}) },
        models: { ...DEFAULT_CONFIG.models, ...(raw.config?.models || {}) },
      },
      incidents: raw.incidents || {},
      embeddings: raw.embeddings || {},
      precedentResults: raw.precedentResults || {},
      feedback: Array.isArray(raw.feedback) ? raw.feedback : [],
      events: Array.isArray(raw.events) ? raw.events : [],
      auditLog: Array.isArray(raw.auditLog) ? raw.auditLog : [],
    };
    return this;
  }

  save() {
    fs.mkdirSync(path.dirname(this.storePath), { recursive: true });
    fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  getConfig() {
    return this.data.config;
  }

  updateConfig(patch) {
    this.data.config = {
      ...this.data.config,
      ...patch,
      deepLink: { ...this.data.config.deepLink, ...(patch.deepLink || {}) },
      genAiHub: { ...this.data.config.genAiHub, ...(patch.genAiHub || {}) },
      circuitBreaker: { ...this.data.config.circuitBreaker, ...(patch.circuitBreaker || {}) },
      retry: { ...this.data.config.retry, ...(patch.retry || {}) },
      prompts: { ...this.data.config.prompts, ...(patch.prompts || {}) },
      models: { ...this.data.config.models, ...(patch.models || {}) },
    };
    this.save();
    return this.data.config;
  }

  upsertIncident(incident) {
    const id = String(incident.ID || incident.id);
    const prev = this.data.incidents[id] || {};
    const next = {
      ...prev,
      ...incident,
      ID: id,
      updatedAt: incident.updatedAt || new Date().toISOString(),
    };
    this.data.incidents[id] = next;
    this.save();
    return next;
  }

  getIncident(id) {
    return this.data.incidents[String(id)] || null;
  }

  listIncidents(filterFn = () => true) {
    return Object.values(this.data.incidents).filter(filterFn);
  }

  upsertEmbedding(row) {
    const incidentId = String(row.incidentId);
    this.data.embeddings[incidentId] = {
      ...row,
      incidentId,
      indexedAt: row.indexedAt || new Date().toISOString(),
    };
    this.save();
    return this.data.embeddings[incidentId];
  }

  getEmbedding(incidentId) {
    return this.data.embeddings[String(incidentId)] || null;
  }

  listEmbeddings(pool) {
    return Object.values(this.data.embeddings).filter((e) => !pool || e.pool === pool);
  }

  upsertPrecedentResult(row) {
    const incidentId = String(row.incidentId);
    this.data.precedentResults[incidentId] = {
      ...row,
      incidentId,
      computedAt: row.computedAt || new Date().toISOString(),
    };
    this.save();
    return this.data.precedentResults[incidentId];
  }

  getPrecedentResult(incidentId) {
    return this.data.precedentResults[String(incidentId)] || null;
  }

  setPrecedentPending(incidentId) {
    return this.upsertPrecedentResult({
      incidentId: String(incidentId),
      status: "PENDING",
      panelState: null,
      matchedIncidentId: null,
      matchedIncidentNumber: null,
      matchConfidence: null,
      summaryText: null,
      falseDupCount: 0,
      deepLinkJson: null,
      modelVersionsJson: JSON.stringify({ embedding: this.data.config.embeddingModelVersion }),
    });
  }

  addFeedback(row) {
    // Idempotent-ish: same user+incident+matched+verdict within same calendar day → replace
    const day = row.createdAt.slice(0, 10);
    const idx = this.data.feedback.findIndex(
      (f) =>
        f.userId === row.userId &&
        f.incidentId === row.incidentId &&
        String(f.matchedIncidentId) === String(row.matchedIncidentId) &&
        f.verdict === row.verdict &&
        String(f.createdAt).slice(0, 10) === day
    );
    if (idx >= 0) {
      this.data.feedback[idx] = { ...row, feedbackId: this.data.feedback[idx].feedbackId };
    } else {
      this.data.feedback.push(row);
    }
    this.save();
    return row;
  }

  listFeedback(filterFn = () => true) {
    return this.data.feedback.filter(filterFn);
  }

  addEvent(row) {
    this.data.events.push(row);
    // Cap event log for file store
    if (this.data.events.length > 5000) {
      this.data.events = this.data.events.slice(-4000);
    }
    this.save();
    return row;
  }

  listEvents(filterFn = () => true) {
    return this.data.events.filter(filterFn);
  }

  addAudit(row) {
    this.data.auditLog.push(row);
    if (this.data.auditLog.length > 5000) {
      this.data.auditLog = this.data.auditLog.slice(-4000);
    }
    this.save();
    return row;
  }

  listAudit(limit = 100) {
    return this.data.auditLog.slice(-limit);
  }
}

module.exports = { FileStore, emptyState, DEFAULT_STORE_PATH };
