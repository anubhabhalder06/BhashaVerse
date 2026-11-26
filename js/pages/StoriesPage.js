// @ts-check
import { Page } from "../core/Page.js";
import { clear, el } from "../utils/dom.js";
import { DemoBadge } from "../components/DemoBadge.js";
import { StatusChip } from "../components/StatusChip.js";
import { StateView } from "../components/StateView.js";

/** Community Stories page marking oral accounts, interpretations, and demo slots transparently. */
export class StoriesPage extends Page {
  async mount() {
    this.setTitle("Community Stories");
    const grid = document.getElementById("mt-stories-grid");
    if (!grid) return;

    const storyRepo = this.container.resolve("storyRepo");
    const mediaRepo = this.container.resolve("mediaRepo");
    const rightsBadge = this.container.resolve("rightsBadge");

    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const [stories, mediaList] = await Promise.all([storyRepo.list(), mediaRepo.listMedia()]);
      clear(grid);

      for (const st of stories) {
        const plate = st.mediaId ? mediaList.find((m) => m.id === st.mediaId) : null;
        grid.appendChild(
          el(
            "article",
            { id: st.id, class: "mt-tile-editorial" },
            el(
              "div",
              { style: "display:grid; gap:var(--mt-space-3);" },
              plate && plate.technical.file
                ? el("div", { class: "mt-photo-tile" }, el("img", { src: plate.technical.file, alt: plate.technical.altText, loading: "lazy" }))
                : el("div", { class: "mt-tile-stub" }, "Awaiting community story deposit"),
              el("div", { class: "mt-badge-row" }, rightsBadge.render(st), StatusChip.render(st.quality.verification), st.isDemo ? DemoBadge.render() : null),
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, st.title),
              el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, `${st.languages.map((l) => l.communityName).join(", ")} · ${st.place.region}`),
              el("p", { style: "margin:0; font-size:var(--mt-text-sm);" }, st.summary)
            ),
            el(
              "div",
              { class: "mt-tile-foot" },
              el("span", {}, `Reviewed: ${st.quality.updated || "2026-11-26"}`),
              el("a", { href: "contribute.html" }, "Submit a story →")
            )
          )
        );
      }
    } catch (err) {
      clear(grid);
      grid.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load Stories."));
    }
  }
}
