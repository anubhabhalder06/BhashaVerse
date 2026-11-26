// @ts-check
import { el } from "../utils/dom.js";

/** Renders explicit loading, empty, or error archival states safely. */
export class StateView {
  /**
   * @param {string} [message="Loading records…"]
   * @returns {HTMLElement}
   */
  static loading(message = "Loading archive records…") {
    return el("div", { class: "mt-state-box", role: "status", "aria-live": "polite" }, el("p", { style: "margin:0" }, message));
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
