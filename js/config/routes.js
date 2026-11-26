// @ts-check
import { BRAND } from "./brand.js";

/** @readonly */
export const NAV_PRIMARY = Object.freeze([
  { id: "home", label: "Home", href: "index.html" },
  { id: "languages", label: "Languages", href: "languages.html" },
  { id: "library", label: "Library", href: "library.html" },
  { id: "gallery", label: "Photo & Video", href: "gallery.html" },
  { id: "audio", label: "Audio", href: "audio.html" },
  { id: "map", label: "Map", href: "map.html" },
  { id: "contribute", label: "Contribute", href: "contribute.html" },
]);

/** @readonly */
export const NAV_MORE = Object.freeze([
  { id: "history", label: "History & Heritage", href: "history.html" },
  { id: "culture", label: "Culture & Traditions", href: "culture.html" },
  { id: "stories", label: "Community Stories", href: "stories.html" },
  { id: "saved", label: "Saved", href: "languages.html?saved=1" },
  { id: "about", label: "About", href: "about.html" },
]);

/** @readonly */
export const FOOTER_COLUMNS = Object.freeze([
  {
    heading: "Explore",
    links: [
      { label: "Languages", href: "languages.html" },
      { label: "Library", href: "library.html" },
      { label: "Photo and Video", href: "gallery.html" },
      { label: "Audio", href: "audio.html" },
      { label: "Map", href: "map.html" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "History and Heritage", href: "history.html" },
      { label: "Culture and Traditions", href: "culture.html" },
      { label: "Community Stories", href: "stories.html" },
      { label: "Saved bookmarks", href: "languages.html?saved=1" },
      { label: "About", href: "about.html" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Privacy", href: "privacy.html" },
      { label: "Terms", href: "terms.html" },
      { label: "Copyright and reuse", href: "copyright.html" },
      { label: "Contribution guidelines", href: "guidelines.html" },
      { label: "Contact / Report", href: "contact.html" },
    ],
  },
]);

/**
 * Format document title consistently without mutating brand wordmark.
 * @param {string} [pageTitle]
 * @returns {string}
 */
export function formatPageTitle(pageTitle) {
  if (!pageTitle || pageTitle === "Home") {
    return `${BRAND.name} — ${BRAND.descriptor}`;
  }
  return `${pageTitle} · ${BRAND.name}`;
}
