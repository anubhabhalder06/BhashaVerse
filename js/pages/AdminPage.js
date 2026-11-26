// @ts-check
import { Page } from "../core/Page.js";
import { CONTRIBUTION_STATUS } from "../models/enums.js";
import { clear, el } from "../utils/dom.js";

const ARCHIVE_QUEUE_ROWS = [
  { id: "queue-row-01", title: "Koda wordlist inquiry", type: "Correction / Text", language: "Koda (Kora)", status: CONTRIBUTION_STATUS.PENDING, readonlyEntry: true },
  { id: "queue-row-02", title: "Mishing loom glossary notes", type: "Document", language: "Mishing", status: CONTRIBUTION_STATUS.NEEDS_CLARIFICATION, readonlyEntry: true },
];

/** Editorial Review Queue reading LocalContributionStore with status controls and role overview. */
export class AdminPage extends Page {
  async mount() {
    this.setTitle("Editorial Review Queue");
    const tbody = document.getElementById("mt-admin-rows");
    const statusEl = document.getElementById("mt-admin-status");
    const statsEl = document.getElementById("mt-admin-overview");
    if (!tbody) return;

    const store = this.container.resolve("contributionStore");
    const langRepo = this.container.resolve("languageRepo");
    const statuses = Object.values(CONTRIBUTION_STATUS);

    const draw = () => {
      const localRows = store.list().map((s) => ({
        id: s.id,
        title: `${s.title}${s.fileName ? ` (${s.fileName})` : ""}`,
        type: s.type,
        language: s.language || "Unspecified",
        status: s.status,
        readonlyEntry: false,
      }));
      const rows = [...localRows, ...ARCHIVE_QUEUE_ROWS];

      clear(tbody);
      for (const row of rows) {
        const statusCell = el("td", {}, el("span", { class: "mt-chip mt-chip--status" }, row.status));
        const actionsCell = el("td", {}, el("div", { class: "mt-admin-actions" }));
        const actionsWrap = /** @type {HTMLElement} */ (actionsCell.firstChild);

        for (const st of statuses) {
          actionsWrap.appendChild(
            el("button", {
              type: "button",
              onClick: () => {
                if (!row.readonlyEntry) {
                  store.updateStatus(row.id, st);
                } else {
                  row.status = st;
                }
                if (statusEl) statusEl.textContent = `Updated "${row.title}" status to: ${st}`;
                draw();
              },
            }, st)
          );
        }

        tbody.appendChild(
          el("tr", {}, el("td", {}, row.title), el("td", {}, row.type), el("td", {}, row.language), statusCell, actionsCell)
        );
      }
    };

    if (statsEl) {
      try {
        const langs = await langRepo.list();
        const featured = langs.filter((l) => l.featured).map((l) => l.name).join(", ");
        statsEl.textContent = `Registry overview: ${langs.length} language entries · Featured in directory: ${featured} · Roles: Administrator, Editor / Reviewer, Contributor`;
      } catch (_) {}
    }

    draw();
  }
}
