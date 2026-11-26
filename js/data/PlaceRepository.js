// @ts-check
import { Place } from "../models/Place.js";

/** Repository for approximate language region map markers. */
export class PlaceRepository {
  /** @param {import('./DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<Place[]>} */
  async list() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("places"));
    return raw.map((item) => new Place(item));
  }

  /**
   * @param {string} langId
   * @returns {Promise<Place | null>}
   */
  async findByLanguage(langId) {
    const all = await this.list();
    return all.find((p) => p.languageId === langId) || null;
  }
}
