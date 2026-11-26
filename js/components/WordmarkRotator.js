// @ts-check

/**
 * State machine orchestrating header wordmark rotation.
 * States: idle | running | paused | reduced.
 */
export class WordmarkRotator {
  /**
   * @param {{
   *   repository: import('../data/WordmarkRepository.js').WordmarkRepository,
   *   fontGate: import('../services/FontGate.js').FontGate,
   *   motionPrefs: import('../services/MotionPreferences.js').MotionPreferences,
   *   view: import('./WordmarkView.js').WordmarkView,
   *   scheduler?: { setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout },
   *   holdMs?: number,
   *   anchorHoldMs?: number,
   * }} deps
   */
  constructor(deps) {
    this.repository = deps.repository;
    this.fontGate = deps.fontGate;
    this.motionPrefs = deps.motionPrefs;
    this.view = deps.view;
    this.scheduler = deps.scheduler || {
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (id) => globalThis.clearTimeout(id),
    };
    this.holdMs = deps.holdMs || 2400;
    this.anchorHoldMs = deps.anchorHoldMs || 3400;

    /** @type {"idle" | "running" | "paused" | "reduced"} */
    this.state = "idle";
    /** @type {import('../models/WordmarkFrame.js').WordmarkFrame[]} */
    this.frames = [];
    this.index = 0;
    this.timerId = null;
    this.autoPauseReasons = new Set();
    /** @type {IntersectionObserver | null} */
    this.observer = null;
    /** @type {Array<() => void>} */
    this.unsubs = [];
  }

  async init() {
    this.frames = await this.repository.getFrames();
    this.view.renderFrames(this.frames);

    this.fontGate.warmSecondaryFonts();

    const anchorFrames = this.frames.filter((f) => f.isAnchor);
    await Promise.all(anchorFrames.map((f) => this.fontGate.ensure(f)));

    this.attachVisibilityWatchers();
    this.syncState();
  }

  attachVisibilityWatchers() {
    this.unsubs.push(this.motionPrefs.onChange(() => this.syncState()));

    if (typeof document !== "undefined") {
      const onVis = () => {
        if (document.hidden) this.autoPauseReasons.add("hidden");
        else this.autoPauseReasons.delete("hidden");
        this.syncState();
      };
      document.addEventListener("visibilitychange", onVis);
      this.unsubs.push(() => document.removeEventListener("visibilitychange", onVis));
    }
  }

  syncState() {
    const reduced = this.motionPrefs.isReducedMotion();

    if (reduced) {
      this.clearTimer();
      this.state = "reduced";
      this.index = 0;
      this.view.showFrame("Latn", true);
      return;
    }

    if (this.autoPauseReasons.size > 0 || this.frames.length < 2) {
      this.clearTimer();
      this.state = "paused";
      return;
    }

    if (this.state !== "running") {
      this.state = "running";
      this.scheduleNext();
    }
  }

  scheduleNext() {
    this.clearTimer();
    const curr = this.frames[this.index];
    const delay = curr && curr.isAnchor ? this.anchorHoldMs : this.holdMs;
    this.timerId = this.scheduler.setTimeout(() => this.advance(), delay);
  }

  async advance() {
    if (this.state !== "running" || this.frames.length < 2) return;
    for (let step = 1; step <= this.frames.length; step++) {
      const candidateIdx = (this.index + step) % this.frames.length;
      const frame = this.frames[candidateIdx];
      const ready = await this.fontGate.ensure(frame);
      if (this.state !== "running") return;
      if (ready) {
        this.index = candidateIdx;
        this.view.showFrame(frame.script, false);
        break;
      }
    }
    this.scheduleNext();
  }

  clearTimer() {
    if (this.timerId !== null) {
      this.scheduler.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  start() {
    this.syncState();
  }

  destroy() {
    this.clearTimer();
    while (this.unsubs.length) {
      const fn = this.unsubs.pop();
      if (fn) fn();
    }
  }
}
