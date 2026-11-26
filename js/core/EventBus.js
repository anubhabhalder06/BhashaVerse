// @ts-check

/** Minimal pub/sub event bus for decoupled component communication. */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<(payload: unknown) => void>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event name. Returns an unsubscribe callback.
   * @param {string} eventName
   * @param {(payload: unknown) => void} handler
   * @returns {() => void}
   */
  on(eventName, handler) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName)?.add(handler);
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe handler from an event name.
   * @param {string} eventName
   * @param {(payload: unknown) => void} handler
   */
  off(eventName, handler) {
    this.listeners.get(eventName)?.delete(handler);
  }

  /**
   * Emit event payload synchronously.
   * @param {string} eventName
   * @param {unknown} [payload]
   */
  emit(eventName, payload) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    for (const fn of [...set]) fn(payload);
  }
}
