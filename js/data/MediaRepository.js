// @ts-check
import { MediaItem } from "../models/MediaItem.js";
import { AudioItem } from "../models/AudioItem.js";

/** Repository for Photo & Video plates and Audio archive items. */
export class MediaRepository {
  /** @param {import('./DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<MediaItem[]>} */
  async listMedia() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("media"));
    return raw.map((item) => new MediaItem(item));
  }

  /**
   * @param {string} id
   * @returns {Promise<MediaItem | null>}
   */
  async getMediaById(id) {
    const all = await this.listMedia();
    return all.find((m) => m.id === id) || null;
  }

  /**
   * @param {string} langId
   * @returns {Promise<MediaItem[]>}
   */
  async findMediaByLanguage(langId) {
    const all = await this.listMedia();
    return all.filter((m) => m.languages.some((l) => l.id === langId));
  }

  /** @returns {Promise<AudioItem[]>} */
  async listAudio() {
    const raw = /** @type {Record<string, any>[]} */ (await this.dataSource.load("audio"));
    return raw.map((item) => new AudioItem(item));
  }

  /**
   * @param {string} langId
   * @returns {Promise<AudioItem[]>}
   */
  async findAudioByLanguage(langId) {
    const all = await this.listAudio();
    return all.filter((a) => a.languages.some((l) => l.id === langId));
  }
}
