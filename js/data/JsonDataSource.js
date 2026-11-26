// @ts-check
import { DataSource } from "./DataSource.js";

/** Static JSON DataSource using relative fetch paths and in-memory caching. */
export class JsonDataSource extends DataSource {
  /** @param {string} [basePath="data"] */
  constructor(basePath = "data") {
    super();
    this.basePath = basePath.replace(/\/+$/, "");
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
      const p = fetch(`${this.basePath}/${clean}.json`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load dataset "${clean}": ${res.status}`);
        return res.json();
      });
      this.cache.set(clean, p);
    }
    return /** @type {Promise<any>} */ (this.cache.get(clean));
  }
}
