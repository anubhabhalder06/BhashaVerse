// @ts-check
import { BRAND } from "../config/brand.js";
import { clear, el, svgIcon } from "../utils/dom.js";
import { segmentGraphemes } from "../utils/a11y.js";

/**
 * Pure DOM builder/updater for the header wordmark rotator.
 * Stacks frames in grid-area: 1 / 1 for zero header shift and splits text cleanly via Intl.Segmenter.
 */
export class WordmarkView {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container = container;
    /** @type {Map<string, HTMLElement>} */
    this.frameNodes = new Map();
    /** @type {HTMLButtonElement | null} */
    this.pauseBtn = null;
    /** @type {HTMLAnchorElement | null} */
    this.brandLink = null;
    /** @type {string} */
    this.currentScript = "Latn";
    /** @type {ReturnType<typeof setTimeout> | null} */
    this.exitTimer = null;
  }

  /** @private */
  _clearTimers() {
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }

  /**
   * Build the wordmark stack + pause button inside container.
   * @param {import('../models/WordmarkFrame.js').WordmarkFrame[]} frames
   * @param {{ onTogglePause: () => void }} handlers
   */
  renderFrames(frames, handlers) {
    this._clearTimers();
    clear(this.container);
    this.frameNodes.clear();

    const stack = el("span", { class: "mt-wordmark-stack", "aria-hidden": "true" });
    const list = frames.length
      ? frames
      : [{ script: "Latn", text: BRAND.name, lang: "en-Latn", captionText: "", isAnchor: true }];

    for (const frame of list) {
      const clusters = segmentGraphemes(frame.text, frame.lang);
      const textWrap = el("span", { class: "mt-wordmark-text" });
      clusters.forEach((cluster, idx) => {
        const span = el("span", { class: "mt-wordmark-cluster" }, cluster);
        span.style.setProperty("--mt-grapheme-i", String(idx));
        textWrap.appendChild(span);
      });

      const frameEl = el("span", {
        class: `mt-wordmark-frame${frame.script === "Latn" ? " is-active" : ""}`,
        dataset: { script: frame.script },
        lang: frame.lang,
        "aria-hidden": "true",
      }, textWrap);

      this.frameNodes.set(frame.script, frameEl);
      stack.appendChild(frameEl);
    }

    const brandLink = /** @type {HTMLAnchorElement} */ (
      el("a", {
        class: "mt-brand-link",
        href: "index.html",
        "aria-label": `${BRAND.name}, home`,
      }, stack)
    );
    this.brandLink = brandLink;

    const pauseBtn = /** @type {HTMLButtonElement} */ (
      el("button", {
        type: "button",
        class: "mt-wordmark-pause",
        "aria-pressed": "false",
        "aria-label": "Pause wordmark animation",
        title: "Pause wordmark animation",
        onClick: handlers.onTogglePause,
      })
    );
    this.pauseBtn = pauseBtn;
    this.updatePauseControl(false);

    const group = el("div", { class: "mt-brand-group" }, brandLink, pauseBtn);
    this.container.appendChild(group);
  }

  /**
   * Transition cleanly between outgoing and incoming script frames without mutating document.title.
   * @param {string} nextScript
   * @param {boolean} [instant=false]
   */
  showFrame(nextScript, instant = false) {
    if (!this.frameNodes.has(nextScript)) return;
    this._clearTimers();

    const prevEl = this.frameNodes.get(this.currentScript);
    const nextEl = this.frameNodes.get(nextScript);
    if (!nextEl) return;

    for (const node of this.frameNodes.values()) {
      if (node !== prevEl) {
        node.classList.remove("is-active", "is-exiting");
      }
    }

    this.currentScript = nextScript;

    if (instant || !prevEl || prevEl === nextEl) {
      if (prevEl) prevEl.classList.remove("is-active", "is-exiting");
      nextEl.classList.remove("is-exiting");
      nextEl.classList.add("is-active");
      return;
    }

    prevEl.classList.remove("is-active");
    prevEl.classList.add("is-exiting");

    this.exitTimer = setTimeout(() => {
      prevEl.classList.remove("is-exiting");
      this.exitTimer = null;
      nextEl.classList.remove("is-exiting");
      nextEl.classList.add("is-active");
    }, 225);
  }

  /** @param {boolean} paused */
  updatePauseControl(paused) {
    if (!this.pauseBtn) return;
    clear(this.pauseBtn);
    this.pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    const label = paused ? "Play wordmark animation" : "Pause wordmark animation";
    this.pauseBtn.setAttribute("aria-label", label);
    this.pauseBtn.setAttribute("title", label);
    const icon = paused
      ? svgIcon(16, 16, [["polygon", { points: "7 5 19 12 7 19 7 5" }]])
      : svgIcon(16, 16, [
          ["line", { x1: "9", y1: "5", x2: "9", y2: "19" }],
          ["line", { x1: "15", y1: "5", x2: "15", y2: "19" }],
        ]);
    this.pauseBtn.appendChild(icon);
  }
}
