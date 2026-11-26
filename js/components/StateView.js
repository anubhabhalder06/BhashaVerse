// @ts-check
import { el } from "../utils/dom.js";

/** Renders explicit archival skeleton loading, empty, or error states safely. */
export class StateView {
  /**
   * @param {string} [message="Loading archive records…"]
   * @param {"cards" | "rows" | "detail"} [variant="cards"]
   * @returns {HTMLElement}
   */
  static loading(message = "Loading archive records…", variant = "cards") {
    const wrap = el("div", {
      class: "mt-state-box mt-skeleton-wrap",
      role: "status",
      "aria-live": "polite",
    });

    const header = el(
      "div",
      { class: "mt-skeleton-head" },
      el("span", { class: "mt-skeleton-dot", "aria-hidden": "true" }),
      el("p", { style: "margin:0;" }, message)
    );
    wrap.appendChild(header);

    if (variant === "rows") {
      const list = el("div", { class: "mt-skeleton-rows", "aria-hidden": "true" });
      for (let i = 0; i < 4; i++) {
        list.appendChild(
          el(
            "div",
            { class: "mt-skeleton-row" },
            el("span", { class: "mt-skeleton-line mt-skeleton-line--title" }),
            el("span", { class: "mt-skeleton-line mt-skeleton-line--short" })
          )
        );
      }
      wrap.appendChild(list);
    } else if (variant === "detail") {
      wrap.appendChild(
        el(
          "div",
          { class: "mt-skeleton-detail", "aria-hidden": "true" },
          el("div", { class: "mt-skeleton-block" }),
          el("span", { class: "mt-skeleton-line mt-skeleton-line--title" }),
          el("span", { class: "mt-skeleton-line" }),
          el("span", { class: "mt-skeleton-line mt-skeleton-line--short" })
        )
      );
    } else {
      const count = 3;
      const grid = el("div", { class: "mt-skeleton-grid", "aria-hidden": "true" });
      for (let i = 0; i < count; i++) {
        grid.appendChild(
          el(
            "div",
            { class: "mt-skeleton-card" },
            el("span", { class: "mt-skeleton-line mt-skeleton-line--chip" }),
            el("span", { class: "mt-skeleton-line mt-skeleton-line--title" }),
            el("span", { class: "mt-skeleton-line" }),
            el("span", { class: "mt-skeleton-line mt-skeleton-line--short" })
          )
        );
      }
      wrap.appendChild(grid);
    }

    return wrap;
  }

  /**
   * @param {string} message
   * @param {string} [actionLabel]
   * @param {string} [actionHref]
   * @returns {HTMLElement}
   */
  static empty(message, actionLabel, actionHref) {
    const box = el("div", { class: "mt-state-box mt-state-box--empty" }, el("p", { style: "margin:0" }, message));
    if (actionLabel && actionHref) {
      box.appendChild(el("a", { class: "mt-btn", href: actionHref }, actionLabel));
    }
    return box;
  }

  /**
   * @param {string} message
   * @returns {HTMLElement}
   */
  static error(message) {
    return el(
      "div",
      { class: "mt-state-box", role: "alert" },
      el("strong", {}, "Could not load records"),
      el("p", { style: "margin:0" }, message)
    );
  }
}
