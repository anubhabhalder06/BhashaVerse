// @ts-check
import { el, pictureEl } from "../utils/dom.js";

/**
 * Renders monochrome rounded photograph with optional vertical native-script label.
 */
export class MediaFigure {
  /**
   * @param {{
   *   rightsBadge: import('./RightsBadge.js').RightsBadge,
   * }} deps
   */
  constructor(deps) {
    this.rightsBadge = deps.rightsBadge;
  }

  /**
   * @param {import('../models/MediaItem.js').MediaItem} item
   * @param {{ showMetadata?: boolean }} [opts]
   * @returns {HTMLElement}
   */
  render(item, opts = {}) {
    const frameChildren = [];
    if (item.technical.file) {
      const dims = item.technical.dimensions || {};
      frameChildren.push(
        el(
          "div",
          { class: "mt-photo-tile" },
          pictureEl(item.technical.file, item.technical.altText, {
            width: dims.width,
            height: dims.height,
            sizes: "(max-width: 768px) 100vw, 33vw",
            loading: "lazy",
            decoding: "async",
          })
        )
      );
    } else {
      frameChildren.push(
        el(
          "div",
          { class: "mt-tile-stub", style: "flex:1 1 auto" },
          el("strong", {}, "Photograph awaiting permission clearance"),
          el("span", {}, item.technical.altText)
        )
      );
    }

    if (item.verticalLabel && item.verticalLabel.text) {
      frameChildren.push(
        el(
          "span",
          {
            class: "mt-vertical-tag",
            lang: item.verticalLabel.lang,
            "aria-hidden": "true",
          },
          item.verticalLabel.text
        )
      );
    }

    const frame = el("div", { class: "mt-photo-frame" }, frameChildren);
    const creditParts = [item.title, item.rights.attribution || (item.creators[0]?.name || ""), `(${item.rights.licence || "Record"})`];
    if (item.verticalLabel?.captionText) {
      creditParts.push(`Label: ${item.verticalLabel.captionText}`);
    }

    const fig = el("figure", { id: item.id, style: "margin:0; display:grid; gap:var(--mt-space-2);" }, frame);

    if (opts.showMetadata) {
      fig.appendChild(
        el(
          "div",
          { class: "mt-badge-row" },
          this.rightsBadge.render(item)
        )
      );
      fig.appendChild(el("h2", { style: "font-size: var(--mt-text-md); margin:0;" }, item.title));
      fig.appendChild(el("p", { style: "margin:0; font-size: var(--mt-text-sm);" }, item.description.caption || item.summary));
      fig.appendChild(
        el(
          "figcaption",
          { class: "mt-photo-caption" },
          `${item.place.region} · ${item.time.date || ""} · Consent: ${item.rights.consent} · `,
          item.source.url
            ? el("a", { href: item.source.url, target: "_blank", rel: "noopener noreferrer" }, `${item.rights.attribution} (Source)`)
            : item.rights.attribution
        )
      );
      if (item.verticalLabel?.captionText) {
        fig.appendChild(el("p", { class: "mt-photo-caption" }, `Script label: ${item.verticalLabel.captionText}`));
      }
    } else {
      fig.appendChild(el("figcaption", { class: "mt-photo-caption" }, creditParts.filter(Boolean).join(" · ")));
    }

    return fig;
  }
}
