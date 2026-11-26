// @ts-check
import { Story } from "../models/Story.js";

/** Repository for community stories. */
export class StoryRepository {
  /** @param {import('./DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<Story[]>} */
  async list() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("stories"));
    return raw.map((item) => new Story(item));
  }

  /**
   * @param {string} langId
   * @returns {Promise<Story[]>}
   */
  async findByLanguage(langId) {
    const all = await this.list();
    return all.filter((s) => s.languages.some((l) => l.id === langId));
  }
}
