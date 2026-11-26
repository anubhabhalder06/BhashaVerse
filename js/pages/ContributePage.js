// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear } from "../utils/dom.js";
import { ContributionForm } from "../components/ContributionForm.js";

/** Contribute page mounting accessible Consent-first ContributionForm and language prefill. */
export class ContributePage extends Page {
  async mount() {
    this.setTitle("Contribute");
    const host = document.getElementById("mt-contribute-host");
    if (!host) return;

    const store = this.container.resolve("contributionStore");
    const langRepo = this.container.resolve("languageRepo");
    const preLangId = UrlHelper.getId("lang", "id");

    let initialLanguage = preLangId;
    if (preLangId) {
      try {
        const lang = await langRepo.getById(preLangId);
        if (lang) initialLanguage = lang.name;
      } catch (_) {}
    }

    const form = new ContributionForm({ store, initialLanguage });
    clear(host);
    host.appendChild(form.render());
  }
}
