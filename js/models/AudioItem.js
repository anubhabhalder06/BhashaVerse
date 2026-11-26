// @ts-check
import { freezeRecordEnvelope } from "./envelope.js";

/** Immutable audio archive item model. */
export class AudioItem {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    Object.assign(this, freezeRecordEnvelope(raw));
    this.collection = String(raw.collection || "");
    Object.freeze(this);
  }
}
