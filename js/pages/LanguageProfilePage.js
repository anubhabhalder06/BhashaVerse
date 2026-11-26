// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { Breadcrumbs } from "../components/Breadcrumbs.js";
import { DemoBadge } from "../components/DemoBadge.js";
import { StatusChip } from "../components/StatusChip.js";
import { StateView } from "../components/StateView.js";

/** Language Profile detail controller supporting ?id=<id> and legacy ?lang=<id>. */
export class LanguageProfilePage extends Page {
  async mount() {
    const root = document.getElementById("mt-profile-root");
    const crumbHost = document.getElementById("mt-breadcrumbs-host");
    if (!root) return;

    clear(root);
    root.appendChild(StateView.loading());

    const langId = UrlHelper.getId("id", "lang") || "tulu";
    const langRepo = this.container.resolve("languageRepo");
    const resourceRepo = this.container.resolve("resourceRepo");
    const mediaRepo = this.container.resolve("mediaRepo");
    const storyRepo = this.container.resolve("storyRepo");
    const rightsBadge = this.container.resolve("rightsBadge");
    const bookmarkService = this.container.resolve("bookmarkService");
    const audioPlayer = this.container.resolve("audioPlayer");

    try {
      const lang = await langRepo.getById(langId);
      if (!lang) {
        this.setTitle("Language Not Found");
        if (crumbHost) {
          clear(crumbHost);
          crumbHost.appendChild(Breadcrumbs.render([{ label: "Home", href: "index.html" }, { label: "Languages", href: "languages.html" }, { label: "Not found" }]));
        }
        clear(root);
        root.append(
          el("h1", { class: "mt-page-title", style: "margin-bottom:var(--mt-space-4);" }, "Language Profile Not Found"),
          StateView.empty(`No language profile matches "${langId}".`, "Browse all languages", "languages.html")
        );
        return;
      }

      this.setTitle(`${lang.name} · Profile`);
      if (crumbHost) {
        clear(crumbHost);
        crumbHost.appendChild(Breadcrumbs.render([{ label: "Home", href: "index.html" }, { label: "Languages", href: "languages.html" }, { label: lang.name }]));
      }

      const [resources, mediaList, audioList, stories] = await Promise.all([
        resourceRepo.findByLanguage(lang.id),
        mediaRepo.findMediaByLanguage(lang.id),
        mediaRepo.findAudioByLanguage(lang.id),
        storyRepo.findByLanguage(lang.id),
      ]);

      const isSaved = bookmarkService.has(lang.id);
      const saveBtn = el("button", {
        type: "button",
        class: "mt-bookmark-btn",
        "aria-pressed": isSaved ? "true" : "false",
        onClick: () => {
          const saved = bookmarkService.toggle({
            id: lang.id,
            type: "Language",
            title: lang.name,
            href: `language-profile.html?id=${encodeURIComponent(lang.id)}`,
          });
          saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
          saveBtn.textContent = saved ? "Saved" : "Save profile";
        },
      }, isSaved ? "Saved" : "Save profile");

      const hero = el(
        "div",
        { class: "mt-profile-hero" },
        el(
          "div",
          { style: "display:grid; gap:var(--mt-space-3); align-content:start;" },
          el("div", { class: "mt-badge-row" }, rightsBadge.render(lang), StatusChip.render(lang.quality.verification), lang.isDemo ? DemoBadge.render() : null),
          el("h1", { class: "mt-page-title" }, lang.name),
          el("span", { class: "mt-hand-note" }, lang.preferredNameNote || lang.region),
          el("p", { style: "margin:0; max-width:56ch;" }, lang.overview),
          el(
            "div",
            { class: "mt-cta-row" },
            saveBtn,
            el("a", { class: "mt-btn", href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute record or correction")
          )
        ),
        el(
          "div",
          { class: "mt-vellum-stage" },
          lang.nativeName && lang.nativeName !== lang.name
            ? el("div", { class: "mt-vellum-backdrop", lang: lang.langAttr }, lang.nativeName)
            : el("div", { class: "mt-script-stub-box" }, "Script specimen awaiting community confirmation"),
          el("p", { style: "margin:0; font-weight:600;" }, `${lang.name} · ${lang.scriptLabel}`),
          el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-sm);" }, `${lang.family} · ${lang.region}`),
          lang.altNames.length ? el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, `Alternate names: ${lang.altNames.join(", ")}`) : null
        )
      );

      const onPageNav = el(
        "nav",
        { class: "mt-onpage-strip", "aria-label": "Profile sections" },
        el("a", { href: "#p-names" }, "Names"),
        el("a", { href: "#p-geo" }, "Geography & classification"),
        el("a", { href: "#p-script" }, "Writing system"),
        el("a", { href: "#p-vocab" }, "Vocabulary"),
        el("a", { href: "#p-records" }, "Related records"),
        el("a", { href: "#p-sources" }, "References & review")
      );

      const vocabTable = el("table");
      vocabTable.append(
        el("thead", {}, el("tr", {}, el("th", {}, "Script"), el("th", {}, "Roman"), el("th", {}, "IPA"), el("th", {}, "Meaning"), el("th", {}, "Audio"))),
        el(
          "tbody",
          {},
          lang.vocabulary.length
            ? lang.vocabulary.map((v, i) =>
                el(
                  "tr",
                  {},
                  el("td", { style: "font-family:var(--mt-font-indic); font-size:1.45rem;", lang: lang.langAttr }, v.script),
                  el("td", {}, el("strong", {}, v.roman)),
                  el("td", { class: "mt-muted" }, v.ipa),
                  el("td", {}, v.meaning, v.isDemo ? el("span", { class: "mt-muted", style: "display:block; font-size:var(--mt-text-xs);" }, v.context) : null),
                  el(
                    "td",
                    {},
                    audioPlayer.render({
                      id: `prof-${lang.id}-${i}`,
                      title: `${lang.name} ${v.roman}`,
                      src: null,
                      durationSec: 4,
                      isMock: true,
                      compact: true,
                    })
                  )
                )
              )
            : el(
                "tr",
                {},
                el("td", { colspan: "5" }, "Lexical records awaiting community submission. ", el("a", { href: `contribute.html?lang=${encodeURIComponent(lang.id)}` }, "Contribute verified words →"))
              )
        )
      );

      const refList = el("ul", { style: "margin:0; padding-left:1.25rem; display:grid; gap:var(--mt-space-2);" });
      for (const ref of lang.quality.references) {
        refList.appendChild(
          el("li", {}, el("a", { href: ref.url, target: "_blank", rel: "noopener noreferrer" }, ref.source), el("span", { class: "mt-muted" }, ` (verified ${ref.verifiedOn})`))
        );
      }
      if (!lang.quality.references.length) {
        refList.appendChild(el("li", {}, "External bibliographic verification pending."));
      }

      const relGrid = el(
        "div",
        { class: "mt-card-grid-2" },
        el(
          "div",
          { class: "mt-tile-editorial" },
          el("h3", { style: "margin:0;" }, `Library entries (${resources.length})`),
          resources.length
            ? el("ul", { style: "margin:0; padding-left:1.2rem;" }, resources.map((r) => el("li", {}, el("a", { href: `library-item.html?id=${encodeURIComponent(r.id)}` }, r.title))))
            : el("p", { class: "mt-muted", style: "margin:0;" }, `No library entries yet for ${lang.name}.`)
        ),
        el(
          "div",
          { class: "mt-tile-editorial" },
          el("h3", { style: "margin:0;" }, `Photos, Audio & Stories (${mediaList.length + audioList.length + stories.length})`),
          el(
            "ul",
            { style: "margin:0; padding-left:1.2rem;" },
            ...mediaList.map((m) => el("li", {}, el("a", { href: `gallery.html#${encodeURIComponent(m.id)}` }, `Photo: ${m.title}`))),
            ...audioList.map((a) => el("li", {}, el("a", { href: `audio.html#${encodeURIComponent(a.id)}` }, `Audio: ${a.title}`))),
            ...stories.map((s) => el("li", {}, el("a", { href: `stories.html#${encodeURIComponent(s.id)}` }, `Story: ${s.title}`)))
          )
        )
      );

      const body = el(
        "div",
        { class: "mt-profile-sections" },
        el(
          "section",
          { id: "p-names", class: "mt-profile-block" },
          el("h2", {}, "Names & community context"),
          el("p", { style: "margin:0; max-width:65ch;" }, el("strong", {}, "Preferred terminology: "), lang.preferredNameNote),
          el("p", { class: "mt-muted", style: "margin:0; max-width:65ch;" }, lang.history, " (Overview pending review by speakers.)")
        ),
        el(
          "section",
          { id: "p-geo", class: "mt-profile-block" },
          el("h2", {}, "Geographic distribution & classification"),
          el("p", { style: "margin:0;" }, el("strong", {}, "Family: "), `${lang.family} (${lang.familyDetail}) · `, el("strong", {}, "ISO 639-3: "), lang.iso639_3 || "Pending"),
          el("p", { style: "margin:0;" }, el("strong", {}, "Approximate region: "), lang.place.region, " · ", el("a", { href: `map.html?lang=${encodeURIComponent(lang.id)}` }, "View on Language Map →")),
          el("p", { class: "mt-muted", style: "margin:0; font-size:var(--mt-text-xs);" }, "Geographic indicators are approximate state or district placements only.")
        ),
        el(
          "section",
          { id: "p-script", class: "mt-profile-block" },
          el("h2", {}, "Writing system"),
          lang.writingSystem
            ? el(
                "div",
                { class: "mt-book-verso", style: "max-width:46rem;" },
                el("div", { class: "mt-tier-display", lang: lang.langAttr }, lang.writingSystem.vowels),
                el("div", { class: "mt-tier-text", lang: lang.langAttr }, lang.writingSystem.consonants),
                el("p", { style: "margin:0; font-size:var(--mt-text-xs); color:var(--mt-paper-muted-always);" }, lang.writingSystem.note)
              )
            : el("div", { class: "mt-state-box mt-state-box--empty" }, `Writing system specimen for ${lang.name} is awaiting community verification.`)
        ),
        el("section", { id: "p-vocab", class: "mt-profile-block" }, el("h2", {}, "Vocabulary specimen"), vocabTable),
        el("section", { id: "p-records", class: "mt-profile-block" }, el("h2", {}, "Literature, media & stories"), relGrid),
        el(
          "section",
          { id: "p-sources", class: "mt-profile-block" },
          el("h2", {}, "Sources & review status"),
          refList,
          el(
            "footer",
            { class: "mt-folio-footer" },
            el("span", {}, `Review status: ${lang.quality.reviewer || "Pending"}`),
            el("span", {}, `Last updated: ${lang.quality.updated || "2026-11-26"}`),
            el("a", { href: "contact.html" }, "Report a correction")
          )
        )
      );

      clear(root);
      root.append(hero, onPageNav, body);
    } catch (err) {
      clear(root);
      root.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load language profile."));
    }
  }
}
