// @ts-check

/**
 * Playback controller bound strictly to real permission-cleared audio files.
 * Never autoplays and never synthesises speech or pronunciations.
 */
export class AudioService {
  constructor() {
    /** @type {AudioController | null} */
    this.activePlayer = null;
  }

  /**
   * Create a track controller bound to a real media URL.
   * @param {{ src: string, durationSec?: number, onUpdate: (state: { playing: boolean, current: number, duration: number }) => void }} opts
   * @returns {AudioController}
   */
  createTrack(opts) {
    return new AudioController(opts, this);
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
   * @param {{ src: string, durationSec?: number, onUpdate: (state: { playing: boolean, current: number, duration: number }) => void }} opts
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
    /** @type {HTMLAudioElement | null} */
    this.audio = this.src && typeof Audio !== "undefined" ? new Audio(this.src) : null;

    if (this.audio) {
      this.audio.preload = "metadata";
      this.audio.volume = this.volume;
      this.audio.addEventListener("loadedmetadata", () => {
        if (this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.duration = this.audio.duration;
          this.emit();
        }
      });
      this.audio.addEventListener("timeupdate", () => {
        if (!this.audio) return;
        this.current = this.audio.currentTime;
        if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.duration = this.audio.duration;
        }
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
    if (!this.audio) return;
    this.host.pauseOthers(this);
    this.playing = true;
    this.audio.play().catch(() => {
      this.playing = false;
      this.emit();
    });
    this.emit();
  }

  pause() {
    this.playing = false;
    if (this.audio) this.audio.pause();
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
