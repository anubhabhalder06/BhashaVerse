// @ts-check

/**
 * Abstract data source boundary (backend swap point).
 * Implementations return parsed JSON data for a named dataset.
 */
export class DataSource {
  /**
   * @param {string} _name
   * @returns {Promise<unknown>}
   */
  async load(_name) {
    throw new Error("DataSource.load() must be implemented by subclasses");
  }
}
