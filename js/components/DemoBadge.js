// @ts-check
import { el } from "../utils/dom.js";

/** Renders a clear monochrome dashed demonstration badge per archive honesty guidelines. */
export class DemoBadge {
  /**
   * @param {string} [label="Demo content"]
   * @returns {HTMLElement}
   */
  static render(label = "Demo content") {
    return el("span", { class: "mt-chip mt-demo-badge" }, label);
  }
}
