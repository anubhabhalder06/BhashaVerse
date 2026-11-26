// @ts-check

const SCRIPT_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@600&family=Noto+Serif+Kannada:wght@600&family=Noto+Serif+Oriya:wght@600&family=Noto+Sans+Ol+Chiki:wght@600&family=Noto+Sans+Sora+Sompeng:wght@400;600&family=Noto+Sans+Masaram+Gondi:wght@400;600&family=Noto+Sans+Gunjala+Gondi:wght@400;600&display=swap";

/**
 * Ensures requested script font is loaded before entering rotation, avoiding tofu glyphs.
 */
export class FontGate {
  /** @param {number} [timeoutMs=3000] */
  constructor(timeoutMs = 3000) {
    this.timeoutMs = timeoutMs;
    this.lazyInjected = false;
  }

  /** Lazy-load non-anchor Indic fonts after main thread is idle, skipping on Save-Data or 2G. */
  warmSecondaryFonts() {
    if (this.lazyInjected || typeof document === "undefined") return;
    if (typeof navigator !== "undefined") {
      if (navigator.onLine === false) return;
      const conn = /** @type {{ saveData?: boolean, effectiveType?: string } | undefined} */ (
        /** @type {any} */ (navigator).connection
      );
      if (conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")) {
        return;
      }
    }
    this.lazyInjected = true;
    const inject = () => {
      if (document.querySelector(`link[href="${SCRIPT_FONTS_HREF}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = SCRIPT_FONTS_HREF;
      link.addEventListener("error", () => link.remove(), { once: true });
      document.head.appendChild(link);
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(inject, { timeout: 1500 });
    } else {
      setTimeout(inject, 400);
    }
  }

  /**
   * Verify frame glyph font is loaded and usable within 3s.
   * @param {import('../models/WordmarkFrame.js').WordmarkFrame} frame
   * @returns {Promise<boolean>}
   */
  async ensure(frame) {
    if (typeof document === "undefined" || !("fonts" in document)) return true;
    const family = frame.font === "display-latin" ? "Fraunces" : frame.font;
    const descriptor = `600 1em "${family}"`;
    try {
      const checkAlready = document.fonts.check(descriptor, frame.text);
      if (checkAlready) return true;

      const loadPromise = document.fonts.load(descriptor, frame.text).then((loaded) => {
        if (loaded && loaded.length > 0) return true;
        return document.fonts.check(descriptor, frame.text);
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), this.timeoutMs));
      const ok = await Promise.race([loadPromise, timeoutPromise]);
      return Boolean(ok);
    } catch (_) {
      return frame.isAnchor;
    }
  }
}
