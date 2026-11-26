// @ts-check

const LATIN_RANGE_RE = /^[\u0000-\u024F\u1E00-\u1EFF\s\p{P}]+$/u;

/**
 * Detect whether text consists strictly of Latin script characters, ASCII, spaces, and punctuation.
 * Indic text returns false so combining vowel signs are never stripped or reordered.
 * @param {string} str
 * @returns {boolean}
 */
export function isLatinText(str) {
  return LATIN_RANGE_RE.test(str);
}

/**
 * Strip combining diacritics strictly from Latin substrings; preserve Indic vowel signs intact.
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value) {
  const nfc = String(value || "").normalize("NFC").toLowerCase();
  return nfc
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim() || !isLatinText(part)) return part;
      return part.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
    })
    .join("");
}

/**
 * Tokenize search query on whitespace and standard punctuation while keeping Indic clusters intact.
 * @param {string} value
 * @returns {string[]}
 */
export function tokenizeSearch(value) {
  const norm = normalizeText(value).trim();
  if (!norm) return [];
  return norm.split(/[\s.,;:!?()[\]{}"/\\|·—–]+/).filter(Boolean);
}

/**
 * Compute bounded Levenshtein edit distance for simple Latin typo tolerance.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  /** @type {number[]} */
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Format seconds as m:ss.
 * @param {number} sec
 * @returns {string}
 */
export function formatDuration(sec) {
  const total = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Pad two digits.
 * @param {number} n
 * @returns {string}
 */
export function pad2(n) {
  return String(n).padStart(2, "0");
}
