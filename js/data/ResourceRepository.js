// @ts-check
import { Resource } from "../models/Resource.js";

/** Repository for Digital Library resource records. */
export class ResourceRepository {
  /** @param {import('./DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<Resource[]>} */
  async list() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("resources"));
    return raw.map((item) => new Resource(item));
  }

  /**
   * @param {string} id
   * @returns {Promise<Resource | null>}
   */
  async getById(id) {
    const all = await this.list();
    return all.find((r) => r.id === id) || null;
  }

  /**
   * @param {string} langId
   * @returns {Promise<Resource[]>}
   */
  async findByLanguage(langId) {
    const all = await this.list();
    return all.filter((r) => r.languages.some((l) => l.id === langId));
  }
}
