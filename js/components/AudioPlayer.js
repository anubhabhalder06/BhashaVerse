// @ts-check
import { clear, el, iconPauseCircle, iconPlayCircle } from "../utils/dom.js";
import { formatDuration } from "../utils/format.js";

/**
 * Accessible audio player component supporting play/pause, progress scrubber,
 * duration readout, volume slider, transcript toggle, and explicit mock-mode labelling.
 */
export class AudioPlayer {
  /** @param {import('../services/AudioService.js').AudioService} audioService */
  constructor(audioService) {
    this.audioService = audioService;
  }

  /**
   * @param {{
   *   id: string,
   *   title: string,
   *   src?: string | null,
   *   durationSec?: number,
   *   isMock?: boolean,
   *   transcript?: string | null,
   *   translation?: string | null,
   *   compact?: boolean,
   * }} opts
   * @returns {HTMLElement}
   */
  render(opts) {
    const isMock = opts.isMock !== false && !opts.src;
    const durationSec = Number(opts.durationSec) || 8;
    const trId = `mt-tr-${opts.id}`;

    const playBtn = /** @type {HTMLButtonElement} */ (
      el("button", {
        type: "button",
        class: "mt-play-btn",
        "aria-label": `Play ${opts.title}`,
        "aria-pressed": "false",
      })
    );
    const playLabel = el("span", {}, opts.compact ? `Hear it · ${formatDuration(durationSec)}` : "Play");
    playBtn.append(iconPlayCircle(), playLabel);

    const timeReadout = el("span", { class: "mt-player-time" }, `0:00 / ${formatDuration(durationSec)}`);
    const progress = /** @type {HTMLInputElement} */ (
      el("input", {
        type: "range",
        class: "mt-player-progress",
        min: "0",
        max: String(durationSec),
        step: "0.25",
        value: "0",
        "aria-label": `Playback position for ${opts.title}`,
      })
    );
    const volume = /** @type {HTMLInputElement} */ (
      el("input", {
        type: "range",
        class: "mt-player-vol",
        min: "0",
        max: "1",
        step: "0.05",
        value: "0.8",
        "aria-label": `Volume for ${opts.title}`,
      })
    );

    const statusLive = el("span", { class: "sr-only", "aria-live": "polite" });

    const ctrl = this.audioService.createTrack({
      src: opts.src || null,
      durationSec,
      onUpdate: (st) => {
        playBtn.setAttribute("aria-pressed", st.playing ? "true" : "false");
        clear(playBtn);
        playBtn.append(
          st.playing ? iconPauseCircle() : iconPlayCircle(),
          el("span", {}, st.playing ? "Pause" : (opts.compact ? `Hear it · ${formatDuration(durationSec)}` : "Play"))
        );
        progress.max = String(Math.max(1, st.duration));
        progress.value = String(st.current);
        timeReadout.textContent = `${formatDuration(st.current)} / ${formatDuration(st.duration)}`;
        if (st.playing && isMock) {
          statusLive.textContent = `Mock player active for ${opts.title} — no audio file attached.`;
        }
      },
    });

    playBtn.addEventListener("click", () => ctrl.toggle());
    progress.addEventListener("input", () => ctrl.seek(Number(progress.value)));
    volume.addEventListener("input", () => ctrl.setVolume(Number(volume.value)));

    const controlsRow = opts.compact
      ? el("div", { class: "mt-badge-row" }, playBtn, isMock ? el("span", { class: "mt-chip mt-chip--demo" }, "Mock player — no recording") : null)
      : el(
          "div",
          { class: "mt-player-controls" },
          playBtn,
          progress,
          timeReadout,
          volume,
          isMock ? el("span", { class: "mt-chip mt-chip--demo" }, "Mock player — no recording") : null
        );

    const shell = el("div", { class: opts.compact ? "" : "mt-player-shell" }, controlsRow, statusLive);

    if (opts.transcript !== undefined || opts.translation !== undefined) {
      const panel = el(
        "div",
        { id: trId, class: "mt-transcript-panel", hidden: true },
        el("p", { style: "margin:0" }, opts.transcript || "Transcript not yet available."),
        opts.translation ? el("p", { class: "mt-muted", style: "margin:0" }, `Translation: ${opts.translation}`) : null
      );
      const trBtn = el("button", {
        type: "button",
        class: "mt-transcript-toggle",
        "aria-expanded": "false",
        "aria-controls": trId,
        onClick: () => {
          const open = panel.hidden;
          panel.hidden = !open;
          trBtn.setAttribute("aria-expanded", String(open));
          trBtn.textContent = open ? "Hide transcript" : "Show transcript";
        },
      }, "Show transcript");
      shell.append(trBtn, panel);
    }

    return shell;
  }
}
