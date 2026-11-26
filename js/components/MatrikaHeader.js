// @ts-check
import { NAV_MORE, NAV_PRIMARY } from "../config/routes.js";
import { FEATURES } from "../config/features.js";
import { clear, el, svgIcon } from "../utils/dom.js";
import { SearchBox } from "./SearchBox.js";
import { WordmarkView } from "./WordmarkView.js";
import { WordmarkRotator } from "./WordmarkRotator.js";

/**
 * Light-DOM custom element providing the unified Matrika header across all pages:
 * continuous rotating wordmark, desktop nav with indicator + More dropdown,
 * and a compact 56px phone bar with mutually exclusive overlay Search & Menu panels.
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

    const moreBtn = /** @type {HTMLButtonElement} */ (
      el(
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
      )
    );
    if (!activeTarget && NAV_MORE.some((m) => m.id === activePage)) {
      activeTarget = moreBtn;
    }

    const indicator = el("li", { class: "mt-nav-indicator", "aria-hidden": "true" });
    navList.appendChild(el("li", { class: "mt-nav-more" }, moreBtn, moreMenu));
    navList.appendChild(indicator);

    const nav = el("nav", { id: "mt-main-nav", class: "site-nav", "aria-label": "Main" }, navList);

    const searchInitial = new URLSearchParams(location.search).get("q") || "";
    const controls = el("div", { class: "mt-header-controls" }, SearchBox.render(searchInitial));

    // Phone Search panel (4.2) & Search button (4.1), hidden on desktop (>=768px) and omitted on search.html
    const isSearchPage = activePage === "search";
    const mobileSearchInput = /** @type {HTMLInputElement} */ (
      el("input", {
        id: "mt-mobile-q",
        name: "q",
        type: "search",
        value: searchInitial,
        placeholder: "Search records",
        autocomplete: "off",
      })
    );
    const mobileSearchClose = /** @type {HTMLButtonElement} */ (
      el(
        "button",
        {
          type: "button",
          class: "mt-mobile-search-close",
          "aria-label": "Close search",
        },
        "×"
      )
    );
    const mobileSearchPanel = el(
      "div",
      {
        id: "mt-mobile-search-panel",
        class: "mt-mobile-search-panel",
        hidden: true,
      },
      el(
        "form",
        { class: "mt-mobile-search-form", role: "search", action: "search.html" },
        el("label", { for: "mt-mobile-q", class: "sr-only" }, "Search records"),
        mobileSearchInput,
        el("button", { type: "submit", class: "mt-mobile-search-go" }, "Go"),
        mobileSearchClose
      )
    );

    const searchToggle = !isSearchPage
      ? /** @type {HTMLButtonElement} */ (
          el(
            "button",
            {
              id: "mt-search-toggle",
              class: "mt-search-toggle",
              type: "button",
              "aria-label": "Search",
              "aria-expanded": "false",
              "aria-controls": "mt-mobile-search-panel",
            },
            svgIcon(18, 18, [
              ["circle", { cx: "11", cy: "11", r: "7" }],
              ["path", { d: "M20 20l-3.5-3.5" }],
            ])
          )
        )
      : null;

    if (searchToggle) controls.appendChild(searchToggle);

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

    const navToggle = /** @type {HTMLButtonElement} */ (
      el(
        "button",
        {
          class: "nav-toggle",
          type: "button",
          "aria-expanded": "false",
          "aria-controls": "mt-main-nav",
        },
        "Menu"
      )
    );
    controls.appendChild(navToggle);

    const header = el("header", { class: "site-header" }, brandHost, nav, controls);
    this.append(header, mobileSearchPanel);

    const emitPanelState = () => {
      const menuOpen = nav.classList.contains("is-open");
      const searchOpen = !mobileSearchPanel.hidden;
      window.dispatchEvent(new CustomEvent("mt:header-panel", { detail: { open: menuOpen || searchOpen } }));
    };

    const closeMore = () => {
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    };

    const closeMenu = (returnFocus = false) => {
      if (!nav.classList.contains("is-open")) return;
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      closeMore();
      emitPanelState();
      if (returnFocus) navToggle.focus();
    };

    const closeSearchPanel = (returnFocus = false) => {
      if (mobileSearchPanel.hidden) return;
      mobileSearchPanel.hidden = true;
      if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
      emitPanelState();
      if (returnFocus && searchToggle) searchToggle.focus();
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

    if (searchToggle) {
      searchToggle.addEventListener(
        "click",
        () => {
          const open = mobileSearchPanel.hidden;
          closeMenu(false);
          mobileSearchPanel.hidden = !open;
          searchToggle.setAttribute("aria-expanded", String(open));
          emitPanelState();
          if (open) {
            requestAnimationFrame(() => mobileSearchInput.focus());
          }
        },
        { signal }
      );
    }

    mobileSearchClose.addEventListener("click", () => closeSearchPanel(true), { signal });

    navToggle.addEventListener(
      "click",
      () => {
        const willOpen = !nav.classList.contains("is-open");
        closeSearchPanel(false);
        nav.classList.toggle("is-open", willOpen);
        navToggle.setAttribute("aria-expanded", String(willOpen));
        emitPanelState();
        if (willOpen) {
          const firstLink = nav.querySelector("a[href]");
          if (firstLink instanceof HTMLElement) requestAnimationFrame(() => firstLink.focus());
        }
      },
      { signal }
    );

    // Close menu when selecting any nav destination on phones
    nav.addEventListener(
      "click",
      (e) => {
        if (e.target instanceof Element && e.target.closest("a[href]")) {
          closeMenu(false);
        }
      },
      { signal }
    );

    document.addEventListener(
      "click",
      (e) => {
        if (!(e.target instanceof Element)) return;
        if (!moreMenu.hidden && !e.target.closest(".mt-nav-more")) {
          closeMore();
        }
        if (!this.contains(e.target)) {
          closeMenu(false);
          closeSearchPanel(false);
        }
      },
      { signal }
    );

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Escape") return;
        if (!mobileSearchPanel.hidden) {
          e.preventDefault();
          closeSearchPanel(true);
        } else if (nav.classList.contains("is-open")) {
          e.preventDefault();
          closeMenu(true);
        } else if (!moreMenu.hidden) {
          closeMore();
          moreBtn.focus();
        }
      },
      { signal }
    );

    // Desktop horizontal underline indicator
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
    navList.addEventListener("pointerleave", () => moveIndicatorTo(activeTarget), { signal });
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
