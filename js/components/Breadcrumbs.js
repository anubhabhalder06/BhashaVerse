// @ts-check
import { el } from "../utils/dom.js";

/** Accessible breadcrumb navigation for inner pages. */
export class Breadcrumbs {
  /**
   * @param {Array<{ label: string, href?: string }>} items
   * @returns {HTMLElement}
   */
  static render(items) {
    const ol = el("ol");
    items.forEach((item, idx) => {
      const isLast = idx === items.length - 1;
      if (isLast || !item.href) {
        ol.appendChild(el("li", { "aria-current": isLast ? "page" : undefined }, item.label));
      } else {
        ol.appendChild(el("li", {}, el("a", { href: item.href }, item.label)));
      }
    });
    return el("nav", { class: "mt-breadcrumbs", "aria-label": "Breadcrumb" }, ol);
  }
}
