// @ts-check
import { editDistance, normalizeText, tokenizeSearch } from "../utils/format.js";

/**
 * Pure keyword/phrase scorer with bounded Latin fuzzy matching (Node-testable, zero DOM).
 */
export class IntentMatcher {
  /**
   * Match raw message against knowledge base intents.
   * @param {string} message
   * @param {Array<{ id: string, phrases: string[] }>} intents
   * @param {number} [threshold=0.35]
   * @returns {{ intentId: string, confidence: number }}
   */
  match(message, intents, threshold = 0.35) {
    const norm = normalizeText(message).trim();
    const qTokens = tokenizeSearch(message);
    if (!norm || !qTokens.length) return { intentId: "fallback", confidence: 0 };

    let bestId = "fallback";
    let bestScore = 0;

    for (const intent of intents || []) {
      let intentScore = 0;
      for (const phrase of intent.phrases || []) {
        const pNorm = normalizeText(phrase);
        if (!pNorm) continue;
        if (norm === pNorm) {
          intentScore = Math.max(intentScore, 1);
          continue;
        }
        const pTokens = tokenizeSearch(phrase);
        if (!pTokens.length) continue;
        if (pTokens.length > 1 && norm.includes(pNorm)) {
          intentScore = Math.max(intentScore, 0.9);
          continue;
        }
        let hits = 0;
        for (const pt of pTokens) {
          const hit = qTokens.some((qt) => qt === pt || (qt.length >= 4 && pt.length >= 4 && editDistance(qt, pt) <= 1));
          if (hit) hits++;
        }
        const ratio = hits / pTokens.length;
        if (ratio > 0) intentScore = Math.max(intentScore, pTokens.length === 1 && hits === 1 ? 0.78 : ratio * 0.72);
      }

      if (intentScore > bestScore) {
        bestScore = intentScore;
        bestId = intent.id;
      }
    }

    if (bestScore < threshold) {
      return { intentId: "fallback", confidence: bestScore };
    }
    return { intentId: bestId, confidence: bestScore };
  }
}
