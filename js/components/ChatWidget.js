// @ts-check
import { BRAND } from "../config/brand.js";
import { clear, el } from "../utils/dom.js";

/**
 * Accessible scripted chatbot dialog widget:
 * square "Ask Matrika" launcher button, honesty banner, keyboard focus management,
 * suggested chips, and SearchService result cards.
 */
export class ChatWidget {
  /**
   * @param {{
   *   engine: import('../chat/ChatEngine.js').ChatEngine,
   *   session: import('../chat/ChatSession.js').ChatSession,
   *   knowledgeBase: import('../chat/KnowledgeBase.js').KnowledgeBase,
   * }} deps
   */
  constructor(deps) {
    this.engine = deps.engine;
    this.session = deps.session;
    this.knowledgeBase = deps.knowledgeBase;
    this.isOpen = false;
    /** @type {HTMLButtonElement | null} */
    this.launcher = null;
    /** @type {HTMLElement | null} */
    this.panel = null;
    /** @type {HTMLElement | null} */
    this.listEl = null;
    /** @type {HTMLInputElement | null} */
    this.inputEl = null;
  }

  /** @param {HTMLElement} host */
  async mount(host) {
    clear(host);
    host.className = "mt-chat-root";

    let chips = ["Find a language", "How do I contribute?", "What does public domain mean here?", "Which records can I download?"];
    try {
      const kb = await this.knowledgeBase.load();
      if (Array.isArray(kb.suggestedChips) && kb.suggestedChips.length) chips = kb.suggestedChips;
    } catch (_) {}

    const launcher = /** @type {HTMLButtonElement} */ (
      el("button", {
        type: "button",
        class: "mt-chat-launcher",
        "aria-expanded": "false",
        "aria-haspopup": "dialog",
        onClick: () => (this.isOpen ? this.close() : this.open()),
      }, `Ask ${BRAND.name}`)
    );
    this.launcher = launcher;

    const closeBtn = el("button", {
      type: "button",
      class: "mt-chat-close",
      "aria-label": `Close ${BRAND.name} Assistant`,
      onClick: () => this.close(),
    }, "×");

    const listEl = el("div", {
      class: "mt-chat-messages",
      "aria-live": "polite",
      "aria-label": "Conversation messages",
    });
    this.listEl = listEl;

    const chipsWrap = el("div", { class: "mt-chat-chips", "aria-label": "Suggested questions" });
    for (const c of chips) {
      chipsWrap.appendChild(
        el("button", {
          type: "button",
          class: "mt-chat-chip",
          onClick: () => this.sendQuery(c),
        }, c)
      );
    }

    const inputEl = /** @type {HTMLInputElement} */ (
      el("input", {
        type: "text",
        placeholder: `Ask ${BRAND.name}…`,
        "aria-label": `Message ${BRAND.name} Assistant`,
      })
    );
    this.inputEl = inputEl;

    const form = el(
      "form",
      {
        class: "mt-chat-form",
        onSubmit: (/** @type {Event} */ e) => {
          e.preventDefault();
          this.sendQuery(inputEl.value);
          inputEl.value = "";
        },
      },
      inputEl,
      el("button", { type: "submit" }, "Send")
    );

    const panel = el(
      "section",
      {
        class: "mt-chat-panel",
        role: "dialog",
        "aria-modal": "false",
        "aria-labelledby": "mt-chat-title",
        hidden: true,
      },
      el("div", { class: "mt-chat-head" }, el("h2", { id: "mt-chat-title" }, `${BRAND.name} Assistant`), closeBtn),
      el("p", { class: "mt-chat-honesty" }, "Prototype — scripted answers, no AI model connected."),
      listEl,
      chipsWrap,
      form
    );
    this.panel = panel;

    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    });

    this.renderMessages();
    host.append(launcher, panel);
  }

  open() {
    if (!this.panel || !this.launcher) return;
    this.isOpen = true;
    this.panel.hidden = false;
    this.launcher.setAttribute("aria-expanded", "true");
    if (this.inputEl) this.inputEl.focus();
  }

  close() {
    if (!this.panel || !this.launcher) return;
    this.isOpen = false;
    this.panel.hidden = true;
    this.launcher.setAttribute("aria-expanded", "false");
    this.launcher.focus();
  }

  /** @param {string} rawText */
  async sendQuery(rawText) {
    const q = String(rawText || "").trim();
    if (!q) return;
    this.session.addUser(q);
    this.renderMessages();
    const res = await this.engine.reply(q, {});
    this.session.addAssistant(res);
    this.renderMessages();
  }

  renderMessages() {
    if (!this.listEl) return;
    clear(this.listEl);
    for (const msg of this.session.messages) {
      const isBot = msg.role === "assistant";
      const card = el(
        "div",
        { class: `mt-chat-msg ${isBot ? "mt-chat-msg--bot" : "mt-chat-msg--user"}` },
        el("span", { class: "mt-chat-msg-role" }, isBot ? `${BRAND.name} Assistant` : "You"),
        el("span", {}, msg.text)
      );

      if (msg.results && msg.results.length) {
        const resWrap = el("div", { class: "mt-chat-msg-links" });
        for (const r of msg.results) {
          resWrap.appendChild(
            el("a", { href: r.href, style: "font-weight:600; display:block;" }, `${r.title} `, el("span", { class: "mt-muted", style: "font-weight:400" }, `(${r.subtitle})`))
          );
        }
        card.appendChild(resWrap);
      }

      if (msg.links && msg.links.length) {
        const linksWrap = el("div", { class: "mt-chat-msg-links" });
        for (const l of msg.links) {
          linksWrap.appendChild(el("a", { href: l.href, class: "mt-text-arrow-link", style: "min-height: 28px;" }, `${l.label} `, el("span", { "aria-hidden": "true" }, "→")));
        }
        card.appendChild(linksWrap);
      }

      this.listEl.appendChild(card);
    }
    this.listEl.scrollTop = this.listEl.scrollHeight;
  }
}
