// @ts-check
import { Page } from "../core/Page.js";
import { DemoBadge } from "../components/DemoBadge.js";
import { clear, el, iconCategory, pictureEl } from "../utils/dom.js";
import { pad2 } from "../utils/format.js";

/** Home broadsheet controller hydrating data-derived stats, honest mock audio player, 8-script poster, 6-option index, folio spread, and plates. */
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
    this.mountPoster(languages);
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
    const quoteDemoHost = document.getElementById("mt-hero-demo-host");
    const bylineEl = document.getElementById("mt-hero-byline");
    const factsEl = document.getElementById("mt-hero-facts");
    const cueEl = document.getElementById("mt-scroll-cue-text");
    const hq = taxonomy.heroQuote || {};

    if (quoteDemoHost) {
      clear(quoteDemoHost);
      if (hq.isDemo !== false) {
        quoteDemoHost.appendChild(DemoBadge.render("Demo content"));
      }
    }

    if (bylineEl && hq.attribution) {
      bylineEl.textContent = hq.attribution;
    }

    if (heroAudioHost) {
      clear(heroAudioHost);
      heroAudioHost.hidden = false;
      heroAudioHost.append(
        audioPlayer.render({
          id: hq.id || "hero-mishing",
          title: "Mishing oral-tradition demonstration",
          src: hq.src || null,
          durationSec: hq.durationSec || 0,
          attribution: hq.attribution || "Demo content",
          transcript: hq.src ? hq.transcript || null : null,
        })
      );
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

  /** @param {import('../models/Language.js').Language[]} languages */
  mountPoster(languages) {
    const posterSec = document.getElementById("s-poster");
    const rowsEl = document.getElementById("mt-poster-rows");
    const conceptEl = document.getElementById("mt-poster-concept");
    const rotateBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("mt-rotate-word"));
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
            el("span", { class: "mt-muted" }, lang.quality.reviewer || "Community review in progress")
          ),
          el("a", { class: "mt-text-arrow-link", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute ", el("span", { "aria-hidden": "true" }, "→"))
        );
        rowsEl.appendChild(li);
      });
    };

    const swapConcept = (nextIdx) => {
      conceptIdx = (nextIdx + concepts.length) % concepts.length;
      draw(concepts[conceptIdx]);
    };

    draw(concepts[0]);

    if (rotateBtn) {
      rotateBtn.addEventListener("click", () => swapConcept(conceptIdx + 1));
    }

    if (posterSec) {
      posterSec.addEventListener("keydown", (e) => {
        if (e.target instanceof Element && e.target.closest("#mt-rotate-word")) {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            swapConcept(conceptIdx + 1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            swapConcept(conceptIdx - 1);
          }
        }
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
   * Switchable fixed-height two-page folio specimen spread across all registry languages.
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

    const renderSpread = (idx) => {
      current = Math.max(0, Math.min(languages.length - 1, idx));
      const lang = languages[current];
      const plate = lang.featuredImageId ? mediaItems.find((m) => m.id === lang.featuredImageId) : null;

      clear(host);
      const displayGlyph =
        lang.nativeName && lang.nativeName !== lang.name ? lang.nativeName : lang.name.split(" ")[0];
      const isCompact = !lang.nativeName || lang.nativeName === lang.name || displayGlyph.length > 7;
      const glyphEl =
        lang.nativeName && lang.nativeName !== lang.name
          ? el("div", { class: `mt-giant-glyph${isCompact ? " mt-giant-glyph--compact" : ""}`, lang: lang.langAttr }, displayGlyph)
          : el(
              "div",
              { class: `mt-giant-glyph${isCompact ? " mt-giant-glyph--compact" : ""}`, style: "font-family:var(--mt-font-display);" },
              displayGlyph
            );

      const verso = el(
        "div",
        { class: "mt-book-verso" },
        el("p", { class: "mt-verso-eyebrow" }, `Featured Specimen · ${lang.family} · ${lang.region}`),
        el("div", { class: "mt-verso-glyph-stage" }, glyphEl),
        lang.writingSystem
          ? el(
              "div",
              { class: "mt-specimen-tiers", lang: lang.langAttr },
              el("div", { class: "mt-tier-display" }, lang.writingSystem.vowels),
              el("div", { class: "mt-tier-text" }, lang.writingSystem.consonants),
              el("div", { class: "mt-tier-note" }, lang.writingSystem.note)
            )
          : el(
              "div",
              { class: "mt-specimen-tiers" },
              el("div", { class: "mt-tier-display" }, "Script specimen under community review"),
              el("div", { class: "mt-tier-note" }, "Awaiting speaker-cleared script tables and community naming confirmation.")
            )
      );

      const rectoFigure =
        plate && plate.technical.file
          ? el(
              "figure",
              { class: "mt-recto-figure" },
              el(
                "div",
                { class: "mt-recto-media" },
                pictureEl(plate.technical.file, plate.technical.altText, {
                  sizes: "(max-width: 900px) 100vw, 44vw",
                  loading: "lazy",
                  decoding: "async",
                })
              ),
              el("figcaption", { class: "mt-muted", style: "font-size:var(--mt-text-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" }, `${plate.title} · ${plate.rights.attribution}`)
            )
          : el("div", { class: "mt-recto-figure" }, el("div", { class: "mt-recto-stub" }, "Field photography under community clearance — lexical records open below"));

      const recto = el(
        "div",
        { class: "mt-book-recto" },
        el("div", { class: "mt-badge-row" }, el("span", { class: "mt-hand-note" }, lang.preferredNameNote || lang.scriptLabel)),
        el("h2", { class: "mt-recto-title" }, lang.id === "tulu" ? "Tulu and the Tigalari folio tradition" : `${lang.name} — ${lang.scriptLabel}`),
        el("p", { class: "mt-recto-overview" }, lang.overview),
        el("p", { class: "mt-recto-history" }, lang.history),
        rectoFigure,
        el(
          "div",
          { class: "mt-recto-cta mt-cta-row" },
          el("a", { class: "mt-btn", href: `language-profile.html?id=${encodeURIComponent(lang.id)}` }, `Read full ${lang.name} profile`),
          !lang.vocabulary.length
            ? el("a", { class: "mt-text-arrow-link", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute record ", el("span", { "aria-hidden": "true" }, "→"))
            : null
        )
      );

      const meta = el(
        "footer",
        { class: "mt-folio-footer", "aria-label": `${lang.name} folio metadata` },
        el("span", {}, `Catalogue MT-S${pad2(current + 1)}`),
        el("span", {}, `Collection: ${lang.family} — ${lang.region}`),
        el("span", {}, `Verification: ${lang.quality.reviewer || "Community review in progress"}`),
        el("span", {}, `Page ${pad2(current + 1)} of ${pad2(languages.length)}`)
      );

      const spreadEl = el("div", { class: "mt-book-spread" }, verso, recto);
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
          el(
            "button",
            {
              type: "button",
              class: "mt-folio-pip",
              "aria-current": i === 0 ? "true" : "false",
              onClick: () => renderSpread(i),
            },
            pad2(i + 1),
            " ",
            lang.name.split(" ")[0]
          )
        );
      });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => renderSpread(current - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => renderSpread(current + 1));
    host.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" && current < languages.length - 1) {
        e.preventDefault();
        renderSpread(current + 1);
      } else if (e.key === "ArrowLeft" && current > 0) {
        e.preventDefault();
        renderSpread(current - 1);
      }
    });

    let swipeX = 0;
    let swipeY = 0;
    host.addEventListener("pointerdown", (e) => {
      swipeX = e.clientX;
      swipeY = e.clientY;
    }, { passive: true });
    host.addEventListener("pointerup", (e) => {
      const dx = e.clientX - swipeX;
      const dy = e.clientY - swipeY;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      if (dx < 0 && current < languages.length - 1) renderSpread(current + 1);
      else if (dx > 0 && current > 0) renderSpread(current - 1);
    }, { passive: true });

    renderSpread(0);
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
      const dims = item.technical.dimensions || {};
      const tile = el(
        "article",
        { class: "mt-tile-editorial" },
        el(
          "div",
          { style: "display:grid; gap:var(--mt-space-3);" },
          el(
            "div",
            { class: "mt-photo-tile" },
            pictureEl(item.technical.file, item.technical.altText, {
              width: dims.width,
              height: dims.height,
              sizes: "(max-width: 608px) 100vw, (max-width: 1088px) 50vw, 25vw",
              loading: "lazy",
              decoding: "async",
            })
          ),
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
