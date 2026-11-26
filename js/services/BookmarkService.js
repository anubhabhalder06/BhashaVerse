// @ts-check

const BOOKMARK_KEY = "matrika:bookmarks";

/** Client-only bookmarks persisted in matrika:bookmarks localStorage key. */
export class BookmarkService {
  /** @param {import('../utils/storage.js').SafeStorage} storage */
  constructor(storage) {
    this.storage = storage;
  }

  /** @returns {Array<{ id: string, type: string, title: string, href: string }>} */
  list() {
    return this.storage.getJson(BOOKMARK_KEY, []);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this.list().some((b) => b.id === id);
  }

  /**
   * Toggle bookmark record and return new saved boolean.
   * @param {{ id: string, type: string, title: string, href: string }} item
   * @returns {boolean}
   */
  toggle(item) {
    const items = this.list();
    const exists = items.some((b) => b.id === item.id);
    const next = exists
      ? items.filter((b) => b.id !== item.id)
      : [{ id: item.id, type: item.type, title: item.title, href: item.href }, ...items];
    this.storage.setJson(BOOKMARK_KEY, next);
    return !exists;
  }
}
