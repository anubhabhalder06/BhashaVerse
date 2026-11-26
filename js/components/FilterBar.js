// @ts-check
import { clear, el } from "../utils/dom.js";

/**
 * Data-driven filter bar with accessible labels, URL-synced query/facets, and Clear action.
 */
export class FilterBar {
  /**
   * @param {{
   *   searchPlaceholder: string,
   *   facets: Array<{ key: string, label: string, options: string[] }>,
   *   initialValues: { query?: string, facets?: Record<string, string> },
   *   onChange: (state: { query: string, facets: Record<string, string> }) => void,
   * }} config
   */
  constructor(config) {
    this.config = config;
    /** @type {HTMLInputElement | null} */
    this.searchInput = null;
    /** @type {Map<string, HTMLSelectElement>} */
    this.selects = new Map();
  }

  /** @returns {HTMLFormElement} */
  render() {
    const form = /** @type {HTMLFormElement} */ (
      el("form", {
        class: "mt-filter-panel",
        onSubmit: (/** @type {Event} */ e) => e.preventDefault(),
      })
    );

    const searchId = "mt-filter-q";
    const input = /** @type {HTMLInputElement} */ (
      el("input", {
        id: searchId,
        class: "mt-input",
        type: "search",
        value: this.config.initialValues.query || "",
        placeholder: this.config.searchPlaceholder,
      })
    );
    this.searchInput = input;
    form.appendChild(el("label", { for: searchId }, "Search", input));

    for (const facet of this.config.facets) {
      if (!facet.options.length) continue;
      const selId = `mt-facet-${facet.key}`;
      const sel = /** @type {HTMLSelectElement} */ (el("select", { id: selId, class: "mt-select", name: facet.key }));
      sel.appendChild(el("option", { value: "" }, "All"));
      for (const opt of facet.options) {
        sel.appendChild(el("option", { value: opt }, opt));
      }
      const initVal = (this.config.initialValues.facets && this.config.initialValues.facets[facet.key]) || "";
      if (initVal && facet.options.includes(initVal)) sel.value = initVal;
      this.selects.set(facet.key, sel);
      form.appendChild(el("label", { for: selId }, facet.label, sel));
    }

    const clearBtn = el("button", {
      type: "button",
      class: "mt-clear-btn",
      onClick: () => {
        if (this.searchInput) this.searchInput.value = "";
        for (const s of this.selects.values()) s.value = "";
        this.emit();
      },
    }, "Clear all");
    form.appendChild(clearBtn);

    form.addEventListener("input", () => this.emit());
    form.addEventListener("change", () => this.emit());
    return form;
  }

  emit() {
    const facets = /** @type {Record<string, string>} */ ({});
    for (const [key, sel] of this.selects.entries()) {
      facets[key] = sel.value;
    }
    this.config.onChange({
      query: this.searchInput ? this.searchInput.value : "",
      facets,
    });
  }
}
