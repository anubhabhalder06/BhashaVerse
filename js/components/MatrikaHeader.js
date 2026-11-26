// @ts-check
import { NAV_MORE, NAV_PRIMARY } from "../config/routes.js";
import { FEATURES } from "../config/features.js";
import { clear, el, svgIcon } from "../utils/dom.js";
import { SearchBox } from "./SearchBox.js";
import { WordmarkView } from "./WordmarkView.js";
import { WordmarkRotator } from "./WordmarkRotator.js";

/**
 * Light-DOM custom element providing the unified Matrika header across all pages:
 * rotating wordmark, 7-item nav with sliding ink indicator + More/Saved dropdown,
 * expandable search input, and accessible mobile toggle.
 */
export class MatrikaHeader extends HTMLElement {
  constructor() {
    super();
    /** @type {WordmarkRotator | null} */
    this.rotator = null;
    /** @type {AbortController | null} */
    this._ac = null;
    /** @type {ResizeObserver | null} */
    this._ro = null;
    this._indRaf = 0;
  }

  /** @param {import('../core/Container.js').Container} container */
  hydrate(container) {
    if (this._ac) this._ac.abort();
    if (this._ro) this._ro.disconnect();
    this._ac = new AbortController();
    const { signal } = this._ac;

    const activePage = document.body.dataset.page || "";
    const themeService = container.resolve("themeService");
    const motionPrefs = container.resolve("motionPrefs");
    const fontGate = container.resolve("fontGate");
    const wordmarkRepo = container.resolve("wordmarkRepo");

    clear(this);
    this.className = "mt-header-wrap";

    const brandHost = el("div", { class: "mt-brand-host" });

    const navList = el("ul");
    /** @type {HTMLElement | null} */
    let activeTarget = null;

    for (const item of NAV_PRIMARY) {
      const isActive = item.id === activePage;
      const a = el(
        "a",
        {
          href: item.href,
          "aria-current": isActive ? "page" : undefined,
        },
        item.label
      );
      if (isActive) activeTarget = a;
      navList.appendChild(el("li", {}, a));
    }

    const moreMenu = el("ul", { id: "mt-more-menu", class: "mt-more-menu", hidden: true });
    for (const m of NAV_MORE) {
      const a = el(
        "a",
        {
          href: m.href,
          "aria-current": m.id === activePage ? "page" : undefined,
        },
        m.label
      );
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
    if (!activeTarget && NAV_MORE.some((m) => m.id === activePage)) {
      activeTarget = moreBtn;
    }

    const closeMore = () => {
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    };
    moreBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        const open = moreMenu.hidden;
        moreMenu.hidden = !open;
        moreBtn.setAttribute("aria-expanded", String(open));
      },
      { signal }
    );
    document.addEventListener(
      "click",
      (e) => {
        if (!moreMenu.hidden && e.target instanceof Element && !e.target.closest(".mt-nav-more")) {
          closeMore();
        }
      },
      { signal }
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && !moreMenu.hidden) {
          closeMore();
          moreBtn.focus();
        }
      },
      { signal }
    );

    const indicator = el("li", { class: "mt-nav-indicator", "aria-hidden": "true" });
    navList.appendChild(el("li", { class: "mt-nav-more" }, moreBtn, moreMenu));
    navList.appendChild(indicator);

    const nav = el("nav", { id: "mt-main-nav", class: "site-nav", "aria-label": "Main" }, navList);

    const moveIndicatorTo = (/** @type {HTMLElement | null} */ target) => {
      cancelAnimationFrame(this._indRaf);
      this._indRaf = requestAnimationFrame(() => {
        if (!target || !navList.isConnected) {
          navList.style.setProperty("--mt-ind-o", "0");
          return;
        }
        const listRect = navList.getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        if (!rect.width) {
          navList.style.setProperty("--mt-ind-o", "0");
          return;
        }
        const x = rect.left - listRect.left;
        const scale = rect.width / 100;
        navList.style.setProperty("--mt-ind-x", `${x.toFixed(1)}px`);
        navList.style.setProperty("--mt-ind-s", `${scale.toFixed(4)}`);
        navList.style.setProperty("--mt-ind-o", "1");
      });
    };

    navList.addEventListener(
      "pointerover",
      (e) => {
        if (!(e.target instanceof Element)) return;
        const hit = e.target.closest(".site-nav > ul > li > a, .mt-more-trigger");
        if (hit instanceof HTMLElement) moveIndicatorTo(hit);
      },
      { signal }
    );
    navList.addEventListener(
      "focusin",
      (e) => {
        if (!(e.target instanceof Element)) return;
        const hit = e.target.closest(".site-nav > ul > li > a, .mt-more-trigger");
        if (hit instanceof HTMLElement) moveIndicatorTo(hit);
      },
      { signal }
    );
    navList.addEventListener(
      "pointerleave",
      () => moveIndicatorTo(activeTarget),
      { signal }
    );
    navList.addEventListener(
      "focusout",
      (e) => {
        if (e.relatedTarget instanceof Node && navList.contains(e.relatedTarget)) return;
        moveIndicatorTo(activeTarget);
      },
      { signal }
    );

    if (typeof ResizeObserver === "function") {
      this._ro = new ResizeObserver(() => moveIndicatorTo(activeTarget));
      this._ro.observe(navList);
    }
    requestAnimationFrame(() => moveIndicatorTo(activeTarget));

    const searchInitial = new URLSearchParams(location.search).get("q") || "";
    const controls = el("div", { class: "mt-header-controls" }, SearchBox.render(searchInitial));

    if (FEATURES.enableDarkThemeToggle) {
      const currTheme = themeService.getTheme();
      const themeBtn = el(
        "button",
        {
          type: "button",
          class: "mt-theme-btn",
          "aria-pressed": currTheme === "dark" ? "true" : "false",
          "aria-label": currTheme === "dark" ? "Switch to paper light theme" : "Switch to ink dark theme",
        },
        currTheme === "dark" ? "Paper" : "Ink"
      );
      themeBtn.addEventListener(
        "click",
        () => {
          const next = themeService.toggle();
          themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
          themeBtn.setAttribute("aria-label", next === "dark" ? "Switch to paper light theme" : "Switch to ink dark theme");
          themeBtn.textContent = next === "dark" ? "Paper" : "Ink";
        },
        { signal }
      );
      controls.appendChild(themeBtn);
    }

    const navToggle = el(
      "button",
      {
        class: "nav-toggle",
        type: "button",
        "aria-expanded": "false",
        "aria-controls": "mt-main-nav",
      },
      "Menu"
    );
    navToggle.addEventListener(
      "click",
      () => {
        const open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(open));
      },
      { signal }
    );
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
        view.renderFrames([]);
      });
    } else {
      view.renderFrames([]);
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._indRaf);
    if (this._ro) this._ro.disconnect();
    if (this._ac) this._ac.abort();
    if (this.rotator) this.rotator.destroy();
  }
}
