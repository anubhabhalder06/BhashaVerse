// @ts-check
import { ContributionStore } from "./ContributionStore.js";
import { Contribution } from "../models/Contribution.js";
import { CONTRIBUTION_STATUS } from "../models/enums.js";

const STORAGE_KEY = "matrika:contributions";

/** Browser-only localStorage contribution store for Review 1 demonstration. */
export class LocalContributionStore extends ContributionStore {
  /** @param {import('../utils/storage.js').SafeStorage} storage */
  constructor(storage) {
    super();
    this.storage = storage;
  }

  /** @returns {Contribution[]} */
  list() {
    const saved = /** @type {Record<string, any>[]} */ (this.storage.getJson(STORAGE_KEY, []));
    return saved.map((row) => new Contribution(row));
  }

  /**
   * Save a new demonstration submission with forced initial "pending" status.
   * @param {Record<string, any>} payload
   * @returns {Contribution}
   */
  add(payload) {
    const entry = new Contribution({
      ...payload,
      status: CONTRIBUTION_STATUS.PENDING,
    });
    const next = [entry, ...this.list()].slice(0, 25);
    this.storage.setJson(STORAGE_KEY, next);
    return entry;
  }

  /**
   * Update review status in the local admin mockup store.
   * @param {string} id
   * @param {string} status
   * @returns {Contribution | null}
   */
  updateStatus(id, status) {
    const rows = this.list();
    let updated = null;
    const next = rows.map((row) => {
      if (row.id !== id) return row;
      updated = new Contribution({ ...row, status });
      return updated;
    });
    this.storage.setJson(STORAGE_KEY, next);
    return updated;
  }
}
