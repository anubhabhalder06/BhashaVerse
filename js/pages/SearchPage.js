// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { StateView } from "../components/StateView.js";

const GROUP_LABELS = Object.freeze({
  languages: "Languages",
  library: "Digital Library",
  images: "Photos & Visual Plates",
  audio: "Audio Archive",
  stories: "Community Stories",
});

/** Cross-archive Search page with Unicode-aware ranking, grouped counts, URL state, and clear-all. */
export class SearchPage extends Page {
  async mount() {
    this.setTitle("Search Archive");
    const qInput = /** @type {HTMLInputElement | null} */ (document.getElementById("search-page-q"));
    const groupSel = /** @type {HTMLSelectElement | null} */ (document.getElementById("search-page-group"));
    const clearBtn = document.getElementById("search-page-clear");
    const countEl = document.getElementById("mt-search-count");
    const outEl = document.getElementById("mt-search-results");
    if (!qInput || !outEl) return;

    const getSearchService = this.container.resolve("getSearchService");
    clear(outEl);
    outEl.appendChild(StateView.loading());

    try {
      const searchService = await getSearchService();
      qInput.value = UrlHelper.getParam("q");
      if (groupSel) groupSel.value = UrlHelper.getParam("type");

      const runSearch = () => {
        const q = qInput.value.trim();
        const type = groupSel ? groupSel.value : "";
        UrlHelper.setParams({ q, type });
        clear(outEl);

        if (!q) {
          if (countEl) countEl.textContent = "Enter a language name, script, region, creator, or keyword to search.";
          outEl.appendChild(StateView.empty("Try searching for Tulu, Ol Chiki, Mishing, palm-leaf, loom, or Koda."));
          return;
        }

        const res = searchService.search(q, type);
        if (countEl) {
          countEl.textContent = `${res.total} ${res.total === 1 ? "result" : "results"} for "${res.query}"`;
        }

        if (!res.total) {
          outEl.appendChild(
            StateView.empty(`No archive records match "${res.query}". Try another spelling or clear group filters.`)
          );
          return;
        }

        for (const [groupKey, rows] of Object.entries(res.groups)) {
          if (!rows.length) continue;
          const ul = el("ul", { class: "mt-search-list" });
          for (const row of rows) {
            ul.appendChild(
              el(
                "li",
                {},
                el("a", { href: row.href, style: "font-weight:600" }, row.title),
                el("span", { class: "mt-muted", style: "font-size:var(--mt-text-xs)" }, row.subtitle)
              )
            );
          }
          outEl.appendChild(
            el(
              "section",
              { class: "mt-search-group" },
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, `${GROUP_LABELS[groupKey] || groupKey} (${rows.length})`),
              ul
            )
          );
        }
      };

      let searchTimer = 0;
      qInput.addEventListener("input", () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(runSearch, 180);
      });
      if (groupSel) {
        groupSel.addEventListener("change", () => {
          window.clearTimeout(searchTimer);
          runSearch();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          window.clearTimeout(searchTimer);
          qInput.value = "";
          if (groupSel) groupSel.value = "";
          runSearch();
        });
      }

      runSearch();
    } catch {
      clear(outEl);
      outEl.appendChild(StateView.error("Couldn't index archive search. Try again.", () => this.mount()));
    }
  }
}
