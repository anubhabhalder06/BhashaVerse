// @ts-check

/** Immutable approximate language geography marker. */
export class Place {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    this.id = String(raw.id || "");
    this.languageId = String(raw.languageId || "");
    this.name = String(raw.name || "");
    this.regionLabel = String(raw.regionLabel || "");
    this.lat = Number(raw.lat || 0);
    this.lng = Number(raw.lng || 0);
    this.approximate = raw.approximate !== false;
    Object.freeze(this);
  }
}
