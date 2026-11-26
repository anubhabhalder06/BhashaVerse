// @ts-check

const PREFETCH_LIMIT = 12;

/**
 * Coordinates smooth anchor scrolling, View Transition readiness, link prefetching,
 * hairline top loading progress bar, and scroll/grid staggered entrance reveals.
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
  }

  /** Initialize top loading rule, link prefetching, smooth anchor jumps, and bfcache reset. */
  init() {
    if (typeof document === "undefined") return;

    this.ensureProgressBar();
    this.startLoading(0.38);

    if (!this.motionPrefs.isReducedMotion()) {
      document.documentElement.classList.add("mt-motion-ok");
    }
    this.motionPrefs.onChange(() => {
      document.documentElement.classList.toggle("mt-motion-ok", !this.motionPrefs.isReducedMotion());
    });

    this.bindNavigation();
    this.bindSmoothAnchors();
    this.initObserver();

    window.addEventListener("pageshow", (event) => {
      document.documentElement.classList.remove("mt-nav-leaving");
      if (event.persisted) {
        this.finishLoading(true);
      }
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

  /**
   * Advance the hairline top progress bar smoothly without stalling main thread.
   * @param {number} [target=0.45]
   */
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
      }, 200);
    }, 120);
  }

  /**
   * Prefetch same-origin .html documents on hover/focus and drive nav feedback on click.
   * @private
   */
  bindNavigation() {
    const isInternalHtmlLink = (target) => {
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

    document.addEventListener("pointerenter", (e) => queuePrefetch(isInternalHtmlLink(e.target)), { capture: true, passive: true });
    document.addEventListener("focusin", (e) => queuePrefetch(isInternalHtmlLink(e.target)), { passive: true });

    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const info = isInternalHtmlLink(e.target);
      if (!info) return;
      this.startLoading(0.76);
      if (!("onpagereveal" in window) && !this.motionPrefs.isReducedMotion()) {
        document.documentElement.classList.add("mt-nav-leaving");
      }
    });
  }

  /**
   * Smooth same-page hash scrolling with post-scroll accessible focus handoff.
   * @private
   */
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
      } catch {
        // Ignore history restrictions on non-HTTP contexts.
      }

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
    let rafPending = false;
    window.addEventListener(
      "scroll",
      () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
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
          el.classList.remove("mt-reveal-pending");
          this.observer?.unobserve(el);
        }
        this.revealAboveFold();
      },
      { threshold: 0.04, rootMargin: "0px 0px -16px 0px" }
    );
  }

  /**
   * Ensure elements at or above the current viewport (e.g. skipped via anchor/End jump) never stay hidden.
   * @private
   */
  revealAboveFold() {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const thresholdY = window.innerHeight * 0.98;
    const pending = document.querySelectorAll(".mt-reveal-pending");
    let batchIdx = 0;
    for (const el of pending) {
      if (!(el instanceof HTMLElement)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= thresholdY) {
        el.style.setProperty("--mt-stagger-i", String(Math.min(batchIdx, 5)));
        batchIdx += 1;
        el.classList.add("is-inview");
        el.classList.remove("mt-reveal-pending");
        this.observer?.unobserve(el);
      }
    }
  }

  /**
   * Scan page spreads, cards, and timelines for crisp progressive scroll/stagger entry.
   * Also observes dynamically filtered grids inside #main after hydration.
   */
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
    if (this.motionPrefs.isReducedMotion()) return;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const selector = [
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
      node.dataset.mtRevealBound = "1";

      const rect = node.getBoundingClientRect();
      if (rect.top <= vh * 0.96) {
        node.style.setProperty("--mt-stagger-i", String(Math.min(aboveIdx, 6)));
        aboveIdx += 1;
        node.classList.add("mt-reveal-item", "is-inview");
      } else if (this.observer) {
        node.classList.add("mt-reveal-item", "mt-reveal-pending");
        this.observer.observe(node);
      } else {
        node.classList.add("mt-reveal-item", "is-inview");
      }
    }
  }
}
