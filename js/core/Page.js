// @ts-check
import { formatPageTitle } from "../config/routes.js";

/** Base page controller invoked by main.js registry. */
export class Page {
  /** @param {import('./Container.js').Container} container */
  constructor(container) {
    /** @type {import('./Container.js').Container} */
    this.container = container;
  }

  /**
   * Update document title safely using BRAND format.
   * @param {string} title
   */
  setTitle(title) {
    if (typeof document !== "undefined") {
      document.title = formatPageTitle(title);
    }
  }

  /** @returns {Promise<void>} */
  async mount() {}
}
