// @ts-check
import { el } from "../utils/dom.js";

/** Renders a clear visual label for demonstration / unverified records. */
export class DemoBadge {
  /**
   * @param {string} [label="Demo content"]
   * @returns {HTMLElement}
   */
  static render(label = "Demo content") {
    return el("span", { class: "mt-chip mt-chip--demo" }, label);
  }
}
