// @ts-check
import { clear, el } from "../utils/dom.js";

/**
 * Consent-first contribution form with fieldset/legend grouping,
 * aria-describedby hints, inline errors, accessible error summary,
 * and localStorage demonstration store persistence.
 */
export class ContributionForm {
  /**
   * @param {{
   *   store: import('../data/ContributionStore.js').ContributionStore,
   *   initialLanguage?: string,
   * }} deps
   */
  constructor(deps) {
    this.store = deps.store;
    this.initialLanguage = deps.initialLanguage || "";
  }

  /** @returns {HTMLElement} */
  render() {
    const wrapper = el("div", { style: "display:grid; gap:var(--mt-space-5);" });

    wrapper.appendChild(
      el(
        "p",
        { class: "mt-status-banner", role: "note" },
        el("strong", {}, "Demonstration only. "),
        "Nothing you enter here is sent anywhere. Submissions stay inside this browser for the Review 1 admin mockup."
      )
    );

    const summaryBox = el("div", { class: "mt-error-summary", role: "alert", tabindex: "-1", hidden: true });
    const statusBox = el("div", { class: "mt-status-banner", role: "status", "aria-live": "polite", hidden: true });
    const form = /** @type {HTMLFormElement} */ (el("form", { class: "mt-form-editorial", novalidate: true }));

    /** @type {Array<{ id: string, input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, errorEl: HTMLElement, validate: () => string }>} */
    const validators = [];

    /**
     * @param {string} id
     * @param {string} labelText
     * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} control
     * @param {string} hintText
     * @param {() => string} validate
     */
    const makeField = (id, labelText, control, hintText, validate) => {
      const hintId = `${id}-hint`;
      const errId = `${id}-err`;
      control.id = id;
      control.setAttribute("aria-describedby", `${hintId} ${errId}`);
      const errEl = el("p", { id: errId, class: "mt-field-error", hidden: true });
      const field = el(
        "div",
        { class: "mt-field" },
        el("label", { for: id }, labelText),
        control,
        hintText ? el("p", { id: hintId, class: "mt-field-hint" }, hintText) : el("span", { id: hintId, class: "sr-only" }),
        errEl
      );
      validators.push({ id, input: control, errorEl: errEl, validate });
      return field;
    };

    const typeSel = /** @type {HTMLSelectElement} */ (el("select", { class: "mt-select", name: "type" }));
    ["", "Text or story", "Photograph", "Video", "Audio", "Document", "Correction"].forEach((opt) => {
      typeSel.appendChild(el("option", { value: opt }, opt || "Select contribution type"));
    });

    const titleIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "title", type: "text" }));
    const descIn = /** @type {HTMLTextAreaElement} */ (el("textarea", { class: "mt-textarea", name: "desc" }));
    const langIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "language", type: "text", value: this.initialLanguage, placeholder: "e.g. Tulu, Santali, Lepcha, Koda (Kora)" }));
    const regionIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "region", type: "text", placeholder: "State or district level only" }));
    const topicIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "topic", type: "text" }));
    const nameIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "contributorName", type: "text" }));
    const anonCheck = /** @type {HTMLInputElement} */ (el("input", { id: "mt-c-anon", type: "checkbox", name: "anonymous" }));
    const contactIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "contact", type: "text", placeholder: "Email or community contact handle" }));
    const creatorIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "creator", type: "text" }));
    const dateIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "dateNote", type: "text", placeholder: "e.g. c. 1995 or 2026-11" }));
    const fileIn = /** @type {HTMLInputElement} */ (el("input", { class: "mt-input", name: "file", type: "file" }));

    const rightsCheck = /** @type {HTMLInputElement} */ (el("input", { id: "mt-c-rights", type: "checkbox", name: "rights" }));
    const consentCheck = /** @type {HTMLInputElement} */ (el("input", { id: "mt-c-consent", type: "checkbox", name: "consent" }));
    const restrictedCheck = /** @type {HTMLInputElement} */ (el("input", { id: "mt-c-restricted", type: "checkbox", name: "restricted" }));
    const rightsErr = el("p", { id: "mt-c-rights-err", class: "mt-field-error", hidden: true });
    const consentErr = el("p", { id: "mt-c-consent-err", class: "mt-field-error", hidden: true });

    const fsRecord = el(
      "fieldset",
      { class: "mt-fieldset" },
      el("legend", {}, "1. Material details"),
      makeField("mt-c-type", "Type of contribution (required)", typeSel, "Choose the closest format or correction category.", () => (typeSel.value ? "" : "Select a contribution type.")),
      makeField("mt-c-title", "Title (required)", titleIn, "Short descriptive title for the archive catalogue.", () => (titleIn.value.trim() ? "" : "Enter a title.")),
      makeField("mt-c-desc", "Description, caption, or lexical meaning (required)", descIn, "Include context, preferred language names, or correction notes.", () => (descIn.value.trim() ? "" : "Enter a description or correction note.")),
      makeField("mt-c-lang", "Related language or community (required)", langIn, "Use community-preferred spelling where known.", () => (langIn.value.trim() ? "" : "Specify the related language.")),
      makeField("mt-c-region", "Approximate region (state or district)", regionIn, "Never share exact village coordinates or sensitive locations.", () => ""),
      makeField("mt-c-topic", "Topic or collection", topicIn, "Optional topic tag (e.g. handloom, oral memory, primer).", () => "")
    );

    const fsSource = el(
      "fieldset",
      { class: "mt-fieldset" },
      el("legend", {}, "2. Attribution & file metadata"),
      makeField("mt-c-name", "Contributor name", nameIn, "Optional if publishing anonymously.", () => ""),
      el("label", { class: "mt-form-check", for: "mt-c-anon" }, anonCheck, "Publish credit anonymously (approved option)"),
      makeField("mt-c-contact", "Contact method for reviewer follow-up (required)", contactIn, "Stored only in your browser for this demo; required for moderation follow-up.", () => (contactIn.value.trim() ? "" : "Provide a contact email or method.")),
      makeField("mt-c-creator", "Original creator, speaker, or source", creatorIn, "Credit the photographer, speaker, or manuscript holder.", () => ""),
      makeField("mt-c-date", "Approximate date or period", dateIn, "Approximate year or decade if exact date is unknown.", () => ""),
      makeField("mt-c-file", "Attachment metadata preview (optional)", fileIn, "Guidance: open formats (.jpg, .webp, .wav, .mp3, .pdf) up to 25 MB. File contents are never uploaded or stored.", () => "")
    );

    const fsRights = el(
      "fieldset",
      { class: "mt-fieldset" },
      el("legend", {}, "3. Rights & consent declarations"),
      el("label", { class: "mt-form-check", for: "mt-c-rights" }, rightsCheck, "I hold permission to submit this material (rights declaration, required)."),
      rightsErr,
      el("label", { class: "mt-form-check", for: "mt-c-consent" }, consentCheck, "I consent to archival review, metadata storage, and display under the stated access tier (required)."),
      consentErr,
      el("label", { class: "mt-form-check", for: "mt-c-restricted" }, restrictedCheck, "Request restricted access or contact me before any public display.")
    );

    validators.push(
      { id: "mt-c-rights", input: rightsCheck, errorEl: rightsErr, validate: () => (rightsCheck.checked ? "" : "Confirm the rights declaration before submitting.") },
      { id: "mt-c-consent", input: consentCheck, errorEl: consentErr, validate: () => (consentCheck.checked ? "" : "Confirm consent before submitting.") }
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const errors = [];
      for (const v of validators) {
        const msg = v.validate();
        v.errorEl.textContent = msg;
        v.errorEl.hidden = !msg;
        if (msg) {
          v.input.setAttribute("aria-invalid", "true");
          errors.push({ id: v.id, msg });
        } else {
          v.input.removeAttribute("aria-invalid");
        }
      }

      clear(summaryBox);
      if (errors.length) {
        summaryBox.hidden = false;
        statusBox.hidden = true;
        const ul = el("ul");
        for (const err of errors) {
          ul.appendChild(el("li", {}, el("a", { href: `#${err.id}` }, err.msg)));
        }
        summaryBox.append(el("strong", {}, `Please review ${errors.length} required ${errors.length === 1 ? "item" : "items"}:`), ul);
        summaryBox.focus();
        return;
      }

      summaryBox.hidden = true;
      const chosenFile = fileIn.files && fileIn.files[0];
      const saved = this.store.add({
        type: typeSel.value,
        title: titleIn.value.trim(),
        description: descIn.value.trim(),
        language: langIn.value.trim(),
        region: regionIn.value.trim(),
        topic: topicIn.value.trim(),
        contributorName: nameIn.value.trim(),
        anonymous: anonCheck.checked,
        contact: contactIn.value.trim(),
        creator: creatorIn.value.trim(),
        dateNote: dateIn.value.trim(),
        fileName: chosenFile ? chosenFile.name : "",
        fileSize: chosenFile ? chosenFile.size : 0,
        rightsConfirmed: rightsCheck.checked,
        consentConfirmed: consentCheck.checked,
        restrictedRequest: restrictedCheck.checked,
      });

      clear(statusBox);
      statusBox.hidden = false;
      statusBox.append(
        el("strong", {}, "Demo submission recorded as pending. "),
        `Reference ${saved.id} ("${saved.title}") enters moderation as pending and is never published automatically. Reviewers check accuracy, rights, consent, and cultural safety. `,
        el("a", { href: "admin.html" }, "Inspect local Admin queue mockup →")
      );
      form.reset();
    });

    form.append(summaryBox, fsRecord, fsSource, fsRights, el("div", {}, el("button", { type: "submit", class: "mt-btn mt-btn--solid" }, "Submit for review")), statusBox);
    wrapper.appendChild(form);
    return wrapper;
  }
}
