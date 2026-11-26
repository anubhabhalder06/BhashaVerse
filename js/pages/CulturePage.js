// @ts-check
import { Page } from "../core/Page.js";
import { clear, el } from "../utils/dom.js";
import { DemoBadge } from "../components/DemoBadge.js";
import { StatusChip } from "../components/StatusChip.js";
import { StateView } from "../components/StateView.js";

/** Culture & Traditions listing page distinguishing verified craft heritage from authorised/demo frameworks. */
export class CulturePage extends Page {
  async mount() {
    this.setTitle("Culture & Traditions");
    const grid = document.getElementById("mt-culture-grid");
    if (!grid) return;

    const dataSource = this.container.resolve("dataSource");
    const mediaRepo = this.container.resolve("mediaRepo");
    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const [items, mediaList] = await Promise.all([dataSource.load("culture"), mediaRepo.listMedia()]);
      clear(grid);

      for (const item of items) {
        const plate = mediaList.find((m) => m.id === item.mediaId);
        grid.appendChild(
          el(
            "article",
            { class: "mt-tile-editorial" },
            el(
              "div",
              { style: "display:grid; gap:var(--mt-space-3);" },
              plate && plate.technical.file
                ? el("div", { class: "mt-photo-tile" }, el("img", { src: plate.technical.file, alt: plate.technical.altText, loading: "lazy" }))
                : null,
              el("div", { class: "mt-badge-row" }, StatusChip.render(item.verification), item.isDemo ? DemoBadge.render() : null),
              el("span", { class: "mt-muted", style: "font-size:var(--mt-text-xs)" }, item.category),
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, item.title),
              el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, item.summary)
            ),
            el(
              "div",
              { class: "mt-tile-foot" },
              el("span", {}, `Reviewed: ${item.reviewedOn || "2026-11-26"}`),
              el("a", { href: "contribute.html" }, "Share context →")
            )
          )
        );
      }
    } catch (err) {
      clear(grid);
      grid.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load Culture records."));
    }
  }
}
