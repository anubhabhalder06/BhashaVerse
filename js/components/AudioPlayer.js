// @ts-check
import { el, iconPauseCircle, iconPlayCircle } from "../utils/dom.js";
import { formatDuration } from "../utils/format.js";

/**
 * Accessible archive audio player with native <audio preload="none">,
 * round 1px play/pause button, 6-bar waveform, interactive seek line,
 * error recovery, and 0fr/1fr accordion transcript disclosure.
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
   *   attribution?: string,
   *   statusCopy?: string,
   *   label?: string,
   *   transcript?: string | null,
   *   transcriptNative?: string | null,
   *   transcriptLatin?: string | null,
   *   transcriptEnglish?: string | null,
   *   translation?: string | null,
   *   compact?: boolean,
   * }} opts
   * @returns {HTMLElement}
   */
  render(opts) {
    const hasSrc = Boolean(opts.src && String(opts.src).trim());
    const durationSec = hasSrc ? Number(opts.durationSec) || 0 : 0;
    const trId = `mt-tr-${opts.id}`;
    const btnLabel = opts.label || "Hear it";

    /** @type {HTMLAudioElement | null} */
    let audioEl = null;
    if (hasSrc) {
      audioEl = /** @type {HTMLAudioElement} */ (
        el("audio", {
          preload: "none",
          src: String(opts.src),
          "aria-hidden": "true",
        })
      );
    }

    const playIcon = iconPlayCircle();
    const pauseIcon = iconPauseCircle();
    pauseIcon.setAttribute("hidden", "");

    const playBtn = /** @type {HTMLButtonElement} */ (
      el(
        "button",
        {
          type: "button",
          class: "mt-play-circle-btn",
          "aria-label": hasSrc
            ? `Play ${opts.title}`
            : `${opts.title} — recording available soon`,
          "aria-pressed": "false",
          "aria-disabled": hasSrc ? "false" : "true",
          disabled: !hasSrc,
        },
        playIcon,
        pauseIcon
      )
    );

    const wave = el(
      "span",
      { class: "mt-audio-wave", "aria-hidden": "true" },
      el("span"),
      el("span"),
      el("span"),
      el("span"),
      el("span"),
      el("span")
    );

    const actionText = el("span", {}, btnLabel);
    const labelWrap = el("span", { class: "mt-audio-label-wrap" }, actionText, wave);

    const seekFill = el("span", { class: "mt-audio-seek-fill" });
    const seekTrack = el("span", { class: "mt-audio-seek-track" }, seekFill);
    const seek = el(
      "div",
      {
        class: "mt-audio-seek",
        role: "slider",
        tabindex: hasSrc ? "0" : "-1",
        "aria-label": `Playback position for ${opts.title}`,
        "aria-valuemin": "0",
        "aria-valuemax": String(Math.max(1, durationSec)),
        "aria-valuenow": "0",
        "aria-valuetext": hasSrc ? "0:00" : "Recording available soon",
        "aria-disabled": hasSrc ? "false" : "true",
      },
      seekTrack
    );
    seek.style.setProperty("--mt-seek", "0");

    const timeReadout = hasSrc
      ? el(
          "span",
          { class: "mt-audio-time" },
          durationSec > 0 ? `0:00 / ${formatDuration(durationSec)}` : "0:00"
        )
      : null;

    const statusLine = !hasSrc
      ? el(
          "p",
          { class: "mt-audio-status" },
          opts.statusCopy || "Recording shared with community consent — available soon"
        )
      : null;

    const liveStatus = el("span", { class: "sr-only", "aria-live": "polite" });

    const errorText = el("span", {}, "");
    const retryBtn = /** @type {HTMLButtonElement} */ (
      el("button", { type: "button", class: "mt-audio-retry" }, "Retry")
    );
    const errorRow = el("div", { class: "mt-audio-error-row", hidden: true }, errorText, retryBtn);

    const block = el(
      "div",
      { class: "mt-audio-block" },
      audioEl,
      el("div", { class: "mt-audio-row" }, playBtn, labelWrap, seek, timeReadout),
      statusLine,
      errorRow,
      liveStatus
    );

    if (hasSrc && audioEl) {
      let currentDur = durationSec;
      const ctrl = this.audioService.bindElement({
        audio: audioEl,
        title: opts.title,
        attribution: opts.attribution,
        durationSec,
        onUpdate: (st) => {
          currentDur = st.duration > 0 ? st.duration : durationSec;
          block.classList.toggle("is-playing", st.playing);
          playBtn.setAttribute("aria-pressed", st.playing ? "true" : "false");
          playBtn.setAttribute("aria-label", `${st.playing ? "Pause" : "Play"} ${opts.title}`);
          if (st.playing) {
            playIcon.setAttribute("hidden", "");
            pauseIcon.removeAttribute("hidden");
          } else {
            playIcon.removeAttribute("hidden");
            pauseIcon.setAttribute("hidden", "");
          }
          actionText.textContent = st.playing ? "Pause" : st.loading ? "Loading…" : btnLabel;

          const ratio = currentDur > 0 ? Math.min(1, Math.max(0, st.current / currentDur)) : 0;
          seek.style.setProperty("--mt-seek", ratio.toFixed(4));
          seek.setAttribute("aria-valuemax", String(Math.max(1, Math.round(currentDur))));
          seek.setAttribute("aria-valuenow", String(Math.round(st.current)));
          seek.setAttribute(
            "aria-valuetext",
            currentDur > 0 ? `${formatDuration(st.current)} of ${formatDuration(currentDur)}` : formatDuration(st.current)
          );
          if (timeReadout) {
            timeReadout.textContent =
              currentDur > 0
                ? `${formatDuration(st.current)} / ${formatDuration(currentDur)}`
                : formatDuration(st.current);
          }

          if (st.error) {
            errorRow.hidden = false;
            errorText.textContent = st.errorMessage || "Audio unavailable right now.";
            liveStatus.textContent = st.errorMessage;
          } else {
            errorRow.hidden = true;
            if (st.playing) liveStatus.textContent = `Playing ${opts.title}`;
            else if (st.ended) liveStatus.textContent = `${opts.title} finished`;
          }
        },
      });

      playBtn.addEventListener("click", () => ctrl.toggle());
      retryBtn.addEventListener("click", () => ctrl.retry());

      const scrubToPointer = (/** @type {PointerEvent} */ e) => {
        const rect = seek.getBoundingClientRect();
        if (!rect.width) return;
        const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const dur = currentDur > 0 ? currentDur : audioEl?.duration || 0;
        if (dur > 0) ctrl.seek(pct * dur);
      };

      let dragging = false;
      seek.addEventListener("pointerdown", (e) => {
        dragging = true;
        try {
          seek.setPointerCapture(e.pointerId);
        } catch {
          // Ignore pointer capture rejection
        }
        scrubToPointer(e);
      });
      seek.addEventListener("pointermove", (e) => {
        if (dragging) scrubToPointer(e);
      });
      seek.addEventListener("pointerup", () => {
        dragging = false;
      });
      seek.addEventListener("pointercancel", () => {
        dragging = false;
      });
      seek.addEventListener("keydown", (e) => {
        const dur = currentDur > 0 ? currentDur : audioEl?.duration || 0;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          ctrl.seek(ctrl.current - 5);
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          ctrl.seek(ctrl.current + 5);
        } else if (e.key === "Home") {
          e.preventDefault();
          ctrl.seek(0);
        } else if (e.key === "End" && dur > 0) {
          e.preventDefault();
          ctrl.seek(dur);
        }
      });
    }

    const scriptLine = opts.transcriptNative || opts.transcript || null;
    const latinLine = opts.transcriptLatin || null;
    const englishLine = opts.transcriptEnglish || opts.translation || null;

    if (scriptLine || latinLine || englishLine) {
      const trArrow = el("span", { "aria-hidden": "true" }, "↓");
      const trLabel = el("span", {}, "Show transcript");
      const trBtn = /** @type {HTMLButtonElement} */ (
        el(
          "button",
          {
            type: "button",
            class: "mt-transcript-toggle",
            "aria-expanded": "false",
            "aria-controls": trId,
          },
          trLabel,
          trArrow
        )
      );

      const trWrap = el(
        "div",
        { id: trId, class: "mt-transcript-wrap", hidden: true },
        el(
          "div",
          { class: "mt-transcript-panel" },
          el(
            "div",
            { class: "mt-transcript-inner" },
            scriptLine ? el("p", { style: "margin:0;" }, scriptLine) : null,
            latinLine ? el("p", { class: "mt-muted", style: "margin:0;" }, latinLine) : null,
            englishLine ? el("p", { class: "mt-muted", style: "margin:0; font-style:italic;" }, englishLine) : null
          )
        )
      );

      let hideTimer = 0;
      trBtn.addEventListener("click", () => {
        const open = trBtn.getAttribute("aria-expanded") !== "true";
        window.clearTimeout(hideTimer);
        trBtn.setAttribute("aria-expanded", open ? "true" : "false");
        trLabel.textContent = open ? "Hide transcript" : "Show transcript";
        trArrow.textContent = open ? "↑" : "↓";
        if (open) {
          trWrap.hidden = false;
          requestAnimationFrame(() => trWrap.classList.add("is-open"));
        } else {
          trWrap.classList.remove("is-open");
          hideTimer = window.setTimeout(() => {
            if (trBtn.getAttribute("aria-expanded") !== "true") trWrap.hidden = true;
          }, 260);
        }
      });

      block.append(trBtn, trWrap);
    }

    return block;
  }
}
