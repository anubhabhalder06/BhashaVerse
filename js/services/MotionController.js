// @ts-check
import { el } from "../utils/dom.js";

const NAV_PENDING_KEY = "mt_nav_pending";
const INTRO_DONE_KEY = "mt_intro_done";
const COVER_EXIT_MS = 420;
const READY_CAP_MS = 2500;
const HARD_FAILSAFE_MS = 3000;
const PREFETCH_DEBOUNCE_MS = 65;

/**
 * Single unified page-transition, scroll-reveal, top-thread progress,
 * link-prefetch, and hero line-mask entrance orchestrator.
 */
export class MotionController {
  /** @param {import('./MotionPreferences.js').MotionPreferences} prefs */
  constructor(prefs) {
    this.prefs = prefs;
    this.navigating = false;
    this.coverDone = false;
    this.heroRevealed = false;
    this._introStartedAt = performance.now();

    /** @type {HTMLElement | null} */
    this.coverEl = null;
    /** @type {HTMLElement | null} */
    this.coverDestEl = null;
    /** @type {HTMLButtonElement | null} */
    this.skipBtn = null;
    /** @type {HTMLElement | null} */
    this.threadEl = null;

    /** @type {IntersectionObserver | null} */
    this.observer = null;
    this.prefetched = new Set();
    this._prefetchTimer = 0;
    this._scrollRaf = 0;
    this._navTimer = 0;
    this._liftTimer = 0;
    this._unwrapTimer = 0;
    this._safetyTimer = 0;
    /** @type {AbortController | null} */
    this._ac = null;
  }

  init() {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (this._ac) this._ac.abort();
    this._ac = new AbortController();
    const { signal } = this._ac;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    document.documentElement.classList.add("js");
    this._applyMotionAttr();
    this.prefs.onChange(() => this._applyMotionAttr());
    this._ensureChromeNodes();

    const isEntering = document.documentElement.classList.contains("is-entering");
    const isFirstVisit = document.documentElement.classList.contains("is-first-visit");

    if (isEntering || isFirstVisit) {
      const storedDest = this._safeSessionGet(NAV_PENDING_KEY);
      if (this.coverDestEl) {
        this.coverDestEl.textContent =
          storedDest || (isFirstVisit ? "Digital Archive · India" : "");
      }
      if (this.coverEl) {
        this.coverEl.classList.add("is-animating", "is-holding");
        this.coverEl.setAttribute("aria-hidden", "false");
      }
      if (isFirstVisit && this.skipBtn) {
        this.skipBtn.hidden = false;
      }
    }

    // Hard 3s failsafe so the cover can never remain stuck under any error
    this._safetyTimer = window.setTimeout(() => this.forceClearCover(), HARD_FAILSAFE_MS);

    this._bindNavigation(signal);
    this._bindPrefetch(signal);
    this._bindTopThread(signal);
    this._bindIntroSkip(signal);

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        this.forceClearCover();
        this.navigating = false;
      }
    }, { signal });

    window.addEventListener("popstate", () => {
      this.forceClearCover();
      this.navigating = false;
    }, { signal });
  }

  _applyMotionAttr() {
    if (this._isReduced()) {
      document.documentElement.dataset.motion = "reduced";
    } else if (document.documentElement.dataset.motion === "reduced") {
      delete document.documentElement.dataset.motion;
    }
  }

  _isReduced() {
    return (
      (typeof this.prefs.isReducedMotion === "function" && this.prefs.isReducedMotion()) ||
      document.documentElement.dataset.motion === "reduced"
    );
  }

  _ensureChromeNodes() {
    this.coverEl = document.getElementById("mt-cover");
    if (!this.coverEl) {
      this.coverDestEl = el("span", { class: "mt-cover-dest", id: "mt-cover-dest" });
      this.skipBtn = /** @type {HTMLButtonElement} */ (
        el("button", { type: "button", class: "mt-cover-skip", id: "mt-cover-skip", hidden: true }, "Skip intro →")
      );
      this.coverEl = el(
        "div",
        { id: "mt-cover", class: "mt-cover", "aria-hidden": "true" },
        el(
          "div",
          { class: "mt-cover-inner" },
          el("span", { class: "mt-cover-thread", "aria-hidden": "true" }),
          el("span", { class: "mt-cover-mark", lang: "sa-Deva" }, "मातृका"),
          this.coverDestEl,
          this.skipBtn
        )
      );
      document.body.prepend(this.coverEl);
    } else {
      this.coverDestEl = document.getElementById("mt-cover-dest");
      this.skipBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("mt-cover-skip"));
    }

    this.threadEl = document.getElementById("mt-top-thread");
    if (!this.threadEl) {
      this.threadEl = el("div", { id: "mt-top-thread", class: "mt-top-thread", "aria-hidden": "true" });
      document.body.appendChild(this.threadEl);
    }
  }

  /** @param {AbortSignal} signal */
  _bindIntroSkip(signal) {
    if (!this.coverEl) return;
    const skip = () => {
      if (!document.documentElement.classList.contains("is-first-visit")) return;
      this._safeSessionSet(INTRO_DONE_KEY, "1");
      this._liftCover();
    };
    if (this.skipBtn) {
      this.skipBtn.addEventListener("click", skip, { signal });
    }
    this.coverEl.addEventListener("click", (e) => {
      if (e.target === this.coverEl || e.target === this.skipBtn) skip();
    }, { signal });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.documentElement.classList.contains("is-first-visit")) {
        skip();
      }
    }, { signal });
  }

  /** @param {AbortSignal} signal */
  _bindNavigation(signal) {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || this.navigating) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;

      const anchor = e.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      const targetAttr = (anchor.getAttribute("target") || "").toLowerCase();
      if (targetAttr && targetAttr !== "_self") return;

      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) {
        return;
      }

      /** @type {URL} */
      let dest;
      try {
        dest = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return;
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) {
        return;
      }

      e.preventDefault();
      this.navigating = true;
      window.dispatchEvent(new CustomEvent("mt:before-navigate", { detail: { href: dest.href } }));

      const destLabel = this._resolveDestLabel(anchor, dest);
      this._safeSessionSet(NAV_PENDING_KEY, destLabel);

      if (this.threadEl) {
        this.threadEl.style.setProperty("--mt-thread-opacity", "1");
        this.threadEl.style.setProperty("--mt-thread-scale", "0.35");
      }

      const reduced = this._isReduced();
      if (this.coverEl) {
        if (this.coverDestEl) this.coverDestEl.textContent = destLabel;
        if (this.skipBtn) this.skipBtn.hidden = true;
        this.coverEl.setAttribute("aria-hidden", "false");
        this.coverEl.classList.remove("is-lifting", "is-holding");
        this.coverEl.classList.add("is-animating");
        void this.coverEl.offsetWidth;
        this.coverEl.classList.add("is-covering");
      }

      const waitMs = reduced ? 160 : COVER_EXIT_MS;
      this._navTimer = window.setTimeout(() => {
        if (this.threadEl) this.threadEl.style.setProperty("--mt-thread-scale", "0.75");
        window.location.assign(dest.href);
      }, waitMs);
    }, { signal });
  }

  /** @param {AbortSignal} signal */
  _bindPrefetch(signal) {
    if (typeof navigator !== "undefined") {
      const conn = /** @type {{ saveData?: boolean, effectiveType?: string } | undefined} */ (
        /** @type {any} */ (navigator).connection
      );
      if (conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")) {
        return;
      }
    }

    const queuePrefetch = (/** @type {Event} */ e) => {
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      const cleanUrl = `${url.origin}${url.pathname}${url.search}`;
      if (this.prefetched.has(cleanUrl)) return;

      window.clearTimeout(this._prefetchTimer);
      this._prefetchTimer = window.setTimeout(() => {
        if (this.prefetched.has(cleanUrl)) return;
        this.prefetched.add(cleanUrl);
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = cleanUrl;
        document.head.appendChild(link);
      }, PREFETCH_DEBOUNCE_MS);
    };

    document.addEventListener("pointerenter", queuePrefetch, { capture: true, passive: true, signal });
    document.addEventListener("focusin", queuePrefetch, { passive: true, signal });
    document.addEventListener("touchstart", queuePrefetch, { passive: true, signal });
  }

  /** @param {AbortSignal} signal */
  _bindTopThread(signal) {
    const updateScrollThread = () => {
      this._scrollRaf = 0;
      if (!this.threadEl || this.navigating) return;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll < 80) {
        this.threadEl.style.setProperty("--mt-thread-opacity", "0");
        this.threadEl.style.setProperty("--mt-thread-scale", "0");
        return;
      }
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      this.threadEl.style.setProperty("--mt-thread-opacity", window.scrollY > 12 ? "0.85" : "0");
      this.threadEl.style.setProperty("--mt-thread-scale", ratio.toFixed(4));
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!this._scrollRaf) this._scrollRaf = requestAnimationFrame(updateScrollThread);
      },
      { passive: true, signal }
    );
  }

  /** Wait for critical fonts & hero image decode (capped at 2.5s), then lift the cover & start hero choreography. */
  async finishLoading() {
    if (this.threadEl) {
      this.threadEl.style.setProperty("--mt-thread-scale", "1");
    }

    const fontsPromise =
      typeof document !== "undefined" && document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    const heroImg = /** @type {HTMLImageElement | null} */ (document.querySelector(".hero-frame img"));
    let heroPromise = Promise.resolve();
    if (heroImg) {
      if (heroImg.complete && typeof heroImg.decode === "function") {
        heroPromise = heroImg.decode().catch(() => {});
      } else if (!heroImg.complete) {
        heroPromise = new Promise((resolve) => {
          const done = () => {
            if (typeof heroImg.decode === "function") {
              heroImg.decode().catch(() => {}).finally(resolve);
            } else {
              resolve();
            }
          };
          heroImg.addEventListener("load", done, { once: true });
          heroImg.addEventListener("error", resolve, { once: true });
        });
      }
    }

    const isFirstVisit = document.documentElement.classList.contains("is-first-visit");
    const elapsed = performance.now() - this._introStartedAt;
    const minHoldPromise =
      isFirstVisit && !this._isReduced()
        ? new Promise((resolve) => setTimeout(resolve, Math.max(0, 950 - elapsed)))
        : Promise.resolve();

    await Promise.race([
      Promise.all([fontsPromise, heroPromise, minHoldPromise]),
      new Promise((resolve) => setTimeout(resolve, READY_CAP_MS)),
    ]);

    this._liftCover();
  }

  _liftCover() {
    if (this.coverDone) return;
    this.coverDone = true;
    window.clearTimeout(this._safetyTimer);
    this._safeSessionRemove(NAV_PENDING_KEY);
    if (document.documentElement.classList.contains("is-first-visit")) {
      this._safeSessionSet(INTRO_DONE_KEY, "1");
    }

    document.documentElement.classList.remove("is-entering", "is-first-visit");

    if (!this.coverEl) {
      this._triggerHeroEntrance();
      return;
    }

    const reduced = this._isReduced();
    const hadCover =
      this.coverEl.classList.contains("is-holding") ||
      this.coverEl.classList.contains("is-covering");

    this.coverEl.classList.remove("is-covering", "is-holding");
    if (this.skipBtn) this.skipBtn.hidden = true;

    if (hadCover) {
      this.coverEl.classList.add("is-lifting");
      this._liftTimer = window.setTimeout(() => {
        this._triggerHeroEntrance();
        window.setTimeout(() => {
          if (this.coverEl) {
            this.coverEl.classList.remove("is-lifting", "is-animating");
            this.coverEl.setAttribute("aria-hidden", "true");
          }
          if (this.threadEl && window.scrollY <= 12) {
            this.threadEl.style.setProperty("--mt-thread-opacity", "0");
            this.threadEl.style.setProperty("--mt-thread-scale", "0");
          }
        }, reduced ? 160 : 280);
      }, reduced ? 80 : 250);
    } else {
      this.coverEl.classList.remove("is-lifting", "is-animating");
      this.coverEl.setAttribute("aria-hidden", "true");
      this._triggerHeroEntrance();
    }
  }

  forceClearCover() {
    window.clearTimeout(this._navTimer);
    window.clearTimeout(this._liftTimer);
    window.clearTimeout(this._safetyTimer);
    this._safeSessionRemove(NAV_PENDING_KEY);
    document.documentElement.classList.remove("is-entering", "is-first-visit");
    if (this.coverEl) {
      this.coverEl.classList.remove("is-covering", "is-holding", "is-lifting", "is-animating");
      this.coverEl.setAttribute("aria-hidden", "true");
    }
    this.coverDone = true;
    this._triggerHeroEntrance();
  }

  /** Line-by-line mask reveal on hero quote + sequential hero overlay arrival. */
  _triggerHeroEntrance() {
    if (this.heroRevealed) return;
    this.heroRevealed = true;

    const heroFrame = document.querySelector(".hero-frame");
    if (heroFrame && !this._isReduced()) {
      heroFrame.classList.add("is-entering");
    }

    document.querySelectorAll(".hero-overlay-item").forEach((node) => {
      node.classList.add("is-shown");
    });

    const quoteEl = /** @type {HTMLElement | null} */ (document.getElementById("mt-hero-quote"));
    if (!quoteEl) return;

    if (this._isReduced()) {
      quoteEl.classList.remove("is-pre-reveal");
      return;
    }

    const originalHTML = quoteEl.innerHTML;
    try {
      const tokens = [];
      const walk = (/** @type {Node} */ node, /** @type {boolean} */ inEm) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = (node.textContent || "").split(/(\s+)/);
          for (const part of parts) {
            if (!part) continue;
            tokens.push({ text: part, em: inEm, isSpace: /^\s+$/.test(part), isQuote: false });
          }
        } else if (node instanceof Element) {
          if (node.classList.contains("hero-open-quote")) {
            tokens.push({ text: node.textContent || "“", em: false, isSpace: false, isQuote: true });
            return;
          }
          const nextEm = inEm || node.tagName === "EM";
          node.childNodes.forEach((child) => walk(child, nextEm));
        }
      };
      quoteEl.childNodes.forEach((n) => walk(n, false));

      const frag = document.createDocumentFragment();
      /** @type {Array<{ span: HTMLSpanElement, text: string, em: boolean, isSpace: boolean, isQuote: boolean }>} */
      const wordSpans = [];
      for (const tok of tokens) {
        if (tok.isSpace) {
          frag.appendChild(document.createTextNode(tok.text));
          wordSpans.push({ span: /** @type {any} */ (null), ...tok });
        } else {
          const s = document.createElement(tok.em ? "em" : "span");
          if (tok.em) s.className = "hero-quote-em";
          if (tok.isQuote) s.className = "hero-open-quote";
          s.textContent = tok.text;
          frag.appendChild(s);
          wordSpans.push({ span: s, ...tok });
        }
      }

      quoteEl.innerHTML = "";
      quoteEl.appendChild(frag);

      // Batch DOM reads first to determine natural rendered lines
      /** @type {Array<Array<typeof wordSpans[0]>>} */
      const lines = [];
      let currentTop = -Infinity;
      for (const w of wordSpans) {
        if (w.isSpace) {
          if (lines.length) lines[lines.length - 1].push(w);
          continue;
        }
        const top = w.span.getBoundingClientRect().top;
        if (!lines.length || (Math.abs(top - currentTop) > 6 && !w.isQuote)) {
          lines.push([w]);
          currentTop = top;
        } else {
          lines[lines.length - 1].push(w);
        }
      }

      const lineFrag = document.createDocumentFragment();
      lines.forEach((lineItems, idx) => {
        const inner = document.createElement("span");
        inner.className = "hero-line-inner";
        inner.style.setProperty("--mt-line-i", String(idx));
        // Trim trailing space inside each line mask
        while (lineItems.length && lineItems[lineItems.length - 1].isSpace) {
          lineItems.pop();
        }
        for (const item of lineItems) {
          if (item.isSpace) {
            inner.appendChild(document.createTextNode(" "));
          } else {
            inner.appendChild(item.span);
          }
        }
        const mask = document.createElement("span");
        mask.className = "hero-line-mask";
        mask.appendChild(inner);
        lineFrag.appendChild(mask);
      });

      quoteEl.innerHTML = "";
      quoteEl.appendChild(lineFrag);
      quoteEl.classList.remove("is-pre-reveal");
      requestAnimationFrame(() => quoteEl.classList.add("is-masked-in"));

      const unwrapDelay = 700 + lines.length * 90 + 180;
      this._unwrapTimer = window.setTimeout(() => {
        quoteEl.classList.remove("is-masked-in");
        quoteEl.innerHTML = originalHTML;
      }, unwrapDelay);
    } catch {
      quoteEl.classList.remove("is-pre-reveal");
      quoteEl.innerHTML = originalHTML;
    }
  }

  /** Observe `.reveal` sections inside main with a single IntersectionObserver (`threshold: 0.15`). */
  observeMain() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    const items = Array.from(document.querySelectorAll("main .reveal"));
    if (!items.length) return;

    if (this._isReduced() || typeof IntersectionObserver !== "function") {
      items.forEach((node) => node.classList.add("is-inview"));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = /** @type {HTMLElement} */ (entry.target);
          target.style.setProperty("--mt-stagger-i", String(Math.min(6, batchIdx++)));
          target.classList.add("is-inview");
          this.observer?.unobserve(target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -32px 0px" }
    );

    const vh = window.innerHeight || 800;
    items.forEach((elNode) => {
      const r = elNode.getBoundingClientRect();
      if (r.top < vh * 0.92) {
        elNode.classList.add("is-inview");
      } else {
        this.observer?.observe(elNode);
      }
    });
  }

  /**
   * @param {HTMLAnchorElement} anchor
   * @param {URL} url
   * @returns {string}
   */
  _resolveDestLabel(anchor, url) {
    const label = (anchor.textContent || "").replace(/[→↗↓↑←]/g, "").trim();
    if (label && label.length <= 28) return label;
    const base = url.pathname.split("/").pop() || "index.html";
    return base.replace(/\.html$/i, "").replace(/-/g, " ") || "Home";
  }

  /** @param {string} k */
  _safeSessionGet(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  }

  /** @param {string} k @param {string} v */
  _safeSessionSet(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      // Ignore private browsing quota errors
    }
  }

  /** @param {string} k */
  _safeSessionRemove(k) {
    try {
      sessionStorage.removeItem(k);
    } catch {
      // Ignore
    }
  }

  destroy() {
    if (this._ac) this._ac.abort();
    if (this.observer) this.observer.disconnect();
    window.clearTimeout(this._prefetchTimer);
    window.clearTimeout(this._navTimer);
    window.clearTimeout(this._liftTimer);
    window.clearTimeout(this._unwrapTimer);
    window.clearTimeout(this._safetyTimer);
    cancelAnimationFrame(this._scrollRaf);
  }
}
