// @ts-check

/** Loads scripted intents and response templates from data/chat/knowledge.json. */
export class KnowledgeBase {
  /** @param {import('../data/DataSource.js').DataSource} dataSource */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /** @returns {Promise<Record<string, any>>} */
  async load() {
    return this.dataSource.load("chat/knowledge");
  }
}
