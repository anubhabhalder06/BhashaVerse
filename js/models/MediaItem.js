// @ts-check
import { freezeRecordEnvelope } from "./envelope.js";

/** Immutable gallery photo / visual plate model. */
export class MediaItem {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    Object.assign(this, freezeRecordEnvelope(raw));
    this.collection = String(raw.collection || "");
    this.verticalLabel = raw.verticalLabel ? Object.freeze({ ...raw.verticalLabel }) : null;
    Object.freeze(this);
  }
}
