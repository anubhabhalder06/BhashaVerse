// @ts-check
import { el } from "../utils/dom.js";
import { DemoBadge } from "./DemoBadge.js";

/** Renders a monochrome language specimen card with bookmark button and profile link. */
export class LanguageCard {
  /**
   * @param {{
   *   rightsBadge: import('./RightsBadge.js').RightsBadge,
   *   bookmarkService: import('../services/BookmarkService.js').BookmarkService,
   * }} deps
   */
  constructor(deps) {
    this.rightsBadge = deps.rightsBadge;
    this.bookmarkService = deps.bookmarkService;
  }

  /**
   * @param {import('../models/Language.js').Language} lang
   * @returns {HTMLElement}
   */
  render(lang) {
    const profileHref = `language-profile.html?id=${encodeURIComponent(lang.id)}`;
    const isSaved = this.bookmarkService.has(lang.id);
    const saveBtn = el("button", {
      type: "button",
      class: "mt-bookmark-btn",
      "aria-pressed": isSaved ? "true" : "false",
      "aria-label": isSaved ? `Remove ${lang.name} from saved items` : `Save ${lang.name}`,
      onClick: () => {
        const saved = this.bookmarkService.toggle({
          id: lang.id,
          type: "Language",
          title: lang.name,
          href: profileHref,
        });
        saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        saveBtn.setAttribute("aria-label", saved ? `Remove ${lang.name} from saved items` : `Save ${lang.name}`);
        saveBtn.textContent = saved ? "Saved" : "Save";
      },
    }, isSaved ? "Saved" : "Save");

    const topMeta = el(
      "div",
      { class: "mt-card-top" },
      el("div", { class: "mt-badge-row" }, this.rightsBadge.render(lang), lang.isDemo ? DemoBadge.render() : null),
      el("span", { class: "mt-muted", style: "font-size: var(--mt-text-xs)" }, lang.region)
    );

    const scriptStage = lang.nativeName && lang.nativeName !== lang.name
      ? el(
          "div",
          { class: "mt-lang-script-stage" },
          el("span", { class: "mt-lang-script-hero", lang: lang.langAttr }, lang.nativeName)
        )
      : el(
          "div",
          { class: "mt-lang-script-stage" },
          el("div", { class: "mt-script-stub-box" }, lang.scripts.length ? lang.scriptLabel : "Script to be verified")
        );

    const resText = lang.resources.length ? lang.resources.join(" · ") : "Open for contribution";

    const footer = el(
      "div",
      { class: "mt-lang-footer" },
      el("a", { class: "mt-text-arrow-link", href: profileHref }, `Explore ${lang.name} `, el("span", { "aria-hidden": "true" }, "→")),
      saveBtn
    );

    return el(
      "article",
      { class: "mt-lang-card" },
      el(
        "div",
        {},
        topMeta,
        scriptStage,
        el("h2", { style: "font-size: clamp(1.35rem, 2.2vw, 1.65rem); margin: 0 0 var(--mt-space-1);" }, el("a", { href: profileHref, style: "text-decoration:none" }, lang.name)),
        el("p", { class: "mt-lang-family-line" }, `${lang.family} · ${lang.scriptLabel}`),
        el("p", { class: "mt-lang-family-line" }, `Resources: ${resText}`),
        el("p", { class: "mt-lang-desc" }, lang.overview)
      ),
      footer
    );
  }
}
