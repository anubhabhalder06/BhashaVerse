// @ts-check

/**
 * Check whether browser canvas actually paints non-empty ink for a glyph in a requested font.
 * Helps avoid tofu boxes.
 * @param {string} ch
 * @param {string} fontStr
 * @returns {boolean}
 */
export function canRenderChar(ch, fontStr) {
  try {
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext("2d");
    if (!ctx) return true;
    ctx.font = fontStr;
    const wGlyph = ctx.measureText(ch).width;
    const wMissing = ctx.measureText("\uFFFF").width;
    ctx.clearRect(0, 0, 48, 48);
    ctx.fillStyle = "#000";
    ctx.fillText(ch, 6, 36);
    const data = ctx.getImageData(0, 0, 48, 48).data;
    let ink = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) ink++;
    return ink > 12 && Math.abs(wGlyph - wMissing) > 0.25;
  } catch (_) {
    return true;
  }
}

/**
 * Segment text into grapheme clusters safely (using Intl.Segmenter when available).
 * Never splits Indic conjuncts/vowel signs by UTF-16 code unit.
 * @param {string} text
 * @param {string} [lang]
 * @returns {string[]}
 */
export function segmentGraphemes(text, lang = "en") {
  const str = String(text || "");
  if (!str) return [];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const seg = new Intl.Segmenter(lang, { granularity: "grapheme" });
      return [...seg.segment(str)].map((s) => s.segment);
    } catch (_) {}
  }
  return [str];
}
