// @ts-check
import { Page } from "../core/Page.js";
import { clear, el, iconCategory } from "../utils/dom.js";
import { pad2 } from "../utils/format.js";

/** Home broadsheet controller hydrating archive stats, hero attribution, 8-script poster, 10-language folio spread, and latest plates. */
export class HomePage extends Page {
  async mount() {
    this.setTitle("Home");
    const dataSource = this.container.resolve("dataSource");
    const langRepo = this.container.resolve("languageRepo");
    const mediaRepo = this.container.resolve("mediaRepo");
    const audioPlayer = this.container.resolve("audioPlayer");
    const rightsBadge = this.container.resolve("rightsBadge");

    const [taxonomy, languages, mediaItems] = await Promise.all([
      dataSource.load("taxonomy"),
      langRepo.list(),
      mediaRepo.listMedia(),
    ]);

    this.mountHeroControls(taxonomy, languages, mediaItems, audioPlayer);
    this.mountPoster(languages, audioPlayer);
    this.mountCategoryChart(taxonomy.categories || []);
    this.mountSpecimenSpread(languages, mediaItems);
    this.mountLatestAdditions(mediaItems, rightsBadge);
  }

  /**
   * @param {Record<string, any>} taxonomy
   * @param {import('../models/Language.js').Language[]} languages
   * @param {import('../models/MediaItem.js').MediaItem[]} mediaItems
   * @param {import('../components/AudioPlayer.js').AudioPlayer} audioPlayer
   */
  mountHeroControls(taxonomy, languages, mediaItems, audioPlayer) {
    const heroAudioHost = document.getElementById("mt-hero-audio-host");
    const bylineEl = document.getElementById("mt-hero-byline");
    const factsEl = document.getElementById("mt-hero-facts");
    const cueEl = document.getElementById("mt-scroll-cue-text");
    const hq = taxonomy.heroQuote || {};

    if (bylineEl && hq.attribution) {
      bylineEl.textContent = hq.attribution;
    }

    if (heroAudioHost) {
      clear(heroAudioHost);
      if (hq.src) {
        heroAudioHost.hidden = false;
        heroAudioHost.append(
          audioPlayer.render({
            id: "hero-mishing",
            title: "Mishing oral history quote",
            src: hq.src,
            durationSec: hq.durationSec || 12,
            compact: true,
            transcript: hq.transcriptNative || undefined,
            translation: hq.transcriptTranslation || undefined,
          })
        );
      } else {
        heroAudioHost.hidden = true;
      }
    }

    if (factsEl) {
      const scripts = new Set();
      languages.forEach((l) => l.scripts.forEach((s) => scripts.add(s)));
      const plateCount = mediaItems.filter((m) => Boolean(m.technical.file)).length;
      clear(factsEl);
      factsEl.append(
        el("li", { class: "hero-stat" }, el("span", { class: "hero-stat-num" }, String(languages.length)), el("span", { class: "hero-stat-label" }, "Languages")),
        el("li", { class: "hero-stat" }, el("span", { class: "hero-stat-num" }, String(scripts.size)), el("span", { class: "hero-stat-label" }, "Scripts")),
        el("li", { class: "hero-stat" }, el("span", { class: "hero-stat-num" }, String(plateCount)), el("span", { class: "hero-stat-label" }, "Photographs & field notes"))
      );
    }

    if (cueEl) {
      const activeWords = languages.filter((l) => l.vocabulary.length > 0).length;
      cueEl.textContent = `Scroll: one word across ${activeWords} languages`;
    }
  }

  /**
   * @param {import('../models/Language.js').Language[]} languages
   * @param {import('../components/AudioPlayer.js').AudioPlayer} _audioPlayer
   */
  mountPoster(languages, _audioPlayer) {
    const rowsEl = document.getElementById("mt-poster-rows");
    const conceptEl = document.getElementById("mt-poster-concept");
    const rotateBtn = document.getElementById("mt-rotate-word");
    if (!rowsEl || !conceptEl) return;

    const concepts = ["water", "home", "song"];
    let conceptIdx = 0;

    const posterLangs = languages.filter((l) => l.vocabulary.length > 0);
    const pendingLangs = languages.filter((l) => l.vocabulary.length === 0);

    const draw = (conceptKey) => {
      conceptEl.textContent = conceptKey;
      clear(rowsEl);

      posterLangs.forEach((lang) => {
        const entry = lang.vocabulary.find((v) => v.meaning.toLowerCase().includes(conceptKey)) || lang.vocabulary[0];
        const profileHref = `language-profile.html?id=${encodeURIComponent(lang.id)}`;
        const li = el(
          "li",
          { class: "mt-poster-row" },
          el(
            "div",
            {},
            el(
              "a",
              { class: "mt-poster-script-link", href: profileHref },
              el("span", { lang: lang.langAttr }, entry.script)
            )
          ),
          el(
            "div",
            { class: "mt-poster-meta" },
            el("span", { class: "mt-poster-lang" }, lang.name),
            el("span", { class: "mt-muted", style: "font-style:italic" }, entry.roman),
            el("span", { class: "mt-muted" }, entry.ipa)
          ),
          el("a", { class: "mt-text-arrow-link", href: profileHref }, "Inspect folio ", el("span", { "aria-hidden": "true" }, "→"))
        );
        rowsEl.appendChild(li);
      });

      pendingLangs.forEach((lang) => {
        const li = el(
          "li",
          { class: "mt-poster-row" },
          el(
            "div",
            {},
            el("a", { href: `language-profile.html?id=${encodeURIComponent(lang.id)}` }, lang.scripts.length ? lang.scriptLabel : "Script under community review")
          ),
          el(
            "div",
            { class: "mt-poster-meta" },
            el("span", { class: "mt-poster-lang" }, lang.name),
            el("span", { class: "mt-muted" }, lang.quality.reviewer || "Awaiting community contribution")
          ),
          el("a", { class: "mt-text-arrow-link", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute ", el("span", { "aria-hidden": "true" }, "→"))
        );
        rowsEl.appendChild(li);
      });
    };

    draw(concepts[0]);
    if (rotateBtn) {
      rotateBtn.addEventListener("click", () => {
        conceptIdx = (conceptIdx + 1) % concepts.length;
        draw(concepts[conceptIdx]);
      });
    }
  }

  /** @param {Array<{ key: string, href: string, icon: string }>} categories */
  mountCategoryChart(categories) {
    const elHost = document.getElementById("mt-category-chart");
    if (!elHost) return;
    clear(elHost);
    for (const c of categories) {
      elHost.appendChild(
        el("a", { class: "mt-glyph-cell", href: c.href }, iconCategory(c.icon), el("span", {}, c.key))
      );
    }
  }

  /**
   * Switchable two-page folio specimen spread across all registry languages.
   * @param {import('../models/Language.js').Language[]} languages
   * @param {import('../models/MediaItem.js').MediaItem[]} mediaItems
   */
  mountSpecimenSpread(languages, mediaItems) {
    const host = document.getElementById("mt-spread-host");
    const pipsEl = document.getElementById("mt-spread-pips");
    const counterEl = document.getElementById("mt-spread-counter");
    const prevBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("mt-spread-prev"));
    const nextBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("mt-spread-next"));
    const statusEl = document.getElementById("mt-spread-status");
    if (!host || !languages.length) return;

    let current = 0;
    let hasRendered = false;

    const renderSpread = (idx, dir = "next") => {
      const targetIdx = Math.max(0, Math.min(languages.length - 1, idx));
      const resolvedDir = dir || (targetIdx >= current ? "next" : "prev");
      current = targetIdx;
      const lang = languages[current];
      const plate = lang.featuredImageId ? mediaItems.find((m) => m.id === lang.featuredImageId) : null;

      clear(host);
      const verso = el(
        "div",
        { class: "mt-book-verso" },
        el(
          "div",
          {},
          el("p", { style: "margin:0 0 var(--mt-space-3); color:var(--mt-paper-muted-always);" }, `Featured Specimen · ${lang.family} · ${lang.region}`),
          lang.nativeName && lang.nativeName !== lang.name
            ? el("div", { class: "mt-giant-glyph", lang: lang.langAttr }, lang.nativeName)
            : el("div", { class: "mt-giant-glyph", style: "font-family:var(--mt-font-display);" }, lang.name.split(" ")[0])
        ),
        lang.writingSystem
          ? el(
              "div",
              { class: "mt-specimen-tiers", lang: lang.langAttr },
              el("div", { class: "mt-tier-display" }, lang.writingSystem.vowels),
              el("div", { class: "mt-tier-text" }, lang.writingSystem.consonants),
              el("div", { style: "font-size:var(--mt-text-xs); color:var(--mt-paper-muted-always);" }, lang.writingSystem.note)
            )
          : el(
              "div",
              { class: "mt-specimen-tiers" },
              el("div", { class: "mt-tier-display" }, "Script specimen under community review"),
              el("div", { style: "font-size:var(--mt-text-xs); color:var(--mt-paper-muted-always);" }, "Awaiting speaker-cleared script tables and community naming confirmation.")
            )
      );

      const rectoTop = el(
        "div",
        { style: "display:grid; gap:var(--mt-space-3);" },
        el("div", { class: "mt-badge-row" }, el("span", { class: "mt-hand-note" }, lang.preferredNameNote || lang.scriptLabel)),
        el("h2", { style: "font-size:var(--mt-text-xl); margin:0;" }, lang.id === "tulu" ? "Tulu and the Tigalari folio tradition" : `${lang.name} — ${lang.scriptLabel}`),
        el("p", { style: "margin:0;" }, lang.overview),
        el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, lang.history)
      );

      if (plate && plate.technical.file) {
        rectoTop.append(
          el("div", { class: "mt-photo-tile", style: "aspect-ratio:16/5;" }, el("img", { src: plate.technical.file, alt: plate.technical.altText, loading: "lazy", decoding: "async" })),
          el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, `${plate.title} · ${plate.rights.attribution}`)
        );
      }

      const recto = el(
        "div",
        { class: "mt-book-recto" },
        rectoTop,
        el(
          "div",
          { class: "mt-cta-row" },
          el("a", { class: "mt-btn", href: `language-profile.html?id=${encodeURIComponent(lang.id)}` }, `Read full ${lang.name} profile`),
          !lang.vocabulary.length ? el("a", { class: "mt-text-arrow-link", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute record ", el("span", { "aria-hidden": "true" }, "→")) : null
        )
      );

      const meta = el(
        "footer",
        { class: "mt-folio-footer", "aria-label": `${lang.name} folio metadata` },
        el("span", {}, `Catalogue MT-S${pad2(current + 1)}`),
        el("span", {}, `Collection: ${lang.family} — ${lang.region}`),
        el("span", {}, `Verification: ${lang.quality.reviewer || "Community review"}`),
        el("span", {}, `Page ${pad2(current + 1)} of ${pad2(languages.length)}`)
      );

      const spreadEl = el("div", {
        class: `mt-book-spread${hasRendered ? ` mt-folio-turn-${resolvedDir}` : ""}`,
      }, verso, recto);
      hasRendered = true;
      host.append(spreadEl, meta);

      if (counterEl) counterEl.textContent = `Folio ${pad2(current + 1)} / ${pad2(languages.length)} · ${lang.name}`;
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === languages.length - 1;
      if (pipsEl) {
        pipsEl.querySelectorAll("button").forEach((b, i) => {
          b.setAttribute("aria-current", i === current ? "true" : "false");
        });
      }
      if (statusEl) statusEl.textContent = `Showing folio ${current + 1} of ${languages.length}: ${lang.name}`;
    };

    if (pipsEl) {
      clear(pipsEl);
      languages.forEach((lang, i) => {
        pipsEl.appendChild(
          el("button", {
            type: "button",
            class: "mt-folio-pip",
            "aria-current": i === 0 ? "true" : "false",
            onClick: () => renderSpread(i, i >= current ? "next" : "prev"),
          }, pad2(i + 1), " ", lang.name.split(" ")[0])
        );
      });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => renderSpread(current - 1, "prev"));
    if (nextBtn) nextBtn.addEventListener("click", () => renderSpread(current + 1, "next"));
    host.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" && current < languages.length - 1) {
        e.preventDefault();
        renderSpread(current + 1, "next");
      } else if (e.key === "ArrowLeft" && current > 0) {
        e.preventDefault();
        renderSpread(current - 1, "prev");
      }
    });

    renderSpread(0, "next");
  }

  /**
   * @param {import('../models/MediaItem.js').MediaItem[]} mediaItems
   * @param {import('../components/RightsBadge.js').RightsBadge} rightsBadge
   */
  mountLatestAdditions(mediaItems, rightsBadge) {
    const grid = document.getElementById("mt-additions-grid");
    if (!grid) return;
    clear(grid);
    const items = mediaItems.filter((m) => m.technical.file).slice(0, 4);

    for (const item of items) {
      const tile = el(
        "article",
        { class: "mt-tile-editorial" },
        el(
          "div",
          { style: "display:grid; gap:var(--mt-space-3);" },
          el("div", { class: "mt-photo-tile" }, el("img", { src: item.technical.file, alt: item.technical.altText, loading: "lazy", decoding: "async" })),
          rightsBadge.render(item),
          el("h3", { style: "font-size:var(--mt-text-md); margin:0;" }, el("a", { href: `gallery.html#${encodeURIComponent(item.id)}`, style: "text-decoration:none;" }, item.title)),
          el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, `${item.collection} · ${item.place.region}`)
        ),
        el(
          "div",
          { class: "mt-tile-foot" },
          el("span", {}, item.time.date || "Archive plate"),
          item.source.url
            ? el("a", { href: item.source.url, target: "_blank", rel: "noopener noreferrer" }, "Licence ↗")
            : el("span", {}, item.rights.licence)
        )
      );
      grid.appendChild(tile);
    }
  }
}
