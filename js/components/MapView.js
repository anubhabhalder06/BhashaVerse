// @ts-check
import { clear, el } from "../utils/dom.js";

/**
 * Interactive Leaflet OpenStreetMap language-region explorer paired with an
 * accessible non-map chip selector and required orientation/OSM disclaimers.
 */
export class MapView {
  /** @param {import('../services/MapService.js').MapService} mapService */
  constructor(mapService) {
    this.mapService = mapService;
  }

  /**
   * Render Leaflet map + accessible region list inside host elements.
   * @param {{
   *   mapEl: HTMLElement,
   *   listEl: HTMLElement,
   *   inspectorEl: HTMLElement,
   *   places: import('../models/Place.js').Place[],
   *   languages: import('../models/Language.js').Language[],
   *   initialLangId?: string,
   * }} opts
   */
  async mountMap(opts) {
    const { mapEl, listEl, inspectorEl, places, languages } = opts;
    /** @type {Map<string, any>} */
    const markers = new Map();
    /** @type {HTMLButtonElement[]} */
    const chips = [];
    let mapInstance = null;

    const selectLanguage = (langId, panMap = true) => {
      const lang = languages.find((l) => l.id === langId) || languages[0];
      const place = places.find((p) => p.languageId === lang.id);
      if (!lang) return;

      chips.forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang.id));
      });

      clear(inspectorEl);
      inspectorEl.append(
        el("div", { class: "mt-badge-row" }, el("span", { class: "mt-chip" }, lang.region), el("span", { class: "mt-chip mt-chip--demo" }, "Approximate region")),
        lang.nativeName && lang.nativeName !== lang.name
          ? el("div", { lang: lang.langAttr, style: "font-family:var(--mt-font-indic); font-size:2.4rem; line-height:1.2;" }, lang.nativeName)
          : el("div", { class: "mt-script-stub-box" }, lang.scripts.length ? lang.scriptLabel : "Script to be verified"),
        el("h2", { style: "margin:0; font-size: var(--mt-text-xl);" }, lang.name),
        el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, `${lang.family} · ${lang.scriptLabel}`),
        el("p", { style: "margin:0;" }, place ? place.regionLabel : lang.place.region),
        el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, lang.overview),
        el(
          "div",
          { class: "mt-cta-row" },
          el("a", { class: "mt-btn mt-btn--solid", href: `language-profile.html?id=${encodeURIComponent(lang.id)}` }, `Open ${lang.name} profile`),
          el("a", { class: "mt-text-arrow-link", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute ", el("span", { "aria-hidden": "true" }, "→"))
        )
      );

      if (panMap && mapInstance && place) {
        mapInstance.setView([place.lat, place.lng], 6, { animate: false });
        const marker = markers.get(lang.id);
        if (marker) marker.openPopup();
      }
    };

    clear(listEl);
    for (const p of places) {
      const btn = /** @type {HTMLButtonElement} */ (
        el("button", {
          type: "button",
          class: "mt-map-lang-btn",
          dataset: { lang: p.languageId },
          "aria-pressed": "false",
          onClick: () => selectLanguage(p.languageId, true),
        }, p.name)
      );
      chips.push(btn);
      listEl.appendChild(el("li", {}, btn));
    }

    const startId = opts.initialLangId || (places[0] && places[0].languageId) || "tulu";
    selectLanguage(startId, false);

    try {
      const L = await this.mapService.loadLeaflet();
      mapInstance = L.map(mapEl, { scrollWheelZoom: false }).setView([22.5, 81.5], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 12,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);

      for (const p of places) {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: p.languageId === "koda" ? 7 : 8,
          color: "#0E0E0E",
          weight: 2,
          dashArray: p.languageId === "koda" ? "3 3" : null,
          fillColor: p.languageId === "koda" ? "#EFEDE8" : "#0E0E0E",
          fillOpacity: p.languageId === "koda" ? 0.5 : 0.85,
        }).addTo(mapInstance);

        const pop = document.createElement("div");
        pop.append(
          el("strong", {}, p.name),
          el("br"),
          el("span", {}, `${p.regionLabel} · Approximate`),
          el("br"),
          el("a", { href: `language-profile.html?id=${encodeURIComponent(p.languageId)}` }, "Open profile →")
        );
        marker.bindPopup(pop);
        marker.on("click", () => selectLanguage(p.languageId, false));
        markers.set(p.languageId, marker);
      }
      selectLanguage(startId, true);
    } catch (_) {
      clear(mapEl);
      mapEl.appendChild(
        el(
          "div",
          { class: "mt-state-box" },
          el("strong", {}, "Interactive tile map unavailable offline or blocked"),
          el("p", { style: "margin:0" }, "Use the accessible region selector buttons beside this box to inspect every documented language area.")
        )
      );
    }
  }
}
