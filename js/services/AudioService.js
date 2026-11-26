// @ts-check

/**
 * Playback controller supporting real cleared audio files and silent labelled mock mode.
 * Never autoplays and never synthesises speech or pronunciations.
 */
export class AudioService {
  constructor() {
    /** @type {AudioController | null} */
    this.activePlayer = null;
  }

  /**
   * Create a track controller bound to optional media URL or silent mock duration.
   * @param {{ src: string | null, durationSec: number, onUpdate: (state: { playing: boolean, current: number, duration: number }) => void }} opts
   * @returns {AudioController}
   */
  createTrack(opts) {
    const ctrl = new AudioController(opts, this);
    return ctrl;
  }

  /** @param {AudioController} except */
  pauseOthers(except) {
    if (this.activePlayer && this.activePlayer !== except) {
      this.activePlayer.pause();
    }
    this.activePlayer = except;
  }
}

export class AudioController {
  /**
   * @param {{ src: string | null, durationSec: number, onUpdate: (state: { playing: boolean, current: number, duration: number }) => void }} opts
   * @param {AudioService} host
   */
  constructor(opts, host) {
    this.src = opts.src;
    this.duration = Math.max(1, Number(opts.durationSec) || 8);
    this.onUpdate = opts.onUpdate;
    this.host = host;
    this.playing = false;
    this.current = 0;
    this.volume = 0.8;
    /** @type {ReturnType<typeof setInterval> | null} */
    this.timer = null;
    /** @type {HTMLAudioElement | null} */
    this.audio = this.src && typeof Audio !== "undefined" ? new Audio(this.src) : null;
    if (this.audio) {
      this.audio.preload = "metadata";
      this.audio.volume = this.volume;
      this.audio.addEventListener("timeupdate", () => {
        if (!this.audio) return;
        this.current = this.audio.currentTime;
        this.duration = Number.isFinite(this.audio.duration) ? this.audio.duration : this.duration;
        this.emit();
      });
      this.audio.addEventListener("ended", () => this.pause());
    }
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  play() {
    this.host.pauseOthers(this);
    this.playing = true;
    if (this.audio) {
      this.audio.play().catch(() => { this.playing = false; this.emit(); });
    } else {
      if (this.current >= this.duration) this.current = 0;
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.current = Math.min(this.duration, this.current + 0.25);
        this.emit();
        if (this.current >= this.duration) this.pause();
      }, 250);
    }
    this.emit();
  }

  pause() {
    this.playing = false;
    if (this.audio) this.audio.pause();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit();
  }

  /** @param {number} sec */
  seek(sec) {
    this.current = Math.max(0, Math.min(this.duration, Number(sec) || 0));
    if (this.audio) this.audio.currentTime = this.current;
    this.emit();
  }

  /** @param {number} vol */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this.audio) this.audio.volume = this.volume;
  }

  emit() {
    this.onUpdate({ playing: this.playing, current: this.current, duration: this.duration });
  }
}
