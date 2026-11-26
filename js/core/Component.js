// @ts-check
import { clear } from "../utils/dom.js";

/** Base class for light-DOM UI components with explicit cleanup hooks. */
export class Component {
  /** @param {HTMLElement} [host] */
  constructor(host) {
    /** @type {HTMLElement | null} */
    this.host = host || null;
    /** @type {Array<() => void>} */
    this.cleanups = [];
  }

  /**
   * Mount component inside target element.
   * @param {HTMLElement} target
   */
  mount(target) {
    this.host = target;
    clear(target);
    const node = this.render();
    if (node) target.appendChild(node);
  }

  /**
   * Override in subclasses to return rendered light-DOM tree.
   * @returns {Node | null}
   */
  render() {
    return null;
  }

  /** @param {() => void} fn */
  registerCleanup(fn) {
    this.cleanups.push(fn);
  }

  destroy() {
    while (this.cleanups.length) {
      const fn = this.cleanups.pop();
      try { if (fn) fn(); } catch (_) {}
    }
  }
}
