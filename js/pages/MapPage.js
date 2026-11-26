// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { StateView } from "../components/StateView.js";
import { clear } from "../utils/dom.js";

/** Language Map controller loading Leaflet lazily and pairing with accessible region chips. */
export class MapPage extends Page {
  async mount() {
    this.setTitle("Language Map");
    const mapEl = document.getElementById("map");
    const listEl = document.getElementById("mt-map-list");
    const inspectorEl = document.getElementById("mt-map-inspector");
    if (!mapEl || !listEl || !inspectorEl) return;

    const placeRepo = this.container.resolve("placeRepo");
    const langRepo = this.container.resolve("languageRepo");
    const mapView = this.container.resolve("mapView");
    const initialLangId = UrlHelper.getId("lang", "id") || "tulu";

    clear(inspectorEl);
    inspectorEl.appendChild(StateView.loading());

    try {
      const [places, languages] = await Promise.all([placeRepo.list(), langRepo.list()]);
      await mapView.mountMap({ mapEl, listEl, inspectorEl, places, languages, initialLangId });
    } catch {
      clear(inspectorEl);
      inspectorEl.appendChild(StateView.error("Couldn't load the Language Map. Try again.", () => this.mount()));
    }
  }
}
