// @ts-check
import { BRAND } from "../config/brand.js";

/** Ephemeral in-memory message history for the open page only (never persisted). */
export class ChatSession {
  constructor() {
    /** @type {Array<{ role: "assistant" | "user", text: string, links?: Array<{ label: string, href: string }>, results?: Array<{ title: string, subtitle: string, href: string }> }>} */
    this.messages = [
      {
        role: "assistant",
        text: `Welcome to ${BRAND.name} Assistant. Ask me to find a language, navigate the archive, or explain rights, consent, and contributions.`,
      },
    ];
  }

  /** @param {string} text */
  addUser(text) {
    this.messages.push({ role: "user", text });
  }

  /** @param {{ reply: string, links?: Array<{ label: string, href: string }>, results?: Array<{ title: string, subtitle: string, href: string }> }} res */
  addAssistant(res) {
    this.messages.push({
      role: "assistant",
      text: res.reply,
      links: res.links || [],
      results: res.results || [],
    });
  }
}
