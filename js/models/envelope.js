// @ts-check

/**
 * Normalise and freeze shared Section 8.1 archive record envelope fields.
 * @param {Record<string, any>} raw
 */
export function freezeRecordEnvelope(raw) {
  return {
    id: String(raw.id || ""),
    type: String(raw.type || ""),
    title: String(raw.title || ""),
    altTitles: Object.freeze([...(raw.altTitles || [])]),
    summary: String(raw.summary || ""),
    isFeatured: Boolean(raw.isFeatured),
    languages: Object.freeze((raw.languages || []).map((l) => Object.freeze({ ...l, scripts: Object.freeze([...(l.scripts || [])]) }))),
    place: Object.freeze({ ...(raw.place || { region: "", precision: "state", approximate: true }) }),
    time: Object.freeze({ ...(raw.time || {}) }),
    creators: Object.freeze((raw.creators || []).map((c) => Object.freeze({ ...c }))),
    source: Object.freeze({ ...(raw.source || {}) }),
    description: Object.freeze({
      ...(raw.description || {}),
      keywords: Object.freeze([...((raw.description && raw.description.keywords) || [])]),
    }),
    rights: Object.freeze({ ...(raw.rights || {}) }),
    quality: Object.freeze({
      ...(raw.quality || {}),
      references: Object.freeze([...((raw.quality && raw.quality.references) || [])]),
    }),
    technical: Object.freeze({ ...(raw.technical || {}) }),
  };
}
