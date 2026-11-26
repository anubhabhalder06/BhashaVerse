// @ts-check

const PAUSE_KEY = "matrika:wordmark-paused";

/** Observes prefers-reduced-motion live and persists manual pause preference. */
export class MotionPreferences {
  /** @param {import('../utils/storage.js').SafeStorage} storage */
  constructor(storage) {
    this.storage = storage;
    /** @type {Set<() => void>} */
    this.listeners = new Set();
    /** @type {MediaQueryList | null} */
    this.mq = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    if (this.mq) {
      const notify = () => this.notify();
      if ("addEventListener" in this.mq) this.mq.addEventListener("change", notify);
    }
  }

  /** @returns {boolean} */
  isReducedMotion() {
    return Boolean(this.mq && this.mq.matches);
  }

  /** @returns {boolean} */
  isPausedByUser() {
    return this.storage.getItem(PAUSE_KEY) === "true";
  }

  /** @param {boolean} paused */
  setPausedByUser(paused) {
    this.storage.setItem(PAUSE_KEY, paused ? "true" : "false");
    this.notify();
  }

  /**
   * @param {() => void} fn
   * @returns {() => void}
   */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of [...this.listeners]) fn();
  }
}
