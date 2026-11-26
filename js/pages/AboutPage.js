// @ts-check
import { Page } from "../core/Page.js";
import { BRAND } from "../config/brand.js";
import { clear, el } from "../utils/dom.js";

/** About page hydrating approved Matrika naming etymology, pronunciation, and wordmark demonstration note. */
export class AboutPage extends Page {
  async mount() {
    this.setTitle("About");
    const meaningEl = document.getElementById("mt-about-meaning");
    const wordmarkNoteEl = document.getElementById("mt-about-wordmark-note");
    if (meaningEl) {
      clear(meaningEl);
      meaningEl.append(
        el("strong", {}, `${BRAND.name} (${BRAND.nativeName})`),
        ` — pronounced ${BRAND.pronunciation} — comes from Sanskrit mātṛkā, “little mother”. In the Sanskrit grammatical tradition, the letters of the alphabet are the “mothers” of all speech. It also reads as “mother tongue”.`
      );
    }
    if (wordmarkNoteEl) {
      wordmarkNoteEl.textContent = "Wordmark renderings marked as demonstration are transliterations pending review by native readers.";
    }
  }
}
