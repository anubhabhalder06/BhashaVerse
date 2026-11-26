// @ts-check
import { el } from "../utils/dom.js";

const PENDING_KEY = "matrika:nav-pending";
const SHOW_DELAY_MS = 150;
const SAFETY_HIDE_MS = 8000;
const FINISH_JUMP_MS = 120;
const FADE_OUT_MS = 160;

/**
 * Minimal 2px top navigation progress line with injected scheduler.
 * Appears only if work remains pending after 150ms, finishes on next page load,
 * and resets immediately on persisted bfcache restoration.
 */
export class NavigationProgress {
  /**
   * @param {{
   *   scheduler?: { setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout },
   *   storage?: Storage | null,
   *   document?: Document,
   *   window?: Window,
   * }} [deps]
   */
  constructor(deps = {}) {
    this.scheduler = deps.scheduler || {
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (id) => globalThis.clearTimeout(id),
    };
    this.doc = deps.document ?? (typeof document !== "undefined" ? document : null);
    this.win = deps.window ?? (typeof window !== "undefined" ? window : null);
    this.storage = deps.storage !== undefined ? deps.storage : this._defaultSession();

    this.visible = false;
    this.active = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._delayTimer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._safetyTimer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._doneTimer = null;
    /** @type {HTMLElement | null} */
    this.barEl = null;
    /** @type {AbortController | null} */
    this._ac = null;
  }

  /** @returns {Storage | null} */
  _defaultSession() {
    try {
      return typeof sessionStorage !== "undefined" ? sessionStorage : null;
    } catch {
      return null;
    }
  }

  /** Attach progress bar, finish any pending navigation from previous page, and bind links/forms. */
  init() {
    if (!this.doc || !this.win) return;
    if (this._ac) this._ac.abort();
    this._ac = new AbortController();
    const { signal } = this._ac;

    this._ensureBar();

    // Check if previous navigation exceeded 150ms and showed the bar
    if (this._getPending()) {
      this._clearPending();
      this._finishPendingFromPrevious();
    }

    // Intercept same-origin clicks purely to schedule indicator (never preventDefault)
    this.doc.addEventListener(
      "click",
      (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!(e.target instanceof Element)) return;
        const a = e.target.closest("a[href]");
        if (!(a instanceof HTMLAnchorElement)) return;
        if (a.hasAttribute("download")) return;
        const targetAttr = (a.getAttribute("target") || "").toLowerCase();
        if (targetAttr && targetAttr !== "_self") return;
        const raw = a.getAttribute("href") || "";
        if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return;

        let url;
        try {
          url = new URL(a.href, this.win?.location.href);
        } catch {
          return;
        }
        if (this.win && url.origin !== this.win.location.origin) return;
        if (this.win && url.pathname === this.win.location.pathname && url.search === this.win.location.search) return;

        this.start({ forNavigation: true });
      },
      { signal }
    );

    // Same-origin GET forms (header/search page form)
    this.doc.addEventListener(
      "submit",
      (e) => {
        if (e.defaultPrevented || !(e.target instanceof HTMLFormElement)) return;
        const method = (e.target.getAttribute("method") || "get").toLowerCase();
        if (method !== "get") return;
        const action = e.target.getAttribute("action") || this.win?.location.href || "";
        let url;
        try {
          url = new URL(action, this.win?.location.href);
        } catch {
          return;
        }
        if (this.win && url.origin !== this.win.location.origin) return;
        this.start({ forNavigation: true });
      },
      { signal }
    );

    // Reset immediately on bfcache restore
    this.win.addEventListener(
      "pageshow",
      (e) => {
        if (e.persisted) {
          this.cancel();
        }
      },
      { signal }
    );
  }

  _ensureBar() {
    if (!this.doc) return;
    let bar = this.doc.getElementById("mt-nav-progress");
    if (!bar) {
      bar = el("div", {
        id: "mt-nav-progress",
        class: "mt-nav-progress",
        "aria-hidden": "true",
      });
      this.doc.body.prepend(bar);
    }
    this.barEl = bar;
  }

  /**
   * Begin tracking a pending navigation or async task.
   * Shows nothing until 150ms elapses cleanly.
   * @param {{ forNavigation?: boolean }} [opts]
   */
  start(opts = {}) {
    this.cancel();
    this.active = true;
    const forNav = Boolean(opts.forNavigation);

    this._delayTimer = this.scheduler.setTimeout(() => {
      if (!this.active) return;
      this.visible = true;
      if (forNav) this._setPending();
      if (this.barEl) {
        this.barEl.classList.remove("is-finishing", "is-fading");
        this.barEl.classList.add("is-active");
      }
      this._safetyTimer = this.scheduler.setTimeout(() => {
        this.cancel();
      }, SAFETY_HIDE_MS);
    }, SHOW_DELAY_MS);
  }

  /** Complete an in-page operation or navigation transition. */
  done() {
    if (!this.active && !this.visible) return;
    this.active = false;
    this._clearTimers();
    this._clearPending();

    if (!this.visible) return;
    this._runFinishAnimation();
  }

  _finishPendingFromPrevious() {
    if (!this.barEl) return;
    this.visible = true;
    this.active = false;
    this.barEl.classList.remove("is-fading");
    this.barEl.classList.add("is-active", "is-resumed");
    // Next tick jumps from ~85% -> 100% over 120ms, then fades out over 160ms
    this._doneTimer = this.scheduler.setTimeout(() => {
      this._runFinishAnimation();
    }, 16);
  }

  _runFinishAnimation() {
    this._clearTimers();
    if (this.barEl) {
      this.barEl.classList.add("is-finishing");
    }
    this._doneTimer = this.scheduler.setTimeout(() => {
      if (this.barEl) {
        this.barEl.classList.add("is-fading");
      }
      this._doneTimer = this.scheduler.setTimeout(() => {
        this.cancel();
      }, FADE_OUT_MS);
    }, FINISH_JUMP_MS);
  }

  /** Cancel immediately and reset progress line and storage flag. */
  cancel() {
    this.active = false;
    this.visible = false;
    this._clearTimers();
    this._clearPending();
    if (this.barEl) {
      this.barEl.classList.remove("is-active", "is-resumed", "is-finishing", "is-fading");
    }
  }

  _clearTimers() {
    if (this._delayTimer !== null) {
      this.scheduler.clearTimeout(this._delayTimer);
      this._delayTimer = null;
    }
    if (this._safetyTimer !== null) {
      this.scheduler.clearTimeout(this._safetyTimer);
      this._safetyTimer = null;
    }
    if (this._doneTimer !== null) {
      this.scheduler.clearTimeout(this._doneTimer);
      this._doneTimer = null;
    }
  }

  _getPending() {
    try {
      return this.storage ? this.storage.getItem(PENDING_KEY) === "1" : false;
    } catch {
      return false;
    }
  }

  _setPending() {
    try {
      if (this.storage) this.storage.setItem(PENDING_KEY, "1");
    } catch {
      // Ignore private mode errors
    }
  }

  _clearPending() {
    try {
      if (this.storage) this.storage.removeItem(PENDING_KEY);
    } catch {
      // Ignore
    }
  }

  destroy() {
    this.cancel();
    if (this._ac) this._ac.abort();
  }
}
