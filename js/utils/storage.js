// @ts-check

/** Safe storage wrapper with in-memory fallback when localStorage is unavailable. */
export class SafeStorage {
  /** @param {Storage | null} [backing] */
  constructor(backing = null) {
    /** @type {Storage | null} */
    this.backing = backing;
    if (!this.backing && typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      try {
        this.backing = globalThis.localStorage;
      } catch (_) {
        this.backing = null;
      }
    }
    /** @type {Map<string, string>} */
    this.memory = new Map();
  }

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    try {
      if (this.backing) {
        const val = this.backing.getItem(key);
        if (val !== null) return val;
      }
    } catch (_) {}
    return this.memory.has(key) ? /** @type {string} */ (this.memory.get(key)) : null;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    const str = String(value);
    this.memory.set(key, str);
    try {
      if (this.backing) this.backing.setItem(key, str);
    } catch (_) {}
  }

  /**
   * @param {string} key
   */
  removeItem(key) {
    this.memory.delete(key);
    try {
      if (this.backing) this.backing.removeItem(key);
    } catch (_) {}
  }

  /**
   * @template T
   * @param {string} key
   * @param {T} fallback
   * @returns {T}
   */
  getJson(key, fallback) {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return /** @type {T} */ (JSON.parse(raw));
    } catch (_) {
      return fallback;
    }
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  setJson(key, value) {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }
}
