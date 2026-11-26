// @ts-check

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

/** Lazily loads pinned Leaflet 1.9.4 only on pages requiring an interactive map. */
export class MapService {
  constructor() {
    /** @type {Promise<any> | null} */
    this.loader = null;
  }

  /** @returns {Promise<any>} */
  loadLeaflet() {
    if (typeof window === "undefined") return Promise.reject(new Error("No browser window"));
    if ("L" in window && /** @type {any} */ (window).L) {
      return Promise.resolve(/** @type {any} */ (window).L);
    }
    if (this.loader) return this.loader;

    this.loader = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        link.crossOrigin = "";
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.crossOrigin = "";
      script.onload = () => resolve(/** @type {any} */ (window).L);
      script.onerror = () => reject(new Error("Could not load map library"));
      document.head.appendChild(script);
    });
    return this.loader;
  }
}
