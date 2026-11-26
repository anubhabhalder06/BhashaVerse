// @ts-check

const THEME_KEY = "matrika:theme";

/** High-contrast paper/ink light & dark token switcher persisted in matrika:theme. */
export class ThemeService {
  /** @param {import('../utils/storage.js').SafeStorage} storage */
  constructor(storage) {
    this.storage = storage;
  }

  /** @returns {"light" | "dark"} */
  getTheme() {
    const saved = this.storage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  }

  /** @param {"light" | "dark"} theme */
  apply(theme) {
    const next = theme === "dark" ? "dark" : "light";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    this.storage.setItem(THEME_KEY, next);
    return next;
  }

  /** @returns {"light" | "dark"} */
  init() {
    return this.apply(this.getTheme());
  }

  /** @returns {"light" | "dark"} */
  toggle() {
    return this.apply(this.getTheme() === "dark" ? "light" : "dark");
  }
}
