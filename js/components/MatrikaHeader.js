// @ts-check
import { NAV_MORE, NAV_PRIMARY } from "../config/routes.js";
import { FEATURES } from "../config/features.js";
import { clear, el, svgIcon } from "../utils/dom.js";
import { SearchBox } from "./SearchBox.js";
import { WordmarkView } from "./WordmarkView.js";
import { WordmarkRotator } from "./WordmarkRotator.js";

/**
 * Light-DOM custom element providing the unified Matrika header across all pages:
 * rotating wordmark, 7-item nav + More/Saved dropdown, accessible search, theme toggle.
 */
export class MatrikaHeader extends HTMLElement {
  constructor() {
    super();
    /** @type {WordmarkRotator | null} */
    this.rotator = null;
  }

  /** @param {import('../core/Container.js').Container} container */
  hydrate(container) {
    const activePage = document.body.dataset.page || "";
    const themeService = container.resolve("themeService");
    const motionPrefs = container.resolve("motionPrefs");
    const fontGate = container.resolve("fontGate");
    const wordmarkRepo = container.resolve("wordmarkRepo");

    clear(this);
    this.className = "mt-header-wrap";

    const brandHost = el("div", { class: "mt-brand-host" });

    const navList = el("ul");
    for (const item of NAV_PRIMARY) {
      const a = el("a", {
        href: item.href,
        "aria-current": item.id === activePage ? "page" : undefined,
      }, item.label);
      navList.appendChild(el("li", {}, a));
    }

    const moreMenu = el("ul", { id: "mt-more-menu", class: "mt-more-menu", hidden: true });
    for (const m of NAV_MORE) {
      const a = el("a", {
        href: m.href,
        "aria-current": m.id === activePage ? "page" : undefined,
      }, m.label);
      moreMenu.appendChild(el("li", {}, a));
    }

    const moreBtn = el(
      "button",
      {
        id: "mt-more-btn",
        class: "mt-more-trigger",
        type: "button",
        "aria-expanded": "false",
        "aria-controls": "mt-more-menu",
      },
      el("span", {}, "More"),
      svgIcon(14, 14, [["path", { d: "M6 9l6 6 6-6" }]])
    );

    const closeMore = () => {
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    };
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = moreMenu.hidden;
      moreMenu.hidden = !open;
      moreBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!moreMenu.hidden && e.target instanceof Element && !e.target.closest(".mt-nav-more")) {
        closeMore();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !moreMenu.hidden) {
        closeMore();
        moreBtn.focus();
      }
    });

    navList.appendChild(el("li", { class: "mt-nav-more" }, moreBtn, moreMenu));
    const nav = el("nav", { id: "mt-main-nav", class: "site-nav", "aria-label": "Main" }, navList);

    const searchInitial = new URLSearchParams(location.search).get("q") || "";
    const controls = el("div", { class: "mt-header-controls" }, SearchBox.render(searchInitial));

    if (FEATURES.enableDarkThemeToggle) {
      const currTheme = themeService.getTheme();
      const themeBtn = el("button", {
        type: "button",
        class: "mt-theme-btn",
        "aria-pressed": currTheme === "dark" ? "true" : "false",
        "aria-label": currTheme === "dark" ? "Switch to paper light theme" : "Switch to ink dark theme",
      }, currTheme === "dark" ? "Paper" : "Ink");
      themeBtn.addEventListener("click", () => {
        const next = themeService.toggle();
        themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
        themeBtn.setAttribute("aria-label", next === "dark" ? "Switch to paper light theme" : "Switch to ink dark theme");
        themeBtn.textContent = next === "dark" ? "Paper" : "Ink";
      });
      controls.appendChild(themeBtn);
    }

    const navToggle = el("button", {
      class: "nav-toggle",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "mt-main-nav",
    }, "Menu");
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    controls.appendChild(navToggle);

    const header = el("header", { class: "site-header" }, brandHost, nav, controls);
    this.appendChild(header);

    const view = new WordmarkView(brandHost);
    this.rotator = new WordmarkRotator({
      repository: wordmarkRepo,
      fontGate,
      motionPrefs,
      view,
    });

    if (FEATURES.enableWordmarkRotation) {
      this.rotator.init().catch(() => {
        view.renderFrames([], { onTogglePause: () => {} });
      });
    } else {
      view.renderFrames([], { onTogglePause: () => {} });
    }
  }

  disconnectedCallback() {
    if (this.rotator) this.rotator.destroy();
  }
}
