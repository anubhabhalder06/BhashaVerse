// @ts-check
import { el } from "../utils/dom.js";
import { StatusChip } from "./StatusChip.js";

/** Renders a Digital Library record tile using RightsBadge and BookmarkService. */
export class ResourceCard {
  /**
   * @param {{
   *   rightsBadge: import('./RightsBadge.js').RightsBadge,
   *   bookmarkService: import('../services/BookmarkService.js').BookmarkService,
   * }} deps
   */
  constructor(deps) {
    this.rightsBadge = deps.rightsBadge;
    this.bookmarkService = deps.bookmarkService;
  }

  /**
   * @param {import('../models/Resource.js').Resource} item
   * @returns {HTMLElement}
   */
  render(item) {
    const href = `library-item.html?id=${encodeURIComponent(item.id)}`;
    const isSaved = this.bookmarkService.has(item.id);
    const saveBtn = el("button", {
      type: "button",
      class: "mt-bookmark-btn",
      "aria-pressed": isSaved ? "true" : "false",
      "aria-label": isSaved ? `Remove ${item.title} from saved items` : `Save ${item.title}`,
      onClick: () => {
        const saved = this.bookmarkService.toggle({
          id: item.id,
          type: item.category || "Library",
          title: item.title,
          href,
        });
        saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        saveBtn.textContent = saved ? "Saved" : "Save";
      },
    }, isSaved ? "Saved" : "Save");

    const media = item.technical.file
      ? el("div", { class: "mt-photo-tile" }, el("img", { src: item.technical.file, alt: item.technical.altText, loading: "lazy", decoding: "async" }))
      : el("div", { class: "mt-tile-stub" }, `${item.technical.format || "Record"} · ${item.rights.licence || "Metadata only"}`);

    const langNames = item.languages.map((l) => l.communityName).join(", ");
    const badges = el(
      "div",
      { class: "mt-badge-row" },
      this.rightsBadge.render(item),
      StatusChip.render(item.quality.verification)
    );

    return el(
      "article",
      { class: "mt-tile-editorial" },
      el(
        "div",
        { style: "display:grid; gap:var(--mt-space-3);" },
        media,
        badges,
        el("h2", { style: "font-size: var(--mt-text-md); margin:0;" }, el("a", { href, style: "text-decoration:none" }, item.title)),
        el("p", { class: "mt-muted", style: "margin:0; font-size: var(--mt-text-xs);" }, `${item.category} · ${langNames} · ${item.technical.format || "Record"}`),
        el("p", { style: "margin:0; font-size: var(--mt-text-sm);" }, item.summary)
      ),
      el(
        "div",
        { class: "mt-tile-foot" },
        el("a", { class: "mt-text-arrow-link", href }, "Inspect record ", el("span", { "aria-hidden": "true" }, "→")),
        saveBtn
      )
    );
  }
}
