// @ts-check

/**
 * Single-active HTML5 audio coordinator with page-hide/visibility pause,
 * Media Session integration, and resilient network/decode error recovery.
 */
export class AudioService {
  constructor() {
    /** @type {Set<AudioController>} */
    this.controllers = new Set();
    /** @type {AudioController | null} */
    this.active = null;
    this._onVisibility = () => {
      if (document.hidden) this.pauseAll();
    };
    this._onPageHide = () => {
      this.pauseAll();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this._onVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this._onPageHide);
    }
  }

  /**
   * Bind a controller around a native <audio preload="none"> element.
   * @param {{
   *   audio: HTMLAudioElement,
   *   title: string,
   *   attribution?: string,
   *   durationSec?: number,
   *   onUpdate: (state: {
   *     playing: boolean,
   *     loading: boolean,
   *     ended: boolean,
   *     error: boolean,
   *     errorMessage: string,
   *     current: number,
   *     duration: number
   *   }) => void
   * }} opts
   * @returns {AudioController}
   */
  bindElement(opts) {
    const ctrl = new AudioController(this, opts);
    this.controllers.add(ctrl);
    return ctrl;
  }

  /**
   * Backward-compatible wrapper if callers pass src without prebuilding <audio>.
   * @param {{ src: string | null, durationSec?: number, title?: string, attribution?: string, onUpdate: Function }} opts
   */
  createTrack(opts) {
    const audio = document.createElement("audio");
    audio.preload = "none";
    if (opts.src) audio.src = opts.src;
    return this.bindElement({
      audio,
      title: opts.title || "Archive recording",
      attribution: opts.attribution || "Matrika Archive",
      durationSec: opts.durationSec || 0,
      onUpdate: /** @type {any} */ (opts.onUpdate),
    });
  }

  /** @param {AudioController | null} except */
  pauseOthers(except = null) {
    for (const c of this.controllers) {
      if (c !== except && (c.playing || c.loading)) {
        c.pause();
      }
    }
    this.active = except;
  }

  pauseAll() {
    this.pauseOthers(null);
  }

  destroy() {
    this.pauseAll();
    for (const c of this.controllers) c.destroy();
    this.controllers.clear();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this._onVisibility);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this._onPageHide);
    }
  }
}

class AudioController {
  /**
   * @param {AudioService} host
   * @param {{
   *   audio: HTMLAudioElement,
   *   title: string,
   *   attribution?: string,
   *   durationSec?: number,
   *   onUpdate: (state: {
   *     playing: boolean,
   *     loading: boolean,
   *     ended: boolean,
   *     error: boolean,
   *     errorMessage: string,
   *     current: number,
   *     duration: number
   *   }) => void
   * }} opts
   */
  constructor(host, opts) {
    this.host = host;
    this.audio = opts.audio;
    this.title = opts.title || "Archive recording";
    this.attribution = opts.attribution || "Matrika Archive";
    this.fallbackDuration = Number(opts.durationSec) || 0;
    this.onUpdate = opts.onUpdate;

    this.playing = false;
    this.loading = false;
    this.ended = false;
    this.error = false;
    this.errorMessage = "";
    this.current = 0;
    this.duration = this.fallbackDuration;

    this._ac = new AbortController();
    const { signal } = this._ac;

    this.audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        this.duration = this.audio.duration;
      }
      this._emit();
    }, { signal });

    this.audio.addEventListener("timeupdate", () => {
      this.current = this.audio.currentTime || 0;
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        this.duration = this.audio.duration;
      }
      this._emit();
    }, { signal });

    this.audio.addEventListener("waiting", () => {
      this.loading = true;
      this._emit();
    }, { signal });

    this.audio.addEventListener("stalled", () => {
      this.loading = true;
      this._emit();
    }, { signal });

    this.audio.addEventListener("canplay", () => {
      this.loading = false;
      this.error = false;
      this.errorMessage = "";
      this._emit();
    }, { signal });

    this.audio.addEventListener("playing", () => {
      this.playing = true;
      this.loading = false;
      this.ended = false;
      this.error = false;
      this.errorMessage = "";
      this._setMediaSession();
      this._emit();
    }, { signal });

    this.audio.addEventListener("pause", () => {
      this.playing = false;
      this.loading = false;
      this._emit();
    }, { signal });

    this.audio.addEventListener("ended", () => {
      this.playing = false;
      this.loading = false;
      this.ended = true;
      this.current = 0;
      try {
        this.audio.currentTime = 0;
      } catch {
        // Ignore if seek fails post-end
      }
      this._emit();
    }, { signal });

    this.audio.addEventListener("error", () => {
      this.playing = false;
      this.loading = false;
      this.error = true;
      this.errorMessage = "Audio file could not be reached right now.";
      this._emit();
    }, { signal });
  }

  _setMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata !== "function") {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.title,
        artist: this.attribution,
        album: "Matrika — Digital Archive",
      });
    } catch {
      // Ignore MediaSession errors in restricted contexts
    }
  }

  async play() {
    if (!this.audio.getAttribute("src")) return;
    this.host.pauseOthers(this);
    this.error = false;
    this.errorMessage = "";
    this.loading = true;
    this._emit();
    try {
      await this.audio.play();
    } catch {
      this.playing = false;
      this.loading = false;
      this.error = true;
      this.errorMessage = "Unable to start audio playback.";
      this._emit();
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.playing = false;
    this.loading = false;
    this._emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else void this.play();
  }

  retry() {
    this.error = false;
    this.errorMessage = "";
    try {
      this.audio.load();
    } catch {
      // Ignore load error; play() catch surfaces it cleanly
    }
    void this.play();
  }

  /** @param {number} sec */
  seek(sec) {
    const dur = this.duration > 0 ? this.duration : this.fallbackDuration;
    const clamped = Math.max(0, dur > 0 ? Math.min(dur, sec) : Math.max(0, sec));
    this.current = clamped;
    if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = clamped;
    }
    this._emit();
  }

  _emit() {
    this.onUpdate({
      playing: this.playing,
      loading: this.loading,
      ended: this.ended,
      error: this.error,
      errorMessage: this.errorMessage,
      current: this.current,
      duration: this.duration,
    });
  }

  destroy() {
    this.pause();
    this._ac.abort();
  }
}
