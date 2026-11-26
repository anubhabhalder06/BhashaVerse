// @ts-check
import { Language } from "../models/Language.js";

/** Repository for language registry records. */
export class LanguageRepository {
  /** @param {import('./DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<Language[]>} */
  async list() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("languages"));
    return raw.map((item) => new Language(item));
  }

  /**
   * @param {string} id
   * @returns {Promise<Language | null>}
   */
  async getById(id) {
    const all = await this.list();
    return all.find((l) => l.id === id) || null;
  }

  /** @returns {Promise<Language[]>} */
  async listFeatured() {
    const all = await this.list();
    return all.filter((l) => l.featured);
  }
}
