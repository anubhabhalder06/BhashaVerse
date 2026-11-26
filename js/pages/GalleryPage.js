// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { FilterBar } from "../components/FilterBar.js";
import { StateView } from "../components/StateView.js";

/** Monochrome Photo & Video Archive page with vertical native-script labels and consent metadata. */
export class GalleryPage extends Page {
  async mount() {
    this.setTitle("Photo & Video Archive");
    const mediaRepo = this.container.resolve("mediaRepo");
    const filterService = this.container.resolve("filterService");
    const mediaFigure = this.container.resolve("mediaFigure");

    const filterHost = document.getElementById("mt-gal-filters");
    const grid = document.getElementById("gal-grid");
    const countEl = document.getElementById("mt-gal-count");
    if (!grid) return;

    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const items = await mediaRepo.listMedia();
      const initialState = {
        query: UrlHelper.getParam("q"),
        facets: {
          collection: UrlHelper.getParam("collection"),
          language: UrlHelper.getParam("language"),
        },
      };

      const renderFiltered = (state) => {
        UrlHelper.setParams({ q: state.query, ...state.facets });
        const filtered = filterService.filter(items, state, {
          searchText: (m) => `${m.title} ${m.collection} ${m.description.caption} ${m.place.region} ${m.rights.attribution} ${m.languages.map((l) => l.communityName).join(" ")}`,
          getters: {
            collection: (m) => m.collection,
            language: (m) => m.languages.map((l) => l.communityName),
          },
        });

        clear(grid);
        if (countEl) countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "record" : "records"} shown`;
        if (!filtered.length) {
          grid.appendChild(StateView.empty("No photographs match those filters."));
          return;
        }
        for (const item of filtered) {
          grid.appendChild(el("article", { class: "mt-tile-editorial" }, mediaFigure.render(item, { showMetadata: true })));
        }
      };

      if (filterHost) {
        const bar = new FilterBar({
          searchPlaceholder: "Title, region, credit",
          facets: [
            { key: "collection", label: "Collection", options: filterService.extractFacets(items, (m) => m.collection) },
            { key: "language", label: "Language / community", options: filterService.extractFacets(items, (m) => m.languages.map((l) => l.communityName)) },
          ],
          initialValues: initialState,
          onChange: renderFiltered,
        });
        clear(filterHost);
        filterHost.appendChild(bar.render());
      }

      renderFiltered(initialState);
    } catch (err) {
      clear(grid);
      grid.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load gallery."));
    }
  }
}
