// @ts-check

const PREFETCH_LIMIT = 12;

/**
 * Coordinates View Transitions & browser-fallback cross-page navigation fades,
 * hairline top loading bar, internal link prefetching, smooth anchor scrolling,
 * and one shared IntersectionObserver for staggered scroll reveals.
 */
export class MotionController {
  /** @param {import('./MotionPreferences.js').MotionPreferences} motionPrefs */
  constructor(motionPrefs) {
    this.motionPrefs = motionPrefs;
    /** @type {Set<string>} */
    this.prefetched = new Set();
    /** @type {HTMLElement | null} */
    this.progressEl = null;
    /** @type {IntersectionObserver | null} */
    this.observer = null;
    /** @type {MutationObserver | null} */
    this.mutationObserver = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this.finishTimer = null;
    this.progressValue = 0;
    this.scrollRaf = false;
  }

  /** Initialize top loading rule, fallback navigation fade, link prefetching, and single observer. */
  init() {
    if (typeof document === "undefined") return;

    this.ensureProgressBar();
    this.startLoading(0.38);
    this.bindNavigation();
    this.bindSmoothAnchors();
    this.initObserver();

    window.addEventListener("pageshow", (event) => {
      document.documentElement.classList.remove("mt-nav-leaving", "mt-fallback-entering");
      document.documentElement.classList.add("mt-fallback-entered");
      if (event.persisted) {
        this.finishLoading(true);
      }
      this.revealAboveFold();
    });
  }

  /** @private */
  ensureProgressBar() {
    if (this.progressEl && this.progressEl.isConnected) return;
    let bar = /** @type {HTMLElement | null} */ (document.querySelector(".mt-nav-progress"));
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "mt-nav-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.prepend(bar);
    }
    this.progressEl = bar;
  }

  /** @param {number} [target=0.45] */
  startLoading(target = 0.45) {
    if (!this.progressEl) this.ensureProgressBar();
    if (!this.progressEl) return;
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
    this.progressValue = Math.max(this.progressValue, Math.min(0.9, target));
    this.progressEl.classList.remove("is-done");
    this.progressEl.classList.add("is-active");
    this.progressEl.style.setProperty("--mt-progress", String(this.progressValue));
  }

  /** @param {boolean} [instant=false] */
  finishLoading(instant = false) {
    if (!this.progressEl) return;
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
    if (instant || this.motionPrefs.isReducedMotion()) {
      this.progressValue = 0;
      this.progressEl.classList.remove("is-active", "is-done");
      this.progressEl.style.setProperty("--mt-progress", "0");
      return;
    }
    this.progressValue = 1;
    this.progressEl.classList.add("is-active");
    this.progressEl.style.setProperty("--mt-progress", "1");
    this.finishTimer = setTimeout(() => {
      if (!this.progressEl) return;
      this.progressEl.classList.add("is-done");
      this.finishTimer = setTimeout(() => {
        if (!this.progressEl) return;
        this.progressValue = 0;
        this.progressEl.classList.remove("is-active", "is-done");
        this.progressEl.style.setProperty("--mt-progress", "0");
      }, 180);
    }, 100);
  }

  /**
   * Prefetch same-origin .html documents and provide smooth exit fade fallback when needed.
   * @private
   */
  bindNavigation() {
    const isInternalDoc = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return null;
      if (link.target && link.target !== "_self") return null;
      if (link.hasAttribute("download")) return null;
      const raw = link.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return null;
      }
      if (url.origin !== location.origin) return null;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return null;
      return { link, url };
    };

    const queuePrefetch = (info) => {
      if (!info || this.prefetched.size >= PREFETCH_LIMIT) return;
      const key = `${info.url.pathname}${info.url.search}`;
      if (key === `${location.pathname}${location.search}` || this.prefetched.has(key)) return;
      this.prefetched.add(key);
      const hint = document.createElement("link");
      hint.rel = "prefetch";
      hint.as = "document";
      hint.href = info.url.href;
      document.head.appendChild(hint);
    };

    document.addEventListener("pointerenter", (e) => queuePrefetch(isInternalDoc(e.target)), { capture: true, passive: true });
    document.addEventListener("focusin", (e) => queuePrefetch(isInternalDoc(e.target)), { passive: true });

    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const info = isInternalDoc(e.target);
      if (!info) return;

      this.startLoading(0.76);

      // Fallback exit fade only when cross-document View Transitions are unsupported
      if (!("onpagereveal" in window) && !this.motionPrefs.isReducedMotion()) {
        e.preventDefault();
        document.documentElement.classList.add("mt-nav-leaving");
        setTimeout(() => {
          window.location.assign(info.url.href);
        }, 150);
      }
    });
  }

  /** @private */
  bindSmoothAnchors() {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;

      const raw = link.getAttribute("href") || "";
      if (!raw.includes("#")) return;
      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;

      const targetId = decodeURIComponent(url.hash.slice(1));
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const behavior = this.motionPrefs.isReducedMotion() ? "auto" : "smooth";
      targetEl.scrollIntoView({ behavior, block: "start" });
      try {
        history.pushState(null, "", url.hash);
      } catch { }

      const focusTarget = () => {
        if (!targetEl.hasAttribute("tabindex")) targetEl.setAttribute("tabindex", "-1");
        targetEl.focus({ preventScroll: true });
      };

      if (behavior === "auto") {
        focusTarget();
      } else {
        let done = false;
        const onEnd = () => {
          if (done) return;
          done = true;
          focusTarget();
        };
        window.addEventListener("scrollend", onEnd, { once: true, passive: true });
        setTimeout(onEnd, 460);
      }
    });
  }

  /** @private */
  initObserver() {
    if (typeof window === "undefined") return;
    window.addEventListener(
      "scroll",
      () => {
        if (this.scrollRaf) return;
        this.scrollRaf = true;
        requestAnimationFrame(() => {
          this.scrollRaf = false;
          this.revealAboveFold();
        });
      },
      { passive: true }
    );

    if (typeof IntersectionObserver === "undefined") return;
    this.observer = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = /** @type {HTMLElement} */ (entry.target);
          el.style.setProperty("--mt-stagger-i", String(Math.min(batchIdx, 5)));
          batchIdx += 1;
          el.classList.add("is-inview");
          this.observer?.unobserve(el);
        }
        this.revealAboveFold();
      },
      { threshold: 0.15 }
    );
  }

  /** Ensure elements already visible or scrolled above fold settle cleanly without staying hidden. */
  revealAboveFold() {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const thresholdY = window.innerHeight * 1.02;
    const pending = document.querySelectorAll(".reveal:not(.is-inview)");
    let batchIdx = 0;
    for (const el of pending) {
      if (!(el instanceof HTMLElement)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= thresholdY) {
        el.style.setProperty("--mt-stagger-i", String(Math.min(batchIdx, 5)));
        batchIdx += 1;
        el.classList.add("is-inview");
        this.observer?.unobserve(el);
      }
    }
  }

  /** Register static and dynamic sections/cards inside #main with one shared observer. */
  observeMain() {
    const main = document.getElementById("main");
    if (!main) return;

    this.scanTargets(main);

    if (!this.mutationObserver && typeof MutationObserver !== "undefined") {
      let pendingTimer = null;
      this.mutationObserver = new MutationObserver(() => {
        if (pendingTimer) return;
        pendingTimer = setTimeout(() => {
          pendingTimer = null;
          this.scanTargets(main);
        }, 16);
      });
      this.mutationObserver.observe(main, { childList: true, subtree: true });
    }
  }

  /**
   * @param {ParentNode} root
   * @private
   */
  scanTargets(root) {
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const selector = [
      ".reveal",
      ".mt-spread-inner",
      ".mt-tile-editorial",
      ".mt-lang-card",
      ".mt-contrib-tile",
      ".mt-timeline-item",
      ".mt-search-group",
      ".mt-poster-row",
      ".mt-masonry-pair figure",
      ".mt-profile-block",
    ].join(", ");

    const nodes = [...root.querySelectorAll(selector)];
    let aboveIdx = 0;

    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.dataset.mtRevealBound === "1") continue;
      // Avoid double-animating children nested inside an already-revealed container
      if (node.parentElement && node.parentElement.closest(".reveal")) continue;
      node.dataset.mtRevealBound = "1";
      node.classList.add("reveal");

      if (this.motionPrefs.isReducedMotion()) {
        node.classList.add("is-inview");
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.top <= vh * 0.96) {
        node.style.setProperty("--mt-stagger-i", String(Math.min(aboveIdx, 5)));
        aboveIdx += 1;
        node.classList.add("is-inview");
      } else if (this.observer) {
        this.observer.observe(node);
      } else {
        node.classList.add("is-inview");
      }
    }
  }
}
