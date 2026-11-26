// @ts-check
import { normalizeText } from "../utils/format.js";

/** Pure data-driven faceted filter helper for directory & catalogue listings. */
export class FilterService {
  /**
   * Derive sorted unique non-empty facet values from items.
   * @template T
   * @param {T[]} items
   * @param {(item: T) => string | string[]} extractor
   * @returns {string[]}
   */
  extractFacets(items, extractor) {
    /** @type {Set<string>} */
    const set = new Set();
    for (const item of items) {
      const val = extractor(item);
      if (Array.isArray(val)) {
        for (const v of val) if (v && String(v).trim()) set.add(String(v).trim());
      } else if (val && String(val).trim()) {
        set.add(String(val).trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Filter items using query text and key/value facets.
   * @template T
   * @param {T[]} items
   * @param {{ query?: string, facets?: Record<string, string> }} criteria
   * @param {{ searchText: (item: T) => string, getters: Record<string, (item: T) => string | string[]> }} config
   * @returns {T[]}
   */
  filter(items, criteria, config) {
    const q = normalizeText(criteria.query || "").trim();
    const facets = criteria.facets || {};

    return items.filter((item) => {
      if (q && !normalizeText(config.searchText(item)).includes(q)) return false;
      for (const [key, expected] of Object.entries(facets)) {
        if (!expected) continue;
        const getter = config.getters[key];
        if (!getter) continue;
        const actual = getter(item);
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) return false;
        } else if (String(actual) !== expected) {
          return false;
        }
      }
      return true;
    });
  }
}
