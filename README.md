<div align="center">

<h1>Matrika &nbsp;·&nbsp; मातृका</h1>
<p><em>Digital Archive of India's Underrepresented Languages</em></p>

<p>
  <strong>An archive of India’s underrepresented languages: words, voices, scripts and photographs, shared with community consent.</strong>
</p>

</div>

---

<p align="center">
  <img src="assets/images/loom-weaver-assam.jpg" alt="Handloom weaver at frame in Upper Assam" width="820">
</p>
<p align="center">
  <em>“The loom remembers the river’s old name.”</em><br>
  <sub>Archival visual plate: Assamese handloom weaver · Photo by <a href="https://commons.wikimedia.org/wiki/File:Assamese_woman_using_traditional_handloom.jpg">Deepraj</a> (CC BY 2.5)</sub>
</p>

---

## About Matrika

**Matrika (मातृका)** — pronounced **MAA-tri-kaa** — comes from Sanskrit *mātṛkā*, “little mother”. In the Sanskrit grammatical tradition, the letters of the alphabet are the “mothers” of all speech. It also reads as “mother tongue”.

Matrika is an academic EPICS digital archive built to document, display, and protect India’s underrepresented languages alongside manuscripts, oral histories, photographs, and regional cultural knowledge under transparent rights and consent rules.

---

## Key Architecture & Features

- **Symmetric Editorial Layout & Typography:** Warm rag paper (`#EFEDE8`), vellum surface (`#E3E0D8`), carbon ink (`#0E0E0E`), fluid responsive gutters (`--gutter: clamp(20px, 5vw, 96px)` up to `1680px`), `Fraunces` & `Plus Jakarta Sans` typefaces, and monochrome halftone documentary photography.
- **Rotating Multi-Script Header Wordmark:** Continuously cycles across `Latn` (**Matrika**), `Deva` (**मातृका**), and registry script frames (`Beng`, `Knda`, `Orya`, `Olck`) with `Intl.Segmenter` grapheme-cluster transitions, `FontGate` tofu protection, zero layout shift, and OS `prefers-reduced-motion` static lockup.
- **Smooth View Transitions & Scroll Reveals:** Cross-document View Transitions (`@view-transition`) keeping `site-header` anchored, pre-paint `.js .reveal` fade-rise via one shared `IntersectionObserver`, hairline navigation progress bar, and internal link prefetching.
- **Layered Object-Oriented ES Modules (`js/`):** Clean `config → models → data → services → components → pages` architecture with a single `Container` dependency-injection root in `js/main.js`, `RightsPolicy` enforcement, and zero `innerHTML` data templates.
- **Rights-Aware Digital Library & Gallery:** Separates `public-domain`, `open-licence`, `permission-granted`, `restricted`, and `metadata-only` records; restricted and metadata-only entries never expose unauthorised downloads.
- **Interactive Leaflet Language Map (`map.html`):** Lazy-loads Leaflet `1.9.4` with OpenStreetMap attribution, approximate state/district markers, an accessible non-map button selector, and required orientation disclaimers.
- **Offline Matrika Assistant (`Ask Matrika`):** Client-side index assistant powered by `IntentMatcher`, `KnowledgeBase` (`data/chat/knowledge.json`), and `SearchService`.

---

## Development Setup

Because Matrika uses native ES modules (`<script type="module">`) and `fetch()` to load JSON datasets under `data/`, serve the repository over HTTP during local development:

```bash
python -m http.server
```

Run automated Node unit checks:

```bash
node --test tests/*.test.js
```

---

## Stewardship & Data Notes

- Multiscript wordmark frames in Kannada, Odia, Bengali-Assamese, and Ol Chiki are maintained alongside community consultation.
- Archival records distinguish verified references, oral accounts, community review entries, and awaiting-verification records without fabricating citations or recordings.
- Saved bookmarks and local submission queue entries persist only inside your browser's `localStorage`.
