// @ts-check
import { freezeRecordEnvelope } from "./envelope.js";

/** Immutable community story model. */
export class Story {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    Object.assign(this, freezeRecordEnvelope(raw));
    this.mediaId = raw.mediaId ? String(raw.mediaId) : null;
    Object.freeze(this);
  }
}
