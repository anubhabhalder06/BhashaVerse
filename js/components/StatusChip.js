// @ts-check
import { el } from "../utils/dom.js";
import { VERIFICATION_STATUS } from "../models/enums.js";

const LABELS = Object.freeze({
  [VERIFICATION_STATUS.VERIFIED]: "Verified reference",
  [VERIFICATION_STATUS.ORAL_ACCOUNT]: "Oral account",
  [VERIFICATION_STATUS.INTERPRETATION]: "Interpretation",
  [VERIFICATION_STATUS.UNVERIFIED]: "Awaiting community verification",
  [VERIFICATION_STATUS.COMMUNITY_REVIEW]: "Community review",
});

/** Renders non-colour-dependent verification status text badge. */
export class StatusChip {
  /**
   * @param {string} status
   * @returns {HTMLElement}
   */
  static render(status) {
    const label = LABELS[status] || "Pending verification";
    return el("span", { class: "mt-chip mt-chip--status" }, label);
  }
}
