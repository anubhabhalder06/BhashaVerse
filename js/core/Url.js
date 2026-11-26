// @ts-check

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,80}$/i;

/** URL query helpers with strict input sanitisation for client-side routing. */
export class UrlHelper {
  /**
   * Read and sanitise an identifier query param (?id= or ?lang= fallback).
   * @param {string} [primaryKey="id"]
   * @param {string} [fallbackKey]
   * @returns {string}
   */
  static getId(primaryKey = "id", fallbackKey) {
    if (typeof location === "undefined") return "";
    const params = new URLSearchParams(location.search);
    const raw = (params.get(primaryKey) || (fallbackKey ? params.get(fallbackKey) : "") || "").trim();
    return SAFE_SLUG_RE.test(raw) ? raw.toLowerCase() : "";
  }

  /**
   * Read and trim a plain query string parameter (safe length capped).
   * @param {string} key
   * @param {number} [maxLen=160]
   * @returns {string}
   */
  static getParam(key, maxLen = 160) {
    if (typeof location === "undefined") return "";
    const raw = new URLSearchParams(location.search).get(key) || "";
    return raw.trim().slice(0, maxLen);
  }

  /**
   * Update browser URL search parameters without reloading.
   * @param {Record<string, string>} entries
   */
  static setParams(entries) {
    if (typeof history === "undefined" || typeof location === "undefined") return;
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(entries)) {
      const val = String(v || "").trim();
      if (val) url.searchParams.set(k, val);
      else url.searchParams.delete(k);
    }
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
}
