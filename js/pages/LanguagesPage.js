// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { FilterBar } from "../components/FilterBar.js";
import { StateView } from "../components/StateView.js";

/** Searchable & filterable 10-language directory + Saved bookmarks view (?saved=1). */
export class LanguagesPage extends Page {
  async mount() {
    const isSavedMode = UrlHelper.getParam("saved") === "1";
    this.setTitle(isSavedMode ? "Saved Languages" : "Explore Languages");

    const langRepo = this.container.resolve("languageRepo");
    const filterService = this.container.resolve("filterService");
    const languageCard = this.container.resolve("languageCard");
    const bookmarkService = this.container.resolve("bookmarkService");

    const filterHost = document.getElementById("mt-lang-filters");
    const grid = document.getElementById("lang-grid");
    const countEl = document.getElementById("mt-lang-count");
    const titleEl = document.getElementById("mt-lang-heading");
    if (!grid) return;

    if (isSavedMode && titleEl) titleEl.textContent = "Saved Languages & Records";

    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const languages = await langRepo.list();
      const allSaved = bookmarkService.list();

      if (isSavedMode) {
        if (filterHost) filterHost.hidden = true;
        const savedLangIds = new Set(allSaved.map((b) => b.id));
        const matchedLangs = languages.filter((l) => savedLangIds.has(l.id));
        const otherBookmarks = allSaved.filter((b) => b.type !== "Language");

        clear(grid);
        if (countEl) countEl.textContent = `${allSaved.length} saved ${allSaved.length === 1 ? "item" : "items"} in this browser`;

        if (!allSaved.length) {
          grid.appendChild(StateView.empty("You have not saved any languages or library records yet.", "Browse all languages", "languages.html"));
          return;
        }
        for (const lang of matchedLangs) grid.appendChild(languageCard.render(lang));
        for (const b of otherBookmarks) {
          grid.appendChild(
            el(
              "article",
              { class: "mt-tile-editorial" },
              el("span", { class: "mt-chip" }, b.type),
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, el("a", { href: b.href }, b.title)),
              el("a", { class: "mt-text-arrow-link", href: b.href }, "Open record ", el("span", { "aria-hidden": "true" }, "→"))
            )
          );
        }
        return;
      }

      const initialState = {
        query: UrlHelper.getParam("q"),
        facets: {
          region: UrlHelper.getParam("region"),
          family: UrlHelper.getParam("family"),
          script: UrlHelper.getParam("script"),
          resource: UrlHelper.getParam("resource"),
        },
      };

      const renderFiltered = (state) => {
        UrlHelper.setParams({ q: state.query, ...state.facets });
        const filtered = filterService.filter(languages, state, {
          searchText: (l) => `${l.name} ${l.nativeName} ${l.altNames.join(" ")} ${l.scriptLabel} ${l.region} ${l.family} ${l.overview}`,
          getters: {
            region: (l) => l.region,
            family: (l) => l.family,
            script: (l) => l.scripts.length ? l.scripts : ["Unverified"],
            resource: (l) => l.resources,
          },
        });

        clear(grid);
        if (countEl) countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "language" : "languages"} shown`;

        if (!filtered.length) {
          grid.appendChild(StateView.empty("No languages match these filters. Clear all filters to view every entry."));
          return;
        }
        for (const lang of filtered) {
          grid.appendChild(languageCard.render(lang));
        }
      };

      if (filterHost) {
        const bar = new FilterBar({
          searchPlaceholder: "Name, alternate spelling, script, region",
          facets: [
            { key: "region", label: "Region / State", options: filterService.extractFacets(languages, (l) => l.region) },
            { key: "family", label: "Language family", options: filterService.extractFacets(languages, (l) => l.family) },
            { key: "script", label: "Script (ISO 15924)", options: filterService.extractFacets(languages, (l) => (l.scripts.length ? l.scripts : ["Unverified"])) },
            { key: "resource", label: "Resource type", options: filterService.extractFacets(languages, (l) => l.resources) },
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
      grid.appendChild(StateView.error("Couldn't load languages. Try again.", () => this.mount()));
    }
  }
}
