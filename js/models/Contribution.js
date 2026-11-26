// @ts-check
import { CONTRIBUTION_STATUS } from "./enums.js";

/** Immutable demonstration contribution record stored locally in browser. */
export class Contribution {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    this.id = String(raw.id || `sub-${Date.now()}`);
    this.type = String(raw.type || "");
    this.title = String(raw.title || "");
    this.description = String(raw.description || "");
    this.language = String(raw.language || "");
    this.region = String(raw.region || "");
    this.topic = String(raw.topic || "");
    this.contributorName = raw.anonymous ? "Anonymous (approved)" : String(raw.contributorName || "Unspecified");
    this.anonymous = Boolean(raw.anonymous);
    this.contact = String(raw.contact || "");
    this.creator = String(raw.creator || "");
    this.dateNote = String(raw.dateNote || "");
    this.fileName = String(raw.fileName || "");
    this.fileSize = Number(raw.fileSize || 0);
    this.rightsConfirmed = Boolean(raw.rightsConfirmed);
    this.consentConfirmed = Boolean(raw.consentConfirmed);
    this.restrictedRequest = Boolean(raw.restrictedRequest);
    this.status = String(raw.status || CONTRIBUTION_STATUS.PENDING);
    this.submittedAt = String(raw.submittedAt || new Date().toISOString().slice(0, 10));
    Object.freeze(this);
  }
}
