/* BhashaVerse editorial interactions: More menu, hero audio/transcript, 8-script poster, 12-col directory */
(function(){
  const DATA = window.BhashaVerseData || { LANGUAGES: [], CATEGORY_GLYPHS: [], LATEST_ADDITIONS: [], ROTATING_WORDS: ["water", "home", "song"] };
  let audioCtx = null;

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }

  function playCadence(freq, statusEl, label){
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioCtx = audioCtx || new Ctx();
        const now = audioCtx.currentTime;
        [freq, freq * 1.125].forEach((f, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + idx * 0.16);
          gain.gain.setValueAtTime(0.06, now + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.34);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.36);
        });
      }
      if (statusEl) statusEl.textContent = label + " — placeholder tone preview";
    } catch (_) {}
  }

  function makeCirclePlayIcon(){
    return `<svg class="bv-play-circle" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="none"/></svg>`;
  }

  function makeWaveform(){
    const bars = [5, 11, 7, 13, 6, 10];
    return `<span class="bv-waveform" aria-hidden="true">${bars.map(h => `<span style="height:${h}px"></span>`).join("")}</span>`;
  }

  /* Archival stamp SVG with slight rotation & SVG ink unevenness filter; record ID and received date only */
  function makeStampSvg(code, dateText, rotationDeg){
    const rot = (typeof rotationDeg === "number" ? rotationDeg : -2).toFixed(2);
    return `
      <svg class="bv-stamp-svg" width="128" height="46" viewBox="0 0 142 52" style="transform:rotate(${rot}deg)" role="img" aria-label="${escapeHtml(code + " received " + dateText)}">
        <g filter="url(#bv-stamp-ink)">
          <rect x="2" y="2" width="138" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5 2"/>
          <rect x="6" y="6" width="130" height="40" fill="none" stroke="currentColor" stroke-width="0.9"/>
          <text x="71" y="22" text-anchor="middle" fill="currentColor" font-size="10.5" font-weight="600" font-family="inherit">${escapeHtml(code)}</text>
          <text x="71" y="38" text-anchor="middle" fill="currentColor" font-size="9" font-family="inherit">REC'D ${escapeHtml(dateText)}</text>
        </g>
      </svg>`;
  }

  function canRenderChar(ch, fontStr){
    try {
      const c = document.createElement("canvas");
      c.width = 48; c.height = 48;
      const ctx = c.getContext("2d");
      ctx.font = fontStr;
      const wGlyph = ctx.measureText(ch).width;
      const wMissing = ctx.measureText("\uFFFF").width;
      ctx.clearRect(0, 0, 48, 48);
      ctx.fillStyle = "#000";
      ctx.fillText(ch, 6, 36);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      let ink = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 20) ink++;
      return ink > 12 && Math.abs(wGlyph - wMissing) > 0.25;
    } catch (_) { return true; }
  }

  function initMoreMenu(){
    const btn = document.getElementById("bv-more-btn");
    const menu = document.getElementById("bv-more-menu");
    if (!btn || !menu) return;
    const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!menu.hidden && !e.target.closest(".bv-nav-more")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { close(); btn.focus(); }
    });
  }

  function initHeroControls(){
    const playBtn = document.getElementById("bv-hero-play");
    const noteEl = document.getElementById("bv-hero-audio-note");
    const trBtn = document.getElementById("bv-transcript-toggle");
    const trPanel = document.getElementById("bv-hero-transcript");
    const factsEl = document.getElementById("bv-hero-facts");
    const cueEl = document.getElementById("bv-scroll-cue-text");
    const headerEl = document.querySelector(".bv-header-wrap") || document.querySelector(".site-header");

    const syncHeaderH = () => {
      if (headerEl) document.documentElement.style.setProperty("--header-h", Math.ceil(headerEl.getBoundingClientRect().height) + "px");
    };
    syncHeaderH();
    window.addEventListener("resize", syncHeaderH);

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        playCadence(311.13, noteEl, "Mishing sample audio (0:12)");
      });
    }
    if (trBtn && trPanel) {
      trBtn.addEventListener("click", () => {
        const open = trPanel.hidden;
        trPanel.hidden = !open;
        trBtn.setAttribute("aria-expanded", String(open));
        trBtn.textContent = open ? "Hide transcript" : "Show transcript";
      });
    }
    if (factsEl) {
      const langCount = DATA.LANGUAGES.length;
      const scriptSet = new Set();
      DATA.LANGUAGES.forEach(l => {
        if (!l.scriptCode || l.scriptCode === "to be verified") return;
        l.scriptCode.split(",").map(s => s.trim()).forEach(s => { if (s) scriptSet.add(s); });
      });
      factsEl.textContent = `${langCount} languages · ${scriptSet.size} scripts · photographs, audio and manuscripts`;
    }
    if (cueEl) {
      const posterCount = DATA.LANGUAGES.filter(l => l.inPoster && l.words).length;
      const numWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
      const countText = numWords[posterCount] || String(posterCount);
      cueEl.textContent = `Scroll: one word in ${countText} languages`;
    }
  }

  function initPoster(){
    const rowsEl = document.getElementById("bv-poster-rows");
    const conceptEl = document.getElementById("bv-poster-concept");
    const rotateBtn = document.getElementById("bv-rotate-word");
    const statusEl = document.getElementById("bv-audio-status");
    if (!rowsEl || !conceptEl) return;

    const posterLanguages = DATA.LANGUAGES.filter(l => l.inPoster && l.words);
    const kodaLang = DATA.LANGUAGES.find(l => l.id === "koda");
    const words = DATA.ROTATING_WORDS;
    let idx = Number(localStorage.getItem("bv-poster-word-idx") || "0");
    if (!Number.isFinite(idx) || idx < 0) idx = 0;
    localStorage.setItem("bv-poster-word-idx", String((idx + 1) % words.length));
    let switchTimer = null;

    function buildRows(wordKey){
      conceptEl.textContent = wordKey;
      const rowsHtml = posterLanguages.map((lang, i) => {
        const w = lang.words[wordKey] || lang.words.water;
        return `
          <li class="bv-poster-row ${i === 0 ? "is-active" : ""}" style="--lang-accent:${lang.accent};--lang-accent-dark:${lang.accentDark}">
            <div>
              <a class="bv-poster-script-link" href="language-profile.html?lang=${encodeURIComponent(lang.id)}">
                <span lang="${lang.langAttr}">${escapeHtml(w.script)}</span>
              </a>
            </div>
            <div class="bv-poster-meta">
              <span class="bv-poster-lang">${escapeHtml(lang.name)}</span>
              <span class="bv-poster-rom">${escapeHtml(w.roman)}</span>
              <span class="bv-poster-ipa">${escapeHtml(w.ipa)}</span>
            </div>
            <div>
              <button type="button" class="bv-play-btn" data-freq="${w.freq}" data-label="${escapeHtml(lang.name + " — " + w.roman + ", " + wordKey)}">
                ${makeCirclePlayIcon()}
                <span>${escapeHtml(w.roman + ", " + wordKey)}</span>
              </button>
            </div>
          </li>`;
      }).join("");

      const kodaRow = kodaLang ? `
        <li class="bv-poster-row bv-poster-row--pending" style="--lang-accent:${kodaLang.accent};--lang-accent-dark:${kodaLang.accentDark}">
          <div>
            <a class="bv-poster-stub-link" href="language-profile.html?lang=koda">Script to be verified</a>
          </div>
          <div class="bv-poster-meta">
            <span class="bv-poster-lang">${escapeHtml(kodaLang.name)}</span>
            <span class="bv-poster-rom">${escapeHtml(kodaLang.rightsBadge)}</span>
          </div>
          <div>
            <a class="bv-play-btn" href="contribute.html?lang=koda">
              ${makeCirclePlayIcon()}
              <span>Awaiting contribution</span>
            </a>
          </div>
        </li>` : "";

      rowsEl.innerHTML = rowsHtml + kodaRow;
    }

    buildRows(words[idx % words.length]);
    if (rotateBtn) {
      rotateBtn.addEventListener("click", () => {
        idx = (idx + 1) % words.length;
        const nextWord = words[idx];
        clearTimeout(switchTimer);
        conceptEl.classList.add("is-switching");
        rowsEl.classList.add("is-switching");
        switchTimer = setTimeout(() => {
          buildRows(nextWord);
          requestAnimationFrame(() => {
            conceptEl.classList.remove("is-switching");
            rowsEl.classList.remove("is-switching");
          });
        }, 160);
      });
    }
    rowsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button.bv-play-btn");
      if (btn) playCadence(Number(btn.dataset.freq || 293.66), statusEl, btn.dataset.label || "Placeholder");
    });
  }

  function initCategoryChart(){
    const el = document.getElementById("bv-category-chart");
    if (!el) return;
    el.innerHTML = DATA.CATEGORY_GLYPHS.map(g => `
      <a class="bv-glyph-cell" href="${g.href}">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.svg}</svg>
        <span>${escapeHtml(g.key)}</span>
      </a>`).join("");
  }

  function initLatestAdditions(){
    const el = document.getElementById("bv-additions-grid");
    if (!el) return;
    const randRot = -2 + (Math.random() * 1.4 - 0.7);
    el.innerHTML = DATA.LATEST_ADDITIONS.map(rec => `
      <article class="bv-addition-tile">
        <div style="display:grid;gap:.8rem;">
          <div class="bv-addition-photo bv-addition-photo--grain">
            <img src="${rec.img}" alt="${escapeHtml(rec.alt)}" loading="lazy"/>
          </div>
          <h3 style="font-size:1.3rem;line-height:1.22;margin:0;"><a href="${rec.href}" style="text-decoration:none;">${escapeHtml(rec.title)}</a></h3>
          <p class="bv-addition-meta-line">${escapeHtml(rec.langName + " · " + rec.type + " · " + rec.rights)}</p>
        </div>
        <div class="bv-addition-foot">
          ${rec.showStamp
            ? makeStampSvg(rec.id, rec.dateReceived, randRot)
            : `<span>${escapeHtml(rec.id)}</span>`}
          <a href="${rec.sourceUrl}" target="_blank" rel="noopener" style="text-decoration:none;">Licence</a>
        </div>
      </article>`).join("");
  }

  let scrollToTarget = (y) => {
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  /* Heavy, weighted archival scroll inertia for desktop wheel + anchor jumps */
  function initHeavySmoothScroll(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !finePointer) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let rafId = 0;
    let internalScroll = false;

    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    function tick(){
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.45) {
        currentY = targetY;
        internalScroll = true;
        window.scrollTo(0, currentY);
        internalScroll = false;
        rafId = 0;
        return;
      }
      currentY += diff * 0.082;
      internalScroll = true;
      window.scrollTo(0, currentY);
      internalScroll = false;
      rafId = requestAnimationFrame(tick);
    }

    document.documentElement.style.scrollBehavior = "auto";

    scrollToTarget = (y, immediate) => {
      const clamped = Math.max(0, Math.min(maxScroll(), y));
      if (immediate) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        currentY = targetY = clamped;
        internalScroll = true;
        window.scrollTo(0, clamped);
        internalScroll = false;
        return;
      }
      targetY = clamped;
      if (!rafId) {
        currentY = window.scrollY;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("wheel", (e) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 0.01) return;
      if (e.target.closest("#bv-india-map, select, textarea, [data-native-scroll]")) return;
      let el = e.target;
      while (el && el !== document.body && el !== document.documentElement) {
        const st = getComputedStyle(el);
        if ((st.overflowY === "auto" || st.overflowY === "scroll") && el.scrollHeight > el.clientHeight) return;
        el = el.parentElement;
      }
      e.preventDefault();
      const mult = e.deltaMode === 1 ? 34 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = e.deltaY * mult * 0.88;
      targetY = Math.max(0, Math.min(maxScroll(), targetY + delta));
      if (!rafId) {
        currentY = window.scrollY;
        rafId = requestAnimationFrame(tick);
      }
    }, { passive: false });

    window.addEventListener("scroll", () => {
      if (!internalScroll && !rafId) {
        currentY = targetY = window.scrollY;
      }
    }, { passive: true });

    window.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        setTimeout(() => { currentY = targetY = window.scrollY; }, 0);
      }
    });

    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href").slice(1);
      const targetEl = id ? document.getElementById(id) : null;
      if (!targetEl) return;
      e.preventDefault();
      const top = window.scrollY + targetEl.getBoundingClientRect().top;
      scrollToTarget(top, false);
    });
  }

  /* Scroll-linked & manually scrubbable horizontal book spread across all 9 archive languages */
  function initSpecimenSpread(){
    const section = document.getElementById("s-spread");
    const viewport = document.getElementById("bv-spread-viewport");
    const track = document.getElementById("bv-spread-track");
    const pipsEl = document.getElementById("bv-spread-pips");
    const scrubber = document.getElementById("bv-spread-scrubber");
    const fillEl = document.getElementById("bv-scrubber-fill");
    const pctEl = document.getElementById("bv-scrubber-pct");
    const counterEl = document.getElementById("bv-spread-counter");
    const prevBtn = document.getElementById("bv-spread-prev");
    const nextBtn = document.getElementById("bv-spread-next");
    const statusEl = document.getElementById("bv-spread-status");
    const langs = DATA.LANGUAGES || [];
    if (!section || !track || !langs.length) return;

    const total = langs.length;
    const maxPos = Math.max(1, total - 1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad2 = n => String(n).padStart(2, "0");

    if (scrubber) scrubber.max = String(maxPos * 100);

    track.innerHTML = langs.map((lang, i) => {
      const catId = `BV-S${pad2(i + 1)}`;
      const isStub = !lang.scriptSpecimen && !lang.words;
      const giantHtml = lang.nativeScript
        ? `<div class="bv-giant-glyph" lang="${lang.langAttr}">${escapeHtml(lang.nativeScript)}</div>`
        : `<div class="bv-giant-glyph bv-giant-glyph--stub">Koda</div>`;

      const specimenHtml = lang.scriptSpecimen
        ? `<div class="bv-specimen-tiers" lang="${lang.langAttr}">
             <div class="bv-tier-display">${escapeHtml(lang.scriptSpecimen.vowels)}</div>
             <div class="bv-tier-text">${escapeHtml(lang.scriptSpecimen.consonants)}</div>
             <div class="bv-tier-caption">${escapeHtml(lang.scriptSpecimen.note)}</div>
           </div>`
        : `<div class="bv-specimen-tiers">
             <div class="bv-tier-display">Script to be verified</div>
             <div class="bv-tier-caption">Awaiting community guidance on preferred naming, orthography, and spoken documentation.</div>
           </div>`;

      let mediaOrContextHtml = "";
      if (lang.featuredImg) {
        mediaOrContextHtml = `
          <div class="bv-photo-tile" style="border-radius:16px;aspect-ratio:16/3.9;">
            <img src="${lang.featuredImg}" alt="${escapeHtml(lang.featuredAlt || lang.name)}" loading="lazy">
          </div>
          <p style="margin:0;font-size:.86rem;color:var(--color-muted);">Plate: ${escapeHtml(lang.featuredCredit || "")}</p>`;
      } else if (lang.words) {
        const w = lang.words;
        mediaOrContextHtml = `
          <div class="bv-recto-lexicon" aria-label="${escapeHtml(lang.name)} sample words">
            ${["water", "home", "song"].map(k => `
              <div class="bv-recto-lex-item">
                <span class="bv-recto-lex-script" lang="${lang.langAttr}">${escapeHtml(w[k].script)}</span>
                <span class="bv-recto-lex-meta">${escapeHtml(w[k].roman)} · ${k}</span>
              </div>`).join("")}
          </div>`;
      } else {
        mediaOrContextHtml = `
          <div class="bv-recto-stub">
            <strong>${escapeHtml(lang.rightsBadge)}</strong>
            <span>No invented words or plates are displayed. Community speakers and contributors can deposit verified terms directly.</span>
          </div>`;
      }

      const headingText = lang.id === "tulu"
        ? "Tulu and the Tigalari folio tradition"
        : `${lang.name} — ${lang.scriptLabel} witness`;

      const ctaHtml = isStub
        ? `<div style="display:flex;flex-wrap:wrap;gap:.65rem;">
             <a class="bv-btn bv-btn--solid" href="contribute.html?lang=${encodeURIComponent(lang.id)}">Contribute ${escapeHtml(lang.name.split(" ")[0])} records</a>
             <a class="bv-btn" href="language-profile.html?lang=${encodeURIComponent(lang.id)}">Open profile</a>
           </div>`
        : `<a class="bv-btn" href="language-profile.html?lang=${encodeURIComponent(lang.id)}">Read full ${escapeHtml(lang.name)} profile</a>`;

      return `
        <article class="bv-spread-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${escapeHtml(lang.name)}" data-slide-idx="${i}">
          <div class="bv-book-spread" style="--lang-accent:${lang.accent};--lang-accent-dark:${lang.accentDark}">
            <div class="bv-book-verso">
              <div>
                <p style="margin:0 0 .85rem;color:var(--color-muted-on-dark);">Featured Specimen · ${escapeHtml(lang.family)} · ${escapeHtml(lang.state)}</p>
                ${giantHtml}
              </div>
              ${specimenHtml}
            </div>
            <div class="bv-book-recto">
              <div style="display:grid;gap:.85rem;">
                <span class="bv-hand-note">${escapeHtml(lang.preferredNameNote || (lang.scriptLabel + " tradition"))}</span>
                <h2 style="font-size:clamp(1.5rem,2.5vw,2.15rem);margin:0;">${escapeHtml(headingText)}</h2>
                <p style="margin:0;font-size:.98rem;">${escapeHtml(lang.historyNote || lang.summary)}</p>
                ${mediaOrContextHtml}
              </div>
              <div>${ctaHtml}</div>
            </div>
          </div>
          <footer class="bv-folio-footer" aria-label="${escapeHtml(lang.name)} folio metadata">
            <span>Catalogue ${catId}</span>
            <span>Collection: ${escapeHtml(lang.family)} — ${escapeHtml(lang.state)}</span>
            <span>Status: ${escapeHtml(lang.rightsBadge)}</span>
            <span>Page ${pad2(i + 1)} of ${pad2(total)}</span>
          </footer>
        </article>`;
    }).join("");

    if (pipsEl) {
      pipsEl.innerHTML = langs.map((lang, i) => `
        <button type="button" class="bv-folio-pip" data-folio="${i}" ${i === 0 ? 'aria-current="true"' : ""}>
          <span>${pad2(i + 1)}</span>
          <span>${escapeHtml(lang.name.split(" ")[0])}</span>
        </button>`).join("");
    }

    const slides = [...track.querySelectorAll(".bv-spread-slide")];
    const pipBtns = pipsEl ? [...pipsEl.querySelectorAll(".bv-folio-pip")] : [];

    let targetPos = 0;
    let visualPos = 0;
    let lastIndex = 0;
    let isDraggingScrubber = false;
    let rafRunning = false;
    let settleTimer = null;

    const isStickyMode = () => window.innerWidth >= 896 && !reduced;

    function computeStickyPos(){
      const rect = section.getBoundingClientRect();
      const span = Math.max(1, section.offsetHeight - window.innerHeight);
      const raw = Math.max(0, Math.min(1, (-rect.top) / span));
      return raw * maxPos;
    }

    function applyVisual(pos){
      track.style.transform = `translate3d(${(-pos * 100).toFixed(4)}%, 0, 0)`;
      if (!reduced) {
        slides.forEach((sl, idx) => {
          const dist = Math.min(1, Math.abs(idx - pos));
          sl.style.opacity = (1 - dist * 0.45).toFixed(3);
        });
      }

      const activeIdx = Math.max(0, Math.min(total - 1, Math.round(pos)));
      const lang = langs[activeIdx];
      if (fillEl) fillEl.style.width = `${((pos / maxPos) * 100).toFixed(2)}%`;
      if (scrubber && !isDraggingScrubber) scrubber.value = String(Math.round(pos * 100));
      if (pctEl) pctEl.textContent = `${pad2(activeIdx + 1)} · ${pad2(total)}`;
      if (counterEl && lang) counterEl.textContent = `Folio ${pad2(activeIdx + 1)} / ${pad2(total)} · ${lang.name}`;

      if (activeIdx !== lastIndex) {
        pipBtns.forEach((b, idx) => b.setAttribute("aria-current", idx === activeIdx ? "true" : "false"));
        if (prevBtn) {
          const prevWasFocused = document.activeElement === prevBtn;
          prevBtn.disabled = activeIdx === 0;
          if (prevBtn.disabled && prevWasFocused && nextBtn) nextBtn.focus();
        }
        if (nextBtn) {
          const nextWasFocused = document.activeElement === nextBtn;
          nextBtn.disabled = activeIdx === total - 1;
          if (nextBtn.disabled && nextWasFocused && prevBtn) prevBtn.focus();
        }
        lastIndex = activeIdx;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          if (statusEl && lang) statusEl.textContent = `Folio ${activeIdx + 1} of ${total}: ${lang.name}`;
        }, 280);
      }
    }

    function loop(){
      const diff = targetPos - visualPos;
      if (Math.abs(diff) < 0.0035 || reduced) {
        visualPos = targetPos;
        applyVisual(visualPos);
        rafRunning = false;
        return;
      }
      visualPos += diff * 0.125;
      applyVisual(visualPos);
      requestAnimationFrame(loop);
    }

    function ensureAnimating(){
      if (reduced) {
        visualPos = targetPos;
        applyVisual(visualPos);
        return;
      }
      if (!rafRunning) {
        rafRunning = true;
        requestAnimationFrame(loop);
      }
    }

    function goToPosition(pos, immediate){
      const clamped = Math.max(0, Math.min(maxPos, pos));
      if (isStickyMode()) {
        const docTop = window.scrollY + section.getBoundingClientRect().top;
        const span = Math.max(1, section.offsetHeight - window.innerHeight);
        scrollToTarget(docTop + (clamped / maxPos) * span, !!immediate);
      } else {
        targetPos = clamped;
        ensureAnimating();
      }
    }

    window.addEventListener("scroll", () => {
      if (isStickyMode()) {
        targetPos = computeStickyPos();
        ensureAnimating();
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (isStickyMode()) {
        targetPos = computeStickyPos();
      }
      applyVisual(visualPos);
    });

    if (prevBtn) {
      prevBtn.disabled = true;
      prevBtn.addEventListener("click", () => goToPosition(Math.round(targetPos) - 1, false));
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => goToPosition(Math.round(targetPos) + 1, false));
    }
    if (pipsEl) {
      pipsEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".bv-folio-pip");
        if (btn) goToPosition(Number(btn.dataset.folio || 0), false);
      });
    }
    if (scrubber) {
      scrubber.addEventListener("pointerdown", () => { isDraggingScrubber = true; });
      window.addEventListener("pointerup", () => { isDraggingScrubber = false; });
      scrubber.addEventListener("input", () => {
        const pos = Number(scrubber.value) / 100;
        goToPosition(pos, true);
      });
    }

    if (viewport) {
      let startX = 0;
      let startY = 0;
      viewport.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      }, { passive: true });
      viewport.addEventListener("touchend", (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          goToPosition(Math.round(targetPos) + (dx < 0 ? 1 : -1), false);
        }
      }, { passive: true });
    }

    applyVisual(0);
  }

  function renderDirectoryCards(){
    const grid = document.getElementById("lang-grid");
    if (!grid || !grid.classList.contains("bv-dir-masonry")) return;

    const statusEl = document.getElementById("bv-dir-audio-status");
    grid.innerHTML = DATA.LANGUAGES.map(lang => {
      const w = lang.words && lang.words.water;
      const familyLine = lang.familyDisplay || `${lang.family} · ${lang.scriptLabel}`;
      const metricsLine = lang.realAudioCount > 0
        ? `${lang.speakers} · ${lang.realAudioCount} recordings`
        : lang.speakers;

      const scriptStage = lang.words
        ? `<div class="bv-lang-script-stage">
             <span class="bv-lang-script-hero" lang="${lang.langAttr}">${escapeHtml(lang.nativeScript)}</span>
             ${lang.secondaryScript ? `<span class="bv-secondary-script" lang="${lang.secondaryLangAttr}">${escapeHtml(lang.secondaryScript)}</span>` : ""}
           </div>`
        : `<div class="bv-lang-script-stage">
             <div class="bv-script-stub-box">Script to be verified</div>
           </div>`;

      const actionControl = w
        ? `<button type="button" class="bv-play-btn" data-freq="${w.freq}" data-label="${escapeHtml(lang.name + " — " + w.roman + ", water (" + w.ipa + ")")}">
             ${makeCirclePlayIcon()}
             ${makeWaveform()}
             <span>${escapeHtml(w.roman + ", water")}</span>
           </button>`
        : `<a class="bv-play-btn" href="contribute.html?lang=${encodeURIComponent(lang.id)}">
             ${makeCirclePlayIcon()}
             <span>Awaiting contribution</span>
           </a>`;

      return `
        <article class="bv-lang-card"
          data-state="${escapeHtml(lang.state)}"
          data-family="${escapeHtml(lang.family)}"
          data-script="${escapeHtml(lang.scriptCode)}"
          data-resource="${escapeHtml(lang.resources.join(","))}"
          style="--lang-accent:${lang.accent};--lang-accent-dark:${lang.accentDark}">
          <div>
            <div class="bv-card-top">
              <span class="bv-rights-chip">${escapeHtml(lang.rightsBadge)}</span>
              <span class="bv-corner-state">${escapeHtml(lang.state)}</span>
            </div>

            ${scriptStage}

            <h2 style="font-size:1.65rem;margin:.1rem 0 .25rem;">
              <a href="language-profile.html?lang=${encodeURIComponent(lang.id)}" style="text-decoration:none;">${escapeHtml(lang.name)}</a>
            </h2>
            <p class="bv-lang-family-line">${escapeHtml(familyLine)}</p>
            <p class="bv-lang-desc">${escapeHtml(lang.summary)}</p>
          </div>

          <div class="bv-lang-footer">
            <p class="bv-lang-metrics-line">${escapeHtml(metricsLine)}</p>
            <div class="bv-lang-actions">
              ${actionControl}
            </div>
          </div>
        </article>`;
    }).join("");

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button.bv-play-btn");
      if (btn) playCadence(Number(btn.dataset.freq || 293.66), statusEl, btn.dataset.label || "Placeholder");
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!canRenderChar("\u{110D0}", '48px "Noto Sans Sora Sompeng"')) {
          document.querySelectorAll('[lang="srb"]').forEach(el => {
            if (el.textContent.includes("\u{110D0}")) el.textContent = "Sora";
          });
        }
        if (!canRenderChar("\u1C5A", '48px "Noto Sans Ol Chiki"')) {
          document.querySelectorAll('[lang="sat"]').forEach(el => {
            el.textContent = "सँताली";
            el.setAttribute("lang", "hi");
          });
        }
      });
    }
  }

  function ensureStampFilter(){
    if (document.getElementById("bv-stamp-ink")) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sr-only");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.innerHTML = `<defs><filter id="bv-stamp-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="11" result="tex"/><feDisplacementMap in="SourceGraphic" in2="tex" scale="1.35" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
    document.body.prepend(svg);
  }

  function initLanguageProfile(){
    const root = document.getElementById("bv-profile-root");
    if (!root) return;
    ensureStampFilter();
    const qLang = new URLSearchParams(location.search).get("lang") || "tulu";
    const lang = DATA.LANGUAGES.find(l => l.id === qLang) || DATA.LANGUAGES[0];
    document.title = `${lang.name} | Language Profile | BhashaVerse`;

    const crumb = document.getElementById("bv-profile-crumb");
    if (crumb) crumb.textContent = lang.name;

    const statusEl = document.getElementById("bv-profile-audio-status");
    const isKoda = !lang.words;
    const wWater = lang.words && lang.words.water;

    const heroPlayHtml = wWater
      ? `<button type="button" class="bv-play-btn" data-freq="${wWater.freq}" data-label="${escapeHtml(lang.name + " — " + wWater.roman + ", water")}">${makeCirclePlayIcon()}${makeWaveform()}<span>${escapeHtml(wWater.roman + ", water")}</span></button>`
      : `<a class="bv-play-btn" href="contribute.html?lang=koda">${makeCirclePlayIcon()}<span>Awaiting contribution</span></a>`;

    const vellumStage = isKoda
      ? `<div class="bv-vellum-stage">
           <div class="bv-script-stub-box" style="height:6.5rem;">Script to be verified</div>
           <div class="bv-vellum-sheet">
             <p style="margin:0 0 .35rem;font-weight:600;">${escapeHtml(lang.name)}</p>
             <p style="margin:0;font-size:.92rem;color:var(--color-muted);">${escapeHtml(lang.preferredNameNote)}</p>
             <p style="margin:.45rem 0 0;font-size:.9rem;color:var(--color-muted);">${escapeHtml(lang.speakers)} · ${escapeHtml(lang.state)}</p>
           </div>
         </div>`
      : `<div class="bv-vellum-stage">
           <div class="bv-vellum-backdrop" lang="${lang.langAttr}" aria-hidden="true">${escapeHtml(lang.nativeScript)}</div>
           <div class="bv-vellum-sheet">
             <p style="margin:0 0 .25rem;font-weight:600;">${escapeHtml(lang.name)} · ${escapeHtml(lang.scriptLabel)}</p>
             <p style="margin:0;font-size:.92rem;color:var(--color-muted);">${escapeHtml(lang.family)} · ${escapeHtml(lang.speakers)} · ${escapeHtml(lang.state)}</p>
           </div>
         </div>`;

    const specimenBlock = lang.scriptSpecimen
      ? `<div class="bv-profile-two">
           <div class="bv-book-verso" style="min-height:16rem;">
             <div>
               <p style="margin:0 0 .75rem;color:var(--color-muted-on-dark);font-size:.9rem;">${escapeHtml(lang.scriptLabel)} Specimen</p>
               <div class="bv-tier-display" lang="${lang.langAttr}">${escapeHtml(lang.scriptSpecimen.vowels)}</div>
               <div class="bv-tier-text" lang="${lang.langAttr}" style="margin-top:.75rem;">${escapeHtml(lang.scriptSpecimen.consonants)}</div>
             </div>
             <p class="bv-tier-caption" style="margin:0;">${escapeHtml(lang.scriptSpecimen.note)}</p>
           </div>
           ${lang.featuredImg
             ? `<figure style="margin:0;"><div class="bv-tile-photo"><img src="${lang.featuredImg}" alt="${escapeHtml(lang.featuredAlt)}" loading="lazy"></div><figcaption style="margin-top:.65rem;font-size:.9rem;color:var(--color-muted);">${escapeHtml(lang.featuredCredit)}</figcaption></figure>`
             : `<div class="bv-tile-stub">Community photograph plate awaiting permission clearance for ${escapeHtml(lang.name)}.</div>`}
         </div>`
      : `<div class="bv-tile-stub" style="aspect-ratio:auto;padding:2rem;">Script specimen awaiting verification with ${escapeHtml(lang.name)} community speakers. Do not guess orthography before community guidance.</div>`;

    const vocabRows = lang.words
      ? Object.entries(lang.words).map(([meaning, w]) => `
          <tr>
            <td style="font-family:var(--font-indic);font-size:1.55rem;" lang="${lang.langAttr}">${escapeHtml(w.script)}</td>
            <td><strong>${escapeHtml(w.roman)}</strong></td>
            <td style="color:var(--color-muted);">${escapeHtml(w.ipa)}</td>
            <td>${escapeHtml(meaning)}</td>
            <td>
              <button type="button" class="bv-play-btn" data-freq="${w.freq}" data-label="${escapeHtml(lang.name + " — " + w.roman + ", " + meaning)}">
                ${makeCirclePlayIcon()}<span>Hear</span>
              </button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="5">Lexical records awaiting community submission. <a href="contribute.html?lang=koda">Submit a verified word or recording →</a></td></tr>`;

    const relLib = DATA.LIBRARY_ITEMS.filter(it => it.langId === lang.id);
    const relGal = DATA.GALLERY_ITEMS.filter(it => it.langId === lang.id);

    root.innerHTML = `
      <div class="bv-profile-hero" style="--lang-accent:${lang.accent};--lang-accent-dark:${lang.accentDark}">
        <div style="display:grid;gap:1rem;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;">
            <span class="bv-rights-chip">${escapeHtml(lang.rightsBadge)}</span>
            ${makeStampSvg("BV-LANG-" + lang.id.toUpperCase().slice(0,4), "ARCHIVE PROFILE", -1.6)}
          </div>
          <h1 class="bv-page-title">${escapeHtml(lang.name)}</h1>
          <span class="bv-hand-note">${escapeHtml(lang.preferredNameNote || lang.state)}</span>
          <p style="margin:0;max-width:54ch;">${escapeHtml(lang.summary)}</p>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.85rem 1.5rem;margin-top:.35rem;">
            ${heroPlayHtml}
            <a class="bv-text-arrow-link" href="contribute.html?lang=${encodeURIComponent(lang.id)}">Contribute record or correction <span aria-hidden="true">→</span></a>
          </div>
        </div>
        ${vellumStage}
      </div>

      <nav class="bv-onpage-strip" aria-label="Profile sections">
        <a href="#s0">Names</a>
        <a href="#s1">Overview</a>
        <a href="#s2">Geography</a>
        <a href="#s4">Writing system</a>
        <a href="#s6">Vocabulary</a>
        <a href="#s7">Library &amp; Media</a>
        <a href="#s9">Provenance</a>
      </nav>

      <div class="bv-profile-sections" style="--lang-accent:${lang.accent}">
        <section class="bv-profile-block" id="s0">
          <h2>Names &amp; overview</h2>
          <p id="s1" style="margin:0;max-width:65ch;"><strong>Preferred terminology:</strong> ${escapeHtml(lang.preferredNameNote || lang.name)}.</p>
          <p style="margin:0;max-width:65ch;color:var(--color-muted);">${escapeHtml(lang.historyNote)}</p>
        </section>

        <section class="bv-profile-block" id="s2">
          <h2>Geographic distribution &amp; classification</h2>
          <p style="margin:0;"><strong>Classification:</strong> ${escapeHtml(lang.familyDisplay || lang.family)} · <strong>Region:</strong> ${escapeHtml(lang.coords.regionNote)} · <a href="map.html?lang=${encodeURIComponent(lang.id)}">View on India map →</a></p>
          <p style="margin:0;font-size:.92rem;color:var(--color-muted);">Approximate regional indicator only; boundaries are not definitive.</p>
        </section>

        <section class="bv-profile-block" id="s4">
          <h2>Writing system &amp; heritage witness</h2>
          ${specimenBlock}
        </section>

        <section class="bv-profile-block" id="s6">
          <h2>Vocabulary specimen</h2>
          <table class="bv-table-editorial">
            <thead><tr><th>Script</th><th>Roman</th><th>IPA</th><th>Meaning</th><th>Audio cue</th></tr></thead>
            <tbody>${vocabRows}</tbody>
          </table>
        </section>

        <section class="bv-profile-block" id="s7">
          <h2>Related archive records</h2>
          <div class="bv-card-grid-2">
            <div class="bv-tile-editorial">
              <h3 style="margin:0;font-size:1.25rem;">Library entries</h3>
              ${relLib.length
                ? `<ul style="margin:0;padding-left:1.1rem;display:grid;gap:.45rem;">${relLib.map(it => `<li><a href="library-item.html?id=${encodeURIComponent(it.id)}">${escapeHtml(it.title)}</a> <span style="color:var(--color-muted);font-size:.88rem;">(${escapeHtml(it.rights)})</span></li>`).join("")}</ul>`
                : `<p style="margin:0;color:var(--color-muted);">No library entries yet for ${escapeHtml(lang.name)}.</p>`}
              <a href="library.html" class="bv-text-arrow-link">Open Digital Library <span aria-hidden="true">→</span></a>
            </div>
            <div class="bv-tile-editorial">
              <h3 style="margin:0;font-size:1.25rem;">Photographs &amp; media</h3>
              ${relGal.length
                ? `<ul style="margin:0;padding-left:1.1rem;display:grid;gap:.45rem;">${relGal.map(it => `<li><a href="gallery.html">${escapeHtml(it.title)}</a> <span style="color:var(--color-muted);font-size:.88rem;">(${escapeHtml(it.rights)})</span></li>`).join("")}</ul>`
                : `<p style="margin:0;color:var(--color-muted);">No verified photographs published yet for ${escapeHtml(lang.name)}.</p>`}
              <a href="gallery.html" class="bv-text-arrow-link">Open Photo &amp; Video Archive <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <section class="bv-profile-block" id="s9">
          <footer class="bv-folio-footer" style="margin-top:0;">
            <span>Catalogue BV-PROF-${escapeHtml(lang.id.toUpperCase())}</span>
            <span>Region: ${escapeHtml(lang.state)}</span>
            <span>Status: ${escapeHtml(lang.rightsBadge)}</span>
            <a href="contact.html">Report a correction</a>
          </footer>
        </section>
      </div>`;

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button.bv-play-btn");
      if (btn) playCadence(Number(btn.dataset.freq || 293.66), statusEl, btn.dataset.label || lang.name);
    });
  }

  function initMapExplorer(){
    const svg = document.getElementById("bv-india-map");
    const inspector = document.getElementById("bv-map-inspector");
    const list = document.getElementById("bv-map-list");
    const readout = document.getElementById("bv-map-state-readout");
    if (!svg || !inspector || !list) return;

    const GEO = window.BhashaVerseGeo;
    const proj = (lat, lng) => GEO ? GEO.project(lat, lng) : [Number(((lng - 67) * 20).toFixed(1)), Number(((37.5 - lat) * 20).toFixed(1))];
    const W = GEO ? GEO.viewBox[2] : 640;
    const H = GEO ? GEO.viewBox[3] : 720;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    let gridSvg = "";
    for (let ln = 70; ln <= 95; ln += 5) {
      const [x] = proj(20, ln);
      gridSvg += `<line class="bv-map-graticule" x1="${x}" y1="0" x2="${x}" y2="${H}"/><text class="bv-map-tick" x="${x + 4}" y="14">${ln}°E</text>`;
    }
    for (let la = 10; la <= 35; la += 5) {
      const [, y] = proj(la, 80);
      gridSvg += `<line class="bv-map-graticule" x1="0" y1="${y}" x2="${W}" y2="${y}"/><text class="bv-map-tick" x="6" y="${y - 4}">${la}°N</text>`;
    }

    const statesSvg = GEO ? GEO.states.map(st => `<path class="bv-map-state" data-state-name="${escapeHtml(st.name)}" d="${st.d}"/>`).join("") : "";

    // Offset adjacent labels cleanly so neighbouring markers (Sora/Kui, Santali/Koda) never collide
    const labelOffset = {
      tulu:    [-11,  4, "end"],
      toda:    [ 11,  6, "start"],
      sora:    [-11, 10, "end"],
      kui:     [-11, -6, "end"],
      gondi:   [-11,  4, "end"],
      bhili:   [-11,  4, "end"],
      santali: [-11, -6, "end"],
      koda:    [ 11,  6, "start"],
      mishing: [-10,-10, "end"]
    };

    const pinsSvg = DATA.LANGUAGES.map(l => {
      const [cx, cy] = proj(l.coords.lat, l.coords.lng);
      const isKoda = !l.words;
      const [dx, dy, anchor] = labelOffset[l.id] || [11, 4, "start"];
      return `
        <g class="bv-map-pin" data-lang="${l.id}" tabindex="0" role="button" aria-label="${escapeHtml(l.name + " — " + l.coords.regionNote)}">
          <circle class="bv-pin-halo" cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${l.accentDark}" stroke-width="1.6"/>
          <circle cx="${cx}" cy="${cy}" r="${isKoda ? 6 : 6.8}" fill="${isKoda ? "#0E0E0E" : l.accentDark}" stroke="#EFEDE8" stroke-width="1.6" ${isKoda ? 'stroke-dasharray="3 2"' : ""}/>
          <text x="${cx + dx}" y="${cy + dy}" text-anchor="${anchor}">${escapeHtml(l.id === "koda" ? "Koda" : l.name)}</text>
        </g>`;
    }).join("");

    svg.innerHTML = `<g id="bv-map-viewport">${gridSvg}${statesSvg}${pinsSvg}</g>`;
    list.innerHTML = DATA.LANGUAGES.map(l => `<li><button type="button" class="bv-map-lang-btn" data-lang="${l.id}" aria-pressed="false">${escapeHtml(l.name)}</button></li>`).join("");

    // Zoom & pan controller
    const vp = document.getElementById("bv-map-viewport");
    let zoom = 1, panX = 0, panY = 0;
    const applyTransform = () => {
      const minX = W * (1 - zoom), minY = H * (1 - zoom);
      panX = Math.max(Math.min(0, minX), Math.min(0, panX));
      panY = Math.max(Math.min(0, minY), Math.min(0, panY));
      vp.setAttribute("transform", `translate(${panX.toFixed(1)}, ${panY.toFixed(1)}) scale(${zoom.toFixed(3)})`);
    };
    const setZoom = (next) => {
      const prev = zoom;
      zoom = Math.max(1, Math.min(4, next));
      const ratio = zoom / prev;
      panX = W / 2 - (W / 2 - panX) * ratio;
      panY = H / 2 - (H / 2 - panY) * ratio;
      applyTransform();
    };
    document.getElementById("bv-map-zin")?.addEventListener("click", () => setZoom(zoom * 1.4));
    document.getElementById("bv-map-zout")?.addEventListener("click", () => setZoom(zoom / 1.4));
    document.getElementById("bv-map-zreset")?.addEventListener("click", () => { zoom = 1; panX = 0; panY = 0; applyTransform(); });

    let dragging = false, startX = 0, startY = 0;
    svg.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".bv-map-pin")) return;
      dragging = true; startX = e.clientX; startY = e.clientY;
      svg.classList.add("is-panning");
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const rect = svg.getBoundingClientRect();
      const s = W / rect.width;
      panX += (e.clientX - startX) * s;
      panY += (e.clientY - startY) * s;
      startX = e.clientX; startY = e.clientY;
      applyTransform();
    });
    window.addEventListener("pointerup", () => { dragging = false; svg.classList.remove("is-panning"); });

    svg.addEventListener("mouseover", (e) => {
      const st = e.target.closest(".bv-map-state");
      if (readout) readout.textContent = st ? `${st.dataset.stateName} · approx. survey layer` : "Survey projection · 35 states & territories";
    });

    const selectLang = (id) => {
      const lang = DATA.LANGUAGES.find(l => l.id === id) || DATA.LANGUAGES[0];
      svg.querySelectorAll(".bv-map-pin").forEach(p => p.classList.toggle("is-selected", p.dataset.lang === lang.id));
      list.querySelectorAll(".bv-map-lang-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang.id)));
      inspector.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;">
          <span class="bv-rights-chip">${escapeHtml(lang.rightsBadge)}</span>
          <span style="font-size:.86rem;color:var(--color-muted);">${escapeHtml(lang.state)}</span>
        </div>
        ${lang.nativeScript
          ? `<div style="font-family:var(--font-indic);font-size:3rem;line-height:1.15;" lang="${lang.langAttr}">${escapeHtml(lang.nativeScript)}</div>`
          : `<div class="bv-script-stub-box" style="height:4rem;">Script to be verified</div>`}
        <h2 style="margin:0;font-size:1.75rem;">${escapeHtml(lang.name)}</h2>
        <p style="margin:0;font-size:.94rem;color:var(--color-muted);">${escapeHtml(lang.familyDisplay || `${lang.family} · ${lang.scriptLabel}`)}</p>
        <p style="margin:0;">${escapeHtml(lang.coords.regionNote)}</p>
        <p style="margin:0;font-size:.94rem;color:var(--color-muted);">${escapeHtml(lang.summary)}</p>
        <div class="bv-cta-row">
          <a class="bv-btn bv-btn--solid" href="language-profile.html?lang=${encodeURIComponent(lang.id)}">Open language profile</a>
          ${!lang.words ? `<a class="bv-text-arrow-link" href="contribute.html?lang=koda">Contribute record <span aria-hidden="true">→</span></a>` : ""}
        </div>`;
    };

    svg.addEventListener("click", (e) => {
      const pin = e.target.closest(".bv-map-pin");
      if (pin) selectLang(pin.dataset.lang);
    });
    svg.addEventListener("keydown", (e) => {
      const pin = e.target.closest(".bv-map-pin");
      if (pin && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectLang(pin.dataset.lang); }
    });
    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".bv-map-lang-btn");
      if (btn) selectLang(btn.dataset.lang);
    });
    const initId = new URLSearchParams(location.search).get("lang") || "tulu";
    selectLang(initId);
  }

  function initLibraryPage(){
    const grid = document.getElementById("lib-grid");
    if (!grid) return;
    grid.innerHTML = DATA.LIBRARY_ITEMS.map(item => `
      <article class="bv-tile-editorial"
        data-cat="${escapeHtml(item.category)}"
        data-lang="${escapeHtml(item.langName)}"
        data-fmt="${escapeHtml(item.format)}"
        data-rights="${escapeHtml(item.rights)}">
        <div style="display:grid;gap:.85rem;">
          ${item.img
            ? `<div class="bv-tile-photo"><img src="${item.img}" alt="${escapeHtml(item.alt)}" loading="lazy"></div>`
            : `<div class="bv-tile-stub">${escapeHtml(item.format)} · ${escapeHtml(item.status)}</div>`}
          <span class="bv-rights-chip" style="justify-self:start;">${escapeHtml(item.rights)}</span>
          <h2 style="font-size:1.3rem;line-height:1.25;margin:0;"><a href="library-item.html?id=${encodeURIComponent(item.id)}" style="text-decoration:none;">${escapeHtml(item.title)}</a></h2>
          <p style="margin:0;font-size:.92rem;color:var(--color-muted);">${escapeHtml(item.category)} · ${escapeHtml(item.langName)} · ${escapeHtml(item.format)}</p>
          <p style="margin:0;font-size:.96rem;">${escapeHtml(item.desc)}</p>
        </div>
        <div class="bv-tile-foot">
          <span>${escapeHtml(item.id)}</span>
          <a href="library-item.html?id=${encodeURIComponent(item.id)}" class="bv-text-arrow-link">Inspect record <span aria-hidden="true">→</span></a>
        </div>
      </article>`).join("");
  }

  function initLibraryItem(){
    const root = document.getElementById("bv-lib-item-root");
    if (!root) return;
    ensureStampFilter();
    const id = new URLSearchParams(location.search).get("id") || "BV-LIB-001";
    const item = DATA.LIBRARY_ITEMS.find(it => it.id === id) || DATA.LIBRARY_ITEMS[0];
    document.title = `${item.title} | Digital Library | BhashaVerse`;
    const crumb = document.getElementById("bv-lib-crumb");
    if (crumb) crumb.textContent = item.id;

    const actionHtml = item.canDownload && item.img
      ? `<a class="bv-btn bv-btn--solid" href="${item.img}" download>Download preservation plate (${escapeHtml(item.rights)})</a>`
      : `<button type="button" class="bv-btn" disabled aria-disabled="true" style="opacity:.6;cursor:not-allowed;">Download restricted (${escapeHtml(item.rights)})</button>`;

    root.innerHTML = `
      <div class="bv-detail-split">
        <div style="display:grid;gap:1.25rem;">
          ${item.img
            ? `<div class="bv-tile-photo" style="border-radius:24px;aspect-ratio:16/10;"><img src="${item.img}" alt="${escapeHtml(item.alt)}"></div>`
            : `<div class="bv-tile-stub" style="min-height:20rem;">${escapeHtml(item.status)}</div>`}
          <div class="bv-cta-row">
            ${actionHtml}
            ${item.sourceUrl ? `<a class="bv-text-arrow-link" href="${item.sourceUrl}" target="_blank" rel="noopener">Original source record <span aria-hidden="true">→</span></a>` : ""}
          </div>
        </div>
        <div style="display:grid;gap:1.25rem;">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.75rem;">
            <span class="bv-rights-chip">${escapeHtml(item.rights)}</span>
            ${makeStampSvg(item.id, item.dateNote, -2.1)}
          </div>
          <h1 class="bv-page-title" style="font-size:clamp(1.8rem,3.5vw,2.6rem);">${escapeHtml(item.title)}</h1>
          <p style="margin:0;">${escapeHtml(item.desc)}</p>
          <dl class="bv-meta-dl">
            <dt>Record ID</dt><dd>${escapeHtml(item.id)}</dd>
            <dt>Language</dt><dd><a href="language-profile.html?lang=${encodeURIComponent(item.langId)}">${escapeHtml(item.langName)}</a></dd>
            <dt>Category</dt><dd>${escapeHtml(item.category)}</dd>
            <dt>Author / creator</dt><dd>${escapeHtml(item.creator)}</dd>
            <dt>Publication details</dt><dd>${escapeHtml(item.pubDetails)}</dd>
            <dt>Source</dt><dd>${escapeHtml(item.source)}</dd>
            <dt>Format</dt><dd>${escapeHtml(item.format)}</dd>
            <dt>Citation</dt><dd>${escapeHtml(item.citation)}</dd>
            <dt>Verification status</dt><dd>${escapeHtml(item.status)}</dd>
          </dl>
        </div>
      </div>`;
  }

  function initGalleryPage(){
    const grid = document.getElementById("gal-grid");
    if (!grid) return;
    grid.innerHTML = DATA.GALLERY_ITEMS.map(item => `
      <figure class="bv-tile-editorial" data-col="${escapeHtml(item.collection)}" data-lang="${escapeHtml(item.langName)}">
        <div style="display:grid;gap:.8rem;">
          <div class="bv-tile-photo"><img src="${item.img}" alt="${escapeHtml(item.alt)}" loading="lazy"></div>
          <span class="bv-rights-chip" style="justify-self:start;">${escapeHtml(item.rights)}</span>
          <h2 style="font-size:1.3rem;margin:0;">${escapeHtml(item.title)}</h2>
          <p style="margin:0;font-size:.95rem;">${escapeHtml(item.caption)}</p>
          <p style="margin:0;font-size:.88rem;color:var(--color-muted);">${escapeHtml(item.locationSafe)} · Credit: ${escapeHtml(item.credit)}</p>
        </div>
        <figcaption class="bv-tile-foot">
          <span>${escapeHtml(item.langName)}</span>
          <a href="${item.sourceUrl}" target="_blank" rel="noopener" style="text-decoration:none;">Wikimedia source ↗</a>
        </figcaption>
      </figure>`).join("");
  }

  function initAudioPage(){
    const root = document.getElementById("bv-audio-grid");
    const statusEl = document.getElementById("bv-audio-page-status");
    if (!root) return;
    root.innerHTML = DATA.LANGUAGES.map((lang, idx) => {
      const w = lang.words && lang.words.water;
      return `
        <article class="bv-tile-editorial" style="--lang-accent:${lang.accent};--lang-accent-dark:${lang.accentDark}">
          <div style="display:grid;gap:.75rem;">
            <div class="bv-card-top" style="margin-bottom:0;">
              <span class="bv-rights-chip">${escapeHtml(lang.rightsBadge)}</span>
              <span class="bv-corner-state">${escapeHtml(lang.state)}</span>
            </div>
            <h2 style="font-size:1.45rem;margin:0;"><a href="language-profile.html?lang=${encodeURIComponent(lang.id)}" style="text-decoration:none;">${escapeHtml(lang.name)}</a></h2>
            ${w
              ? `<p style="margin:0;font-family:var(--font-indic);font-size:2.1rem;line-height:1.2;" lang="${lang.langAttr}">${escapeHtml(w.script)}</p>
                 <p style="margin:0;font-size:.94rem;color:var(--color-muted);">Lexical pronunciation placeholder · Speaker credit pending</p>
                 <div>
                   <button type="button" class="bv-play-btn" data-freq="${w.freq}" data-label="${escapeHtml(lang.name + " — " + w.roman + ", water")}">
                     ${makeCirclePlayIcon()}${makeWaveform()}<span>${escapeHtml(w.roman + ", water")}</span>
                   </button>
                 </div>
                 <div>
                   <button type="button" class="hero-transcript-toggle bv-audio-tr-btn" aria-expanded="false" aria-controls="audio-tr-${idx}">Show transcript</button>
                   <div id="audio-tr-${idx}" class="hero-transcript" hidden>
                     <p style="margin:0;">Script: <span lang="${lang.langAttr}">${escapeHtml(w.script)}</span> (${escapeHtml(w.roman)}, ${escapeHtml(w.ipa)})</p>
                     <p style="margin:0;">English: water</p>
                   </div>
                 </div>`
              : `<div class="bv-script-stub-box" style="height:4.5rem;">Audio awaiting community submission</div>
                 <div><a class="bv-play-btn" href="contribute.html?lang=koda">${makeCirclePlayIcon()}<span>Awaiting contribution</span></a></div>`}
          </div>
        </article>`;
    }).join("");

    root.addEventListener("click", (e) => {
      const play = e.target.closest("button.bv-play-btn");
      if (play) playCadence(Number(play.dataset.freq || 293.66), statusEl, play.dataset.label || "Audio cue");
      const tr = e.target.closest(".bv-audio-tr-btn");
      if (tr) {
        const panel = document.getElementById(tr.getAttribute("aria-controls"));
        if (panel) {
          const open = panel.hidden;
          panel.hidden = !open;
          tr.setAttribute("aria-expanded", String(open));
          tr.textContent = open ? "Hide transcript" : "Show transcript";
        }
      }
    });
  }

  function initSimpleEditorialGrids(){
    const hist = document.getElementById("bv-history-grid");
    if (hist) {
      hist.innerHTML = DATA.HISTORY_ITEMS.map(item => `
        <article class="bv-tile-editorial">
          <div style="display:grid;gap:.8rem;">
            <div class="bv-tile-photo"><img src="${item.img}" alt="${escapeHtml(item.alt)}" loading="lazy"></div>
            <span class="bv-corner-state">${escapeHtml(item.category)}</span>
            <h2 style="font-size:1.35rem;margin:0;">${escapeHtml(item.title)}</h2>
            <p style="margin:0;font-size:.96rem;color:var(--color-muted);">${escapeHtml(item.desc)}</p>
          </div>
        </article>`).join("");
    }
    const cult = document.getElementById("bv-culture-grid");
    if (cult) {
      cult.innerHTML = DATA.CULTURE_ITEMS.map(item => `
        <article class="bv-tile-editorial">
          <div style="display:grid;gap:.8rem;">
            <div class="bv-tile-photo"><img src="${item.img}" alt="${escapeHtml(item.alt)}" loading="lazy"></div>
            <span class="bv-corner-state">${escapeHtml(item.category)}</span>
            <h2 style="font-size:1.35rem;margin:0;">${escapeHtml(item.title)}</h2>
            <p style="margin:0;font-size:.96rem;color:var(--color-muted);">${escapeHtml(item.desc)}</p>
          </div>
        </article>`).join("");
    }
    const stor = document.getElementById("bv-stories-grid");
    if (stor) {
      stor.innerHTML = DATA.STORY_ITEMS.map(item => `
        <article class="bv-tile-editorial">
          <div style="display:grid;gap:.8rem;">
            ${item.img ? `<div class="bv-tile-photo"><img src="${item.img}" alt="${escapeHtml(item.title)}" loading="lazy"></div>` : `<div class="bv-tile-stub">Awaiting community contribution</div>`}
            <span class="bv-corner-state">${escapeHtml(item.lang)}</span>
            <h2 style="font-size:1.35rem;margin:0;">${escapeHtml(item.title)}</h2>
            <p style="margin:0;font-size:.96rem;color:var(--color-muted);">${escapeHtml(item.desc)}</p>
          </div>
          <div class="bv-tile-foot">
            <span>${escapeHtml(item.type)}</span>
            <a href="contribute.html" style="text-decoration:none;">Submit a story →</a>
          </div>
        </article>`).join("");
    }
  }

  function initSearchPage(){
    const qInput = document.getElementById("search-page-q");
    const out = document.getElementById("bv-search-results");
    const countEl = document.querySelector(".result-count");
    const emptyEl = document.querySelector(".empty-state");
    if (!qInput || !out) return;

    const initialQ = new URLSearchParams(location.search).get("q") || "";
    qInput.value = initialQ;

    const render = () => {
      const q = qInput.value.toLowerCase().trim();
      const match = (s) => !q || String(s).toLowerCase().includes(q);
      const langs = DATA.LANGUAGES.filter(l => {
        const lex = l.words ? Object.entries(l.words).map(([k, v]) => `${k} ${v.roman} ${v.script}`).join(" ") : "";
        return match(`${l.name} ${l.family} ${l.state} ${l.scriptLabel} ${l.summary} ${lex}`);
      });
      const libs = DATA.LIBRARY_ITEMS.filter(it => match(`${it.title} ${it.langName} ${it.category} ${it.desc} ${it.rights}`));
      const gals = DATA.GALLERY_ITEMS.filter(it => match(`${it.title} ${it.langName} ${it.collection} ${it.caption}`));
      const stories = DATA.STORY_ITEMS.filter(it => match(`${it.title} ${it.lang} ${it.desc}`));

      const groups = [
        ["Languages", langs.map(l => `<li><a href="language-profile.html?lang=${encodeURIComponent(l.id)}"><strong>${escapeHtml(l.name)}</strong></a><span style="font-size:.9rem;color:var(--color-muted);">${escapeHtml(l.family)} · ${escapeHtml(l.state)}</span></li>`)],
        ["Library records", libs.map(it => `<li><a href="library-item.html?id=${encodeURIComponent(it.id)}"><strong>${escapeHtml(it.title)}</strong></a><span style="font-size:.9rem;color:var(--color-muted);">${escapeHtml(it.category)} · ${escapeHtml(it.rights)}</span></li>`)],
        ["Photos &amp; visual records", gals.map(it => `<li><a href="gallery.html"><strong>${escapeHtml(it.title)}</strong></a><span style="font-size:.9rem;color:var(--color-muted);">${escapeHtml(it.langName)} · ${escapeHtml(it.rights)}</span></li>`)],
        ["Community stories", stories.map(it => `<li><a href="stories.html"><strong>${escapeHtml(it.title)}</strong></a><span style="font-size:.9rem;color:var(--color-muted);">${escapeHtml(it.lang)}</span></li>`)]
      ];
      const total = langs.length + libs.length + gals.length + stories.length;
      if (countEl) countEl.textContent = `${total} ${total === 1 ? "result" : "results"}${q ? ` for "${q}"` : ""}`;
      if (emptyEl) emptyEl.hidden = total > 0;
      out.innerHTML = groups.filter(([, rows]) => rows.length > 0).map(([label, rows]) => `
        <section class="bv-search-group">
          <h2 style="font-size:1.35rem;margin:0;">${label} (${rows.length})</h2>
          <ul class="bv-search-list">${rows.join("")}</ul>
        </section>`).join("");
    };

    qInput.addEventListener("input", render);
    render();
  }

  function initAdminQueue(){
    const tbody = document.getElementById("bv-admin-rows");
    const status = document.getElementById("bv-admin-status");
    if (!tbody) return;
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem("bv-submissions") || "[]"); } catch (_) {}
    const rows = [
      ...stored.map(s => ({ title: s.title, type: s.type, lang: s.lang || "Unspecified", status: s.status || "Pending" })),
      { title: "Sample regional wordlist submission (mockup row)", type: "Audio / Text", lang: "Koda (Kora)", status: "Pending" }
    ];
    tbody.innerHTML = rows.map((r, i) => `
      <tr data-idx="${i}">
        <td>${escapeHtml(r.title)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td>${escapeHtml(r.lang)}</td>
        <td class="bv-row-status">${escapeHtml(r.status)}</td>
        <td class="bv-admin-actions">
          <button type="button" data-act="Approved (local mockup)">Approve</button>
          <button type="button" data-act="Clarification requested">Clarify</button>
          <button type="button" data-act="Restricted">Restrict</button>
          <button type="button" data-act="Rejected">Reject</button>
        </td>
      </tr>`).join("");

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const tr = btn.closest("tr");
      tr.querySelector(".bv-row-status").textContent = btn.dataset.act;
      if (status) status.textContent = `Updated mockup row status to: ${btn.dataset.act}`;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeavySmoothScroll();
    initMoreMenu();
    initHeroControls();
    initPoster();
    initCategoryChart();
    initSpecimenSpread();
    initLatestAdditions();
    renderDirectoryCards();
    initLanguageProfile();
    initMapExplorer();
    initLibraryPage();
    initLibraryItem();
    initGalleryPage();
    initAudioPage();
    initSimpleEditorialGrids();
    initSearchPage();
    initAdminQueue();

    const toggle = document.querySelector(".nav-toggle"), nav = document.getElementById("main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    const bar = document.querySelector(".filter-bar");
    const grid = document.querySelector("#lang-grid,#lib-grid,#gal-grid");
    if (bar && grid) {
      const run = () => {
        const q = (bar.querySelector("[data-filter-target]")?.value || "").toLowerCase().trim();
        const spanPattern = [7, 5, 5, 7, 4, 4, 4];
        let count = 0;
        [...grid.children].forEach(el => {
          let ok = !q || el.textContent.toLowerCase().includes(q) || (el.dataset.script || "").toLowerCase().includes(q) || (el.dataset.state || "").toLowerCase().includes(q) || (el.dataset.lang || "").toLowerCase().includes(q);
          bar.querySelectorAll("select[data-filter-key]").forEach(sel => {
            if (!sel.value) return;
            const raw = el.dataset[sel.dataset.filterKey] || "";
            if (sel.dataset.filterKey === "resource" || sel.dataset.filterKey === "script") {
              if (!raw.split(",").map(s => s.trim()).includes(sel.value)) ok = false;
            } else if (raw !== sel.value) {
              ok = false;
            }
          });
          el.hidden = !ok;
          if (ok) {
            el.style.setProperty("--vis-span", String(spanPattern[count % spanPattern.length]));
            count++;
          }
        });
        const rc = document.querySelector(".result-count");
        if (rc) {
          const noun = grid.id === "lang-grid" ? ["language", "languages"] : ["record", "records"];
          rc.textContent = count + " " + (count === 1 ? noun[0] : noun[1]) + " shown";
        }
        const es = document.querySelector(".empty-state");
        if (es) es.hidden = count > 0;
      };
      bar.addEventListener("input", run);
      bar.addEventListener("reset", () => setTimeout(run, 0));
      run();
    }

    /* Prefill contribute form language & store local mockup submissions */
    const form = document.getElementById("contribute-form");
    if (form) {
      const preLang = new URLSearchParams(location.search).get("lang");
      const langInput = form.querySelector('[name="lang"]');
      if (preLang && langInput) {
        const matched = DATA.LANGUAGES.find(l => l.id === preLang);
        langInput.value = matched ? matched.name : preLang;
      }
      form.addEventListener("submit", e => {
        e.preventDefault();
        if (form.reportValidity()) {
          try {
            const arr = JSON.parse(localStorage.getItem("bv-submissions") || "[]");
            arr.unshift({
              title: form.querySelector('[name="title"]')?.value || "Untitled submission",
              type: form.querySelector('[name="type"]')?.value || "Submission",
              lang: form.querySelector('[name="lang"]')?.value || "Unspecified",
              status: "Pending (local browser)"
            });
            localStorage.setItem("bv-submissions", JSON.stringify(arr.slice(0, 10)));
          } catch (_) {}
          form.querySelector(".form-status").hidden = false;
        }
      });
    }

    const contactForm = document.getElementById("bv-contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", e => {
        e.preventDefault();
        if (contactForm.reportValidity()) contactForm.querySelector(".form-status").hidden = false;
      });
    }
  });
})();
