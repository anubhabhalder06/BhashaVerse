// @ts-check

/** Lightweight dependency injection container wired once in main.js. */
export class Container {
  constructor() {
    /** @type {Map<string, (c: Container) => unknown>} */
    this.factories = new Map();
    /** @type {Map<string, unknown>} */
    this.instances = new Map();
  }

  /**
   * Register a singleton factory by key.
   * @template T
   * @param {string} key
   * @param {(c: Container) => T} factory
   * @returns {this}
   */
  singleton(key, factory) {
    this.factories.set(key, factory);
    return this;
  }

  /**
   * Register a pre-built value or constant.
   * @template T
   * @param {string} key
   * @param {T} value
   * @returns {this}
   */
  value(key, value) {
    this.instances.set(key, value);
    return this;
  }

  /**
   * Resolve a registered dependency.
   * @template T
   * @param {string} key
   * @returns {T}
   */
  resolve(key) {
    if (this.instances.has(key)) {
      return /** @type {T} */ (this.instances.get(key));
    }
    const factory = this.factories.get(key);
    if (!factory) throw new Error(`Container: unknown dependency "${key}"`);
    const created = factory(this);
    this.instances.set(key, created);
    return /** @type {T} */ (created);
  }
}
