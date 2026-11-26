// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { StatusChip } from "../components/StatusChip.js";
import { FilterBar } from "../components/FilterBar.js";
import { StateView } from "../components/StateView.js";

/** Audio Archive page: renders real player controls when audio files exist and clear speaker attribution otherwise. */
export class AudioPage extends Page {
  async mount() {
    this.setTitle("Audio Archive");
    const mediaRepo = this.container.resolve("mediaRepo");
    const filterService = this.container.resolve("filterService");
    const audioPlayer = this.container.resolve("audioPlayer");
    const rightsBadge = this.container.resolve("rightsBadge");

    const filterHost = document.getElementById("mt-audio-filters");
    const grid = document.getElementById("mt-audio-grid");
    const countEl = document.getElementById("mt-audio-count");
    if (!grid) return;

    clear(grid);
    grid.appendChild(StateView.loading("Loading audio recordings…", "rows"));

    try {
      const items = await mediaRepo.listAudio();
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
          searchText: (a) => `${a.title} ${a.collection} ${a.summary} ${a.description.caption} ${a.languages.map((l) => l.communityName).join(" ")}`,
          getters: {
            collection: (a) => a.collection,
            language: (a) => a.languages.map((l) => l.communityName),
          },
        });

        clear(grid);
        if (countEl) countEl.textContent = `${filtered.length} audio ${filtered.length === 1 ? "record" : "records"} shown`;
        if (!filtered.length) {
          grid.appendChild(StateView.empty("No audio records match those filters."));
          return;
        }

        for (const item of filtered) {
          const lang = item.languages[0];
          const attributionText = `${item.creators.map((c) => c.name).join(", ")} · ${lang ? lang.communityName : "Archive"} · ${item.place.region}`;
          const card = el(
            "article",
            { id: item.id, class: "mt-tile-editorial" },
            el(
              "div",
              { style: "display:grid; gap:var(--mt-space-3);" },
              el("div", { class: "mt-badge-row" }, rightsBadge.render(item), StatusChip.render(item.quality.verification)),
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, lang ? el("a", { href: `language-profile.html?id=${encodeURIComponent(lang.id)}`, style: "text-decoration:none" }, item.title) : item.title),
              el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, `${item.collection} · ${item.place.region} · ${item.time.date || ""}`),
              el("p", { style: "margin:0; font-size:var(--mt-text-sm);" }, item.summary),
              item.technical.file
                ? audioPlayer.render({
                    id: item.id,
                    title: item.title,
                    src: item.technical.file,
                    durationSec: item.technical.durationSec,
                    attribution: attributionText,
                    transcript: item.description.transcript,
                    translation: item.description.translation,
                  })
                : el(
                    "div",
                    { class: "mt-state-box mt-state-box--empty" },
                    el("p", { style: "margin:0; font-size:var(--mt-text-sm);" }, attributionText),
                    item.description.caption ? el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, item.description.caption) : null,
                    el("a", { href: `contribute.html?lang=${encodeURIComponent(lang ? lang.id : "")}` }, "Contribute speaker recording →")
                  )
            ),
            el(
              "div",
              { class: "mt-tile-foot" },
              el("span", {}, `Consent: ${item.rights.consent}`),
              el("a", { href: "contact.html" }, "Report correction")
            )
          );
          grid.appendChild(card);
        }
      };

      if (filterHost) {
        const bar = new FilterBar({
          searchPlaceholder: "Word, collection, language",
          facets: [
            { key: "collection", label: "Collection", options: filterService.extractFacets(items, (a) => a.collection) },
            { key: "language", label: "Language", options: filterService.extractFacets(items, (a) => a.languages.map((l) => l.communityName)) },
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
      grid.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load Audio Archive."));
    }
  }
}
