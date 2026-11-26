// @ts-check

/**
 * Intent-based same-origin prefetcher using Speculation Rules when supported,
 * with single-link rel="prefetch" fallback on pointerover/touchstart.
 * Skips when Data Saver is enabled and excludes admin.html.
 */
export class LinkPrefetcher {
  constructor() {
    this.prefetched = new Set();
    /** @type {AbortController | null} */
    this._ac = null;
  }

  /** @returns {boolean} */
  isDataSaverOn() {
    if (typeof navigator === "undefined") return false;
    const conn = /** @type {{ saveData?: boolean } | undefined} */ (/** @type {any} */ (navigator).connection);
    return Boolean(conn && conn.saveData === true);
  }

  init() {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (this.isDataSaverOn()) return;

    this._injectSpeculationRules();

    if (this._ac) this._ac.abort();
    this._ac = new AbortController();
    const { signal } = this._ac;

    const handleIntent = (/** @type {Event} */ e) => {
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const raw = anchor.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.endsWith("/admin.html") || url.pathname === "/admin.html") return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      const clean = `${url.origin}${url.pathname}${url.search}`;
      if (this.prefetched.has(clean)) return;
      this.prefetched.add(clean);

      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = clean;
      document.head.appendChild(link);
    };

    document.addEventListener("pointerover", handleIntent, { passive: true, signal });
    document.addEventListener("touchstart", handleIntent, { passive: true, signal });
  }

  _injectSpeculationRules() {
    if (
      typeof HTMLScriptElement !== "function" ||
      typeof HTMLScriptElement.supports !== "function" ||
      !HTMLScriptElement.supports("speculationrules")
    ) {
      return;
    }
    if (document.querySelector('script[type="speculationrules"]')) return;

    const rules = {
      prefetch: [
        {
          where: {
            and: [
              { href_matches: "/*" },
              { not: { href_matches: "*admin.html*" } },
              { not: { selector_matches: "[target='_blank'], [download]" } },
            ],
          },
          eagerness: "moderate",
        },
      ],
    };

    const s = document.createElement("script");
    s.type = "speculationrules";
    s.textContent = JSON.stringify(rules);
    document.head.appendChild(s);
  }

  destroy() {
    if (this._ac) this._ac.abort();
  }
}
