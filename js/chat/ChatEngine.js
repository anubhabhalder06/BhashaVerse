// @ts-check

/** Abstract chat engine boundary (allows swapping ScriptedChatEngine with a model backend later). */
export class ChatEngine {
  /**
   * @param {string} _message
   * @param {Record<string, unknown>} [_context]
   * @returns {Promise<{ reply: string, links: Array<{ label: string, href: string }>, results?: Array<{ title: string, subtitle: string, href: string }> }>}
   */
  async reply(_message, _context = {}) {
    throw new Error("ChatEngine.reply() must be implemented by subclasses");
  }
}
