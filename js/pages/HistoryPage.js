// @ts-check
import { Page } from "../core/Page.js";
import { clear, el, pictureEl } from "../utils/dom.js";
import { StatusChip } from "../components/StatusChip.js";
import { StateView } from "../components/StateView.js";

/** History & Heritage page displaying verified historical frames vs oral accounts and a chronological timeline. */
export class HistoryPage extends Page {
  async mount() {
    this.setTitle("History & Heritage");
    const grid = document.getElementById("mt-history-grid");
    const timelineEl = document.getElementById("mt-history-timeline");
    if (!grid) return;

    const dataSource = this.container.resolve("dataSource");
    const mediaRepo = this.container.resolve("mediaRepo");
    clear(grid);
    grid.appendChild(StateView.loading());

    try {
      const [hist, mediaList] = await Promise.all([dataSource.load("history"), mediaRepo.listMedia()]);
      clear(grid);

      for (const entry of hist.entries || []) {
        const plate = mediaList.find((m) => m.id === entry.mediaId);
        grid.appendChild(
          el(
            "article",
            { class: "mt-tile-editorial" },
            el(
              "div",
              { style: "display:grid; gap:var(--mt-space-3);" },
              plate && plate.technical.file
                ? el(
                    "div",
                    { class: "mt-photo-tile" },
                    pictureEl(plate.technical.file, plate.technical.altText, {
                      sizes: "(max-width: 768px) 100vw, 33vw",
                      loading: "lazy",
                      decoding: "async",
                    })
                  )
                : null,
              el("div", { class: "mt-badge-row" }, StatusChip.render(entry.verification)),
              el("span", { class: "mt-muted", style: "font-size:var(--mt-text-xs)" }, entry.category),
              el("h2", { style: "font-size:var(--mt-text-md); margin:0;" }, entry.title),
              el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, entry.summary)
            ),
            el(
              "div",
              { class: "mt-tile-foot" },
              el("span", {}, `Last reviewed: ${entry.reviewedOn || "2026-11-26"}`),
              el("a", { href: "contact.html" }, "Cite / Correct")
            )
          )
        );
      }

      if (timelineEl) {
        clear(timelineEl);
        for (const item of hist.timeline || []) {
          timelineEl.appendChild(
            el(
              "li",
              { class: "mt-timeline-item" },
              el("div", { class: "mt-badge-row" }, el("strong", {}, item.year), StatusChip.render(item.verification)),
              el("strong", {}, item.title),
              el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, item.note)
            )
          );
        }
      }
    } catch {
      clear(grid);
      grid.appendChild(StateView.error("Couldn't load History & Heritage records. Try again.", () => this.mount()));
    }
  }
}
