// @ts-check
import { Page } from "../core/Page.js";
import { clear, el } from "../utils/dom.js";

/** Controller for policy pages and accessible client-only Contact / Report correction form. */
export class StaticPage extends Page {
  /**
   * @param {import('../core/Container.js').Container} container
   * @param {string} title
   */
  constructor(container, title) {
    super(container);
    this.pageTitle = title;
  }

  async mount() {
    this.setTitle(this.pageTitle);
    const contactForm = /** @type {HTMLFormElement | null} */ (document.getElementById("mt-contact-form"));
    if (!contactForm) return;

    const statusBanner = contactForm.querySelector(".form-status");
    const summary = el("div", { class: "mt-error-summary", role: "alert", tabindex: "-1", hidden: true });
    contactForm.prepend(summary);

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameIn = /** @type {HTMLInputElement} */ (contactForm.querySelector('[name="name"]'));
      const emailIn = /** @type {HTMLInputElement} */ (contactForm.querySelector('[name="email"]'));
      const msgIn = /** @type {HTMLTextAreaElement} */ (contactForm.querySelector('[name="msg"]'));

      const errs = [];
      if (!nameIn?.value.trim()) errs.push({ id: nameIn.id, msg: "Enter your name." });
      if (!emailIn?.value.trim() || !emailIn.value.includes("@")) errs.push({ id: emailIn.id, msg: "Enter a valid email address." });
      if (!msgIn?.value.trim()) errs.push({ id: msgIn.id, msg: "Enter a correction message or report." });

      clear(summary);
      if (errs.length) {
        summary.hidden = false;
        if (statusBanner) /** @type {HTMLElement} */ (statusBanner).hidden = true;
        const ul = el("ul");
        for (const err of errs) ul.appendChild(el("li", {}, el("a", { href: `#${err.id}` }, err.msg)));
        summary.append(el("strong", {}, "Please check the highlighted fields:"), ul);
        summary.focus();
        return;
      }

      summary.hidden = true;
      if (statusBanner) /** @type {HTMLElement} */ (statusBanner).hidden = false;
      contactForm.reset();
    });
  }
}
