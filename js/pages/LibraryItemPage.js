// @ts-check
import { Page } from "../core/Page.js";
import { UrlHelper } from "../core/Url.js";
import { clear, el } from "../utils/dom.js";
import { Breadcrumbs } from "../components/Breadcrumbs.js";
import { DemoBadge } from "../components/DemoBadge.js";
import { StatusChip } from "../components/StatusChip.js";
import { StateView } from "../components/StateView.js";

/** Digital Library item detail controller strictly gated by RightsPolicy. */
export class LibraryItemPage extends Page {
  async mount() {
    const root = document.getElementById("mt-lib-item-root");
    const crumbHost = document.getElementById("mt-breadcrumbs-host");
    if (!root) return;

    clear(root);
    root.appendChild(StateView.loading("Loading archival item…", "detail"));

    const id = UrlHelper.getId("id") || "res-sora-palm-leaf-01";
    const resourceRepo = this.container.resolve("resourceRepo");
    const rightsPolicy = this.container.resolve("rightsPolicy");
    const rightsBadge = this.container.resolve("rightsBadge");
    const bookmarkService = this.container.resolve("bookmarkService");

    try {
      const item = await resourceRepo.getById(id);
      if (!item) {
        this.setTitle("Record Not Found");
        clear(root);
        root.append(
          el("h1", { class: "mt-page-title", style: "margin-bottom:var(--mt-space-4);" }, "Library Record Not Found"),
          StateView.empty(`No library item matches "${id}".`, "Return to Digital Library", "library.html")
        );
        return;
      }

      this.setTitle(item.title);
      if (crumbHost) {
        clear(crumbHost);
        crumbHost.appendChild(Breadcrumbs.render([{ label: "Home", href: "index.html" }, { label: "Library", href: "library.html" }, { label: item.title }]));
      }

      const policy = rightsPolicy.evaluate(item);
      const previewEl = policy.canPreview && item.technical.file
        ? el("div", { class: "mt-photo-tile", style: "aspect-ratio:16/10;" }, el("img", { src: item.technical.file, alt: item.technical.altText }))
        : el(
            "div",
            { class: "mt-state-box mt-state-box--empty", style: "min-height:18rem; align-content:center;" },
            el("strong", {}, policy.label),
            el("p", { style: "margin:0" }, policy.explanation)
          );

      const isSaved = bookmarkService.has(item.id);
      const saveBtn = el("button", {
        type: "button",
        class: "mt-bookmark-btn",
        "aria-pressed": isSaved ? "true" : "false",
        onClick: () => {
          const saved = bookmarkService.toggle({
            id: item.id,
            type: item.category || "Library",
            title: item.title,
            href: `library-item.html?id=${encodeURIComponent(item.id)}`,
          });
          saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
          saveBtn.textContent = saved ? "Saved" : "Save";
        },
      }, isSaved ? "Saved" : "Save");

      const actionRow = el("div", { class: "mt-cta-row" });
      if (policy.canDownload && item.technical.file) {
        actionRow.appendChild(el("a", { class: "mt-btn mt-btn--solid", href: item.technical.file, download: true }, `Download (${policy.label})`));
      } else {
        actionRow.appendChild(el("span", { class: "mt-chip" }, "No downloadable file"));
      }
      if (item.source.url) {
        actionRow.appendChild(el("a", { class: "mt-text-arrow-link", href: item.source.url, target: "_blank", rel: "noopener noreferrer" }, "Source record ", el("span", { "aria-hidden": "true" }, "→")));
      }
      actionRow.appendChild(saveBtn);

      const lang = item.languages[0];
      const dl = el(
        "dl",
        { class: "mt-meta-dl" },
        el("dt", {}, "Record ID"), el("dd", {}, item.id),
        el("dt", {}, "Language"), el("dd", {}, lang ? el("a", { href: `language-profile.html?id=${encodeURIComponent(lang.id)}` }, lang.communityName) : "Archive"),
        el("dt", {}, "Category"), el("dd", {}, item.category),
        el("dt", {}, "Creator(s)"), el("dd", {}, item.creators.map((c) => `${c.name} (${c.role})`).join(", ")),
        el("dt", {}, "Source"), el("dd", {}, item.source.institution || "Community archive"),
        el("dt", {}, "Citation"), el("dd", {}, item.source.citation || "Pending citation"),
        el("dt", {}, "Rights & access"), el("dd", {}, `${policy.label} · consent: ${item.rights.consent}`),
        el("dt", {}, "Last reviewed"), el("dd", {}, item.quality.updated || "2026-11-26")
      );

      clear(root);
      root.appendChild(
        el(
          "div",
          { class: "mt-detail-split" },
          el("div", { style: "display:grid; gap:var(--mt-space-4);" }, previewEl, actionRow),
          el(
            "div",
            { style: "display:grid; gap:var(--mt-space-4);" },
            el("div", { class: "mt-badge-row" }, StatusChip.render(item.quality.verification), item.isDemo ? DemoBadge.render() : null),
            rightsBadge.render(item, true),
            el("h1", { class: "mt-page-title", style: "font-size:var(--mt-text-xl);" }, item.title),
            el("p", { style: "margin:0;" }, item.summary),
            dl,
            el("p", { style: "margin:0;" }, el("a", { href: "contact.html" }, "Report a correction or takedown request"))
          )
        )
      );
    } catch (err) {
      clear(root);
      root.appendChild(StateView.error(err instanceof Error ? err.message : "Could not load record."));
    }
  }
}
