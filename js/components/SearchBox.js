// @ts-check
import { el } from "../utils/dom.js";

/** Accessible global header search form (44px min height, explicit label). */
export class SearchBox {
  /**
   * @param {string} [initialQuery=""]
   * @returns {HTMLFormElement}
   */
  static render(initialQuery = "") {
    const id = "mt-global-q";
    return /** @type {HTMLFormElement} */ (
      el(
        "form",
        { class: "site-search", role: "search", action: "search.html" },
        el("label", { for: id, class: "sr-only" }, "Search the archive"),
        el("input", {
          id,
          name: "q",
          type: "search",
          value: initialQuery,
          placeholder: "Search records",
          autocomplete: "off",
        }),
        el("button", { type: "submit" }, "Go")
      )
    );
  }
}
