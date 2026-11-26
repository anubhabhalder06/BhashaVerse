// @ts-check
import { DataSource } from "./DataSource.js";

/**
 * Static JSON DataSource using relative fetch paths, 8s timeout abort handling,
 * payload shape validation, and failure cache eviction so Retry can recover.
 */
export class JsonDataSource extends DataSource {
  /**
   * @param {string} [basePath="data"]
   * @param {number} [timeoutMs=8000]
   */
  constructor(basePath = "data", timeoutMs = 8000) {
    super();
    this.basePath = basePath.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
    /** @type {Map<string, Promise<unknown>>} */
    this.cache = new Map();
  }

  /**
   * Load JSON dataset by relative name (e.g., "languages", "brand/wordmarks").
   * @param {string} name
   * @returns {Promise<any>}
   */
  load(name) {
    const clean = String(name || "").replace(/^\/+|(\.json)+$/g, "");
    if (!this.cache.has(clean)) {
      const p = this._fetchJson(clean).catch((err) => {
        this.cache.delete(clean);
        throw err;
      });
      this.cache.set(clean, p);
    }
    return /** @type {Promise<any>} */ (this.cache.get(clean));
  }

  /** @param {string} clean */
  async _fetchJson(clean) {
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), this.timeoutMs) : 0;
    try {
      const res = await fetch(`${this.basePath}/${clean}.json`, ctrl ? { signal: ctrl.signal } : undefined);
      if (!res.ok) {
        throw new Error(`Dataset "${clean}" returned status ${res.status}`);
      }
      const data = await res.json();
      if (data === null || (typeof data !== "object" && !Array.isArray(data))) {
        throw new Error(`Dataset "${clean}" returned invalid JSON shape`);
      }
      return data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
