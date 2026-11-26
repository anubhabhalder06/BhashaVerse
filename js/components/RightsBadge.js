// @ts-check
import { el } from "../utils/dom.js";

/** Renders a rights status chip and optional plain-language explanation from RightsPolicy. */
export class RightsBadge {
  /**
   * @param {import('../services/RightsPolicy.js').RightsPolicy} rightsPolicy
   */
  constructor(rightsPolicy) {
    this.rightsPolicy = rightsPolicy;
  }

  /**
   * @param {Record<string, any>} record
   * @param {boolean} [withExplanation=false]
   * @returns {HTMLElement}
   */
  render(record, withExplanation = false) {
    const res = this.rightsPolicy.evaluate(record);
    const wrap = el("div", { class: "mt-badge-row" }, el("span", { class: "mt-chip" }, res.label));
    if (withExplanation) {
      wrap.appendChild(el("p", { class: "mt-rights-explain" }, res.explanation));
    }
    return wrap;
  }
}
