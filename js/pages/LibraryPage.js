// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear } from "../utils/dom.js";
import { FilterBar } from "../components/FilterBar.js";
import { StateView } from "../components/StateView.js";

/** Rights-aware Digital Library listing page with URL-synced facets. */
export class LibraryPage extends Page {
  async mount() {
    this.setTitle("Digital Library");
    const resourceRepo = this.container.resolve("resourceRepo");
    const filterService = this.container.resolve("filterService");
    const resourceCard = this.container.resolve("resourceCard");
    const rightsPolicy = this.container.resolve("rightsPolicy");

    const filterHost = document.getElementById("mt-lib-filters");
    const grid = document.getElementById("lib-grid");
    const countEl = document.getElementById("mt-lib-count");
    if (!grid) return;

    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const items = await resourceRepo.list();
      const initialState = {
        query: UrlHelper.getParam("q"),
        facets: {
          category: UrlHelper.getParam("category"),
          format: UrlHelper.getParam("format"),
          rights: UrlHelper.getParam("rights"),
          language: UrlHelper.getParam("language"),
        },
      };

      const renderFiltered = (state) => {
        UrlHelper.setParams({ q: state.query, ...state.facets });
        const filtered = filterService.filter(items, state, {
          searchText: (it) =>
            `${it.title} ${it.category} ${it.summary} ${it.creators.map((c) => c.name).join(" ")} ${it.languages.map((l) => l.communityName).join(" ")} ${it.description.keywords.join(" ")}`,
          getters: {
            category: (it) => it.category,
            format: (it) => it.technical.format || "",
            rights: (it) => rightsPolicy.evaluate(it).label,
            language: (it) => it.languages.map((l) => l.communityName),
          },
        });

        clear(grid);
        if (countEl) countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "record" : "records"} shown`;
        if (!filtered.length) {
          grid.appendChild(StateView.empty("No library records match those filters."));
          return;
        }
        for (const item of filtered) grid.appendChild(resourceCard.render(item));
      };

      if (filterHost) {
        const bar = new FilterBar({
          searchPlaceholder: "Title, author, language, subject",
          facets: [
            { key: "category", label: "Category", options: filterService.extractFacets(items, (it) => it.category) },
            { key: "language", label: "Language", options: filterService.extractFacets(items, (it) => it.languages.map((l) => l.communityName)) },
            { key: "format", label: "Format", options: filterService.extractFacets(items, (it) => it.technical.format || "") },
            { key: "rights", label: "Rights tier", options: filterService.extractFacets(items, (it) => rightsPolicy.evaluate(it).label) },
          ],
          initialValues: initialState,
          onChange: renderFiltered,
        });
        clear(filterHost);
        filterHost.appendChild(bar.render());
      }

      renderFiltered(initialState);
    } catch {
      clear(grid);
      grid.appendChild(StateView.error("Couldn't load the Digital Library. Try again.", () => this.mount()));
    }
  }
}
