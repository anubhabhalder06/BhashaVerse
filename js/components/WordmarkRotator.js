// @ts-check

const STATE_KEY = "matrika:wordmark-state";

/**
 * State machine orchestrating continuous header wordmark rotation across page loads.
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
   *   session?: Storage | null,
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
    this.session = deps.session !== undefined ? deps.session : this._defaultSession();

    /** @type {"idle" | "running" | "paused" | "reduced"} */
    this.state = "idle";
    /** @type {import('../models/WordmarkFrame.js').WordmarkFrame[]} */
    this.frames = [];
    this.index = 0;
    this.startedAt = Date.now();
    this.timerId = null;
    this.autoPauseReasons = new Set();
    /** @type {Array<() => void>} */
    this.unsubs = [];
  }

  /** @returns {Storage | null} */
  _defaultSession() {
    try {
      return typeof sessionStorage !== "undefined" ? sessionStorage : null;
    } catch {
      return null;
    }
  }

  /** @returns {boolean} */
  _isConstrainedNetwork() {
    if (typeof navigator === "undefined") return false;
    const conn = /** @type {{ saveData?: boolean, effectiveType?: string } | undefined} */ (
      /** @type {any} */ (navigator).connection
    );
    return Boolean(conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g"));
  }

  async init() {
    const allFrames = await this.repository.getFrames();
    this.frames = this._isConstrainedNetwork()
      ? allFrames.filter((f) => f.isAnchor)
      : allFrames;

    this.view.renderFrames(this.frames);
    this.fontGate.warmSecondaryFonts();

    const anchorFrames = this.frames.filter((f) => f.isAnchor);
    await Promise.all(anchorFrames.map((f) => this.fontGate.ensure(f)));

    // Resume saved script frame seamlessly across page transitions
    const saved = this._loadState();
    let resumeRemainingMs = null;
    if (saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < this.frames.length) {
      const target = this.frames[saved.index];
      const ok = await this.fontGate.ensure(target);
      if (ok) {
        this.index = saved.index;
        this.startedAt = typeof saved.startedAt === "number" ? saved.startedAt : Date.now();
        this.view.showFrame(target.script, true);
        const targetHold = target.isAnchor ? this.anchorHoldMs : this.holdMs;
        resumeRemainingMs = Math.max(200, targetHold - Math.max(0, Date.now() - this.startedAt));
      }
    } else {
      this._saveState();
    }

    this.attachVisibilityWatchers();
    this.syncState(resumeRemainingMs);
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

  /** @param {number | null} [initialDelayOverride=null] */
  syncState(initialDelayOverride = null) {
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
      this.scheduleNext(initialDelayOverride);
    }
  }

  /** @param {number | null} [delayOverride=null] */
  scheduleNext(delayOverride = null) {
    this.clearTimer();
    const curr = this.frames[this.index];
    const baseDelay = curr && curr.isAnchor ? this.anchorHoldMs : this.holdMs;
    const delay = typeof delayOverride === "number" ? delayOverride : baseDelay;
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
        this.startedAt = Date.now();
        this._saveState();
        this.view.showFrame(frame.script, false);
        break;
      }
    }
    this.scheduleNext();
  }

  _loadState() {
    try {
      if (!this.session) return null;
      const raw = this.session.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _saveState() {
    try {
      if (!this.session) return;
      this.session.setItem(STATE_KEY, JSON.stringify({ index: this.index, startedAt: this.startedAt }));
    } catch {
      // Ignore quota/storage errors
    }
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
