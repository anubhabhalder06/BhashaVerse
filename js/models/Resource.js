// @ts-check
import { freezeRecordEnvelope } from "./envelope.js";

/** Immutable digital library resource model. */
export class Resource {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    Object.assign(this, freezeRecordEnvelope(raw));
    this.category = String(raw.category || "");
    Object.freeze(this);
  }
}
