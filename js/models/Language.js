// @ts-check

/** Immutable language registry model. */
export class Language {
  /** @param {Record<string, any>} raw */
  constructor(raw) {
    this.id = String(raw.id || "");
    this.name = String(raw.name || "");
    this.nativeName = String(raw.nativeName || "");
    this.altNames = Object.freeze([...(raw.altNames || [])]);
    this.preferredNameNote = String(raw.preferredNameNote || "");
    this.iso639_3 = String(raw.iso639_3 || "");
    this.scripts = Object.freeze([...(raw.scripts || [])]);
    this.scriptLabel = String(raw.scriptLabel || "");
    this.langAttr = String(raw.langAttr || "en");
    this.region = String(raw.region || "");
    this.family = String(raw.family || "");
    this.familyDetail = String(raw.familyDetail || "");
    this.resources = Object.freeze([...(raw.resources || [])]);
    this.featured = Boolean(raw.featured);
    this.detailedProfile = Boolean(raw.detailedProfile);
    this.place = Object.freeze({ ...(raw.place || { region: "", precision: "state", approximate: true }) });
    this.overview = String(raw.overview || "");
    this.history = String(raw.history || "");
    this.writingSystem = raw.writingSystem ? Object.freeze({ ...raw.writingSystem }) : null;
    this.vocabulary = Object.freeze((raw.vocabulary || []).map((v) => Object.freeze({ ...v })));
    this.featuredImageId = raw.featuredImageId || null;
    this.rights = Object.freeze({ ...(raw.rights || {}) });
    this.quality = Object.freeze({
      ...(raw.quality || {}),
      references: Object.freeze(((raw.quality && raw.quality.references) || []).map((r) => Object.freeze({ ...r }))),
    });
    Object.freeze(this);
  }

  /** @returns {string} */
  get primaryScript() {
    return this.scripts[0] || "";
  }
}
