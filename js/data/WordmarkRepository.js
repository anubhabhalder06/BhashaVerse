// @ts-check
import { WordmarkFrame } from "../models/WordmarkFrame.js";

/**
 * Loads wordmarks.json and language registry, groups registry languages by primary script,
 * orders anchors first then registry script order, and skips entries with null text.
 */
export class WordmarkRepository {
  /**
   * @param {import('./DataSource.js').DataSource} dataSource
   * @param {import('./LanguageRepository.js').LanguageRepository} languageRepo
   */
  constructor(dataSource, languageRepo) {
    this.dataSource = dataSource;
    this.languageRepo = languageRepo;
  }

  /** @returns {Promise<WordmarkFrame[]>} */
  async getFrames() {
    const [seed, languages] = await Promise.all([
      this.dataSource.load("brand/wordmarks"),
      this.languageRepo.list(),
    ]);

    const scriptsMap = seed.scripts || {};
    const anchors = Array.isArray(seed.anchors) ? seed.anchors : ["Latn", "Deva"];

    /** @type {Map<string, Array<{ id: string, name: string, nativeName: string }>>} */
    const grouped = new Map();
    /** @type {string[]} */
    const registryScriptOrder = [];

    for (const lang of languages) {
      const primary = lang.primaryScript;
      if (!primary) continue;
      if (!grouped.has(primary)) {
        grouped.set(primary, []);
        registryScriptOrder.push(primary);
      }
      grouped.get(primary)?.push({
        id: lang.id,
        name: lang.name,
        nativeName: lang.nativeName,
      });
    }

    /** @type {string[]} */
    const orderedCodes = [];
    for (const code of anchors) {
      if (!orderedCodes.includes(code)) orderedCodes.push(code);
    }
    for (const code of registryScriptOrder) {
      if (!orderedCodes.includes(code)) orderedCodes.push(code);
    }

    /** @type {WordmarkFrame[]} */
    const frames = [];
    for (const code of orderedCodes) {
      const def = scriptsMap[code];
      if (!def || def.text === null || def.text === undefined || def.text === "") continue;
      const captionLangs = grouped.get(code) || [];
      frames.push(
        new WordmarkFrame({
          script: code,
          text: def.text,
          lang: def.lang || "en",
          font: def.font || "display-latin",
          status: def.status || "pending",
          captionLanguages: captionLangs,
          captionText: this.formatCaption(captionLangs, anchors.includes(code)),
          isAnchor: anchors.includes(code),
        })
      );
    }

    return frames;
  }

  /**
   * Format maximum 2 language names from registry (plus "+N" overflow), never hand-written.
   * @param {Array<{ id: string, name: string, nativeName: string }>} langs
   * @param {boolean} [isAnchor=false]
   * @returns {string}
   */
  formatCaption(langs, isAnchor = false) {
    if (!langs.length) return "";
    if (isAnchor && langs.length === 0) return "";
    const labels = langs.slice(0, 2).map((l) => (l.nativeName && l.nativeName !== l.name ? `${l.name} ${l.nativeName}` : l.name));
    const extra = langs.length - 2;
    return extra > 0 ? `${labels.join(" · ")} +${extra}` : labels.join(" · ");
  }
}
