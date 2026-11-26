// @ts-check

/** Abstract contribution store interface (swap boundary for backend submission API). */
export class ContributionStore {
  /** @returns {import('../models/Contribution.js').Contribution[]} */
  list() {
    throw new Error("Not implemented");
  }

  /**
   * @param {Record<string, any>} _payload
   * @returns {import('../models/Contribution.js').Contribution}
   */
  add(_payload) {
    throw new Error("Not implemented");
  }

  /**
   * @param {string} _id
   * @param {string} _status
   * @returns {import('../models/Contribution.js').Contribution | null}
   */
  updateStatus(_id, _status) {
    throw new Error("Not implemented");
  }
}
