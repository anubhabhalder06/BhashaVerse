// @ts-check
import { BRAND } from "../config/brand.js";
import { FOOTER_COLUMNS } from "../config/routes.js";
import { clear, el } from "../utils/dom.js";

/** Light-DOM shared footer component using BRAND and centralised footer columns. */
export class MatrikaFooter extends HTMLElement {
  hydrate() {
    clear(this);
    this.className = "mt-footer-wrap";

    const notice = el(
      "p",
      { class: "mt-quiet-notice", role: "note" },
      "Sample records, quotes and audio on this site are placeholders pending community verification."
    );

    const navCols = el("nav", { class: "mt-footer-cols", "aria-label": "Footer navigation" });
    for (const col of FOOTER_COLUMNS) {
      const ul = el("ul");
      for (const link of col.links) {
        ul.appendChild(el("li", {}, el("a", { href: link.href }, link.label)));
      }
      navCols.appendChild(el("div", { class: "mt-footer-col" }, el("h2", {}, col.heading), ul));
    }

    const colophon = el(
      "p",
      { class: "mt-footer-colophon" },
      `${BRAND.name} (${BRAND.nativeName}) · ${BRAND.descriptor}`
    );

    this.append(notice, navCols, colophon);
  }
}
