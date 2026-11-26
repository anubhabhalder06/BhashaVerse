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
  <em>“The loom remembers the river’s old name.” (Demo content)</em><br>
  <sub>Archival visual plate: Assamese handloom weaver · Photo by <a href="https://commons.wikimedia.org/wiki/File:Assamese_woman_using_traditional_handloom.jpg">Deepraj</a> (CC BY 2.5)</sub>
</p>

---

## About Matrika

**Matrika (मातृका)** — pronounced **MAA-tri-kaa** — comes from Sanskrit *mātṛkā*, “little mother”. In the Sanskrit grammatical tradition, the letters of the alphabet are the “mothers” of all speech. It also reads as “mother tongue”.

Matrika is an academic EPICS Review 1 static digital archive prototype designed to document, display, and protect India’s underrepresented languages alongside manuscripts, oral histories, photographs, and regional cultural knowledge under transparent rights and consent rules.

---

## Key Architecture & Features

- **Rotating Multi-Script Header Wordmark:** Cycles smoothly across `Latn` (**Matrika**), `Deva` (**मातृका**), and registry script frames (`Beng`, `Knda`, `Orya`, `Olck`) with `Intl.Segmenter` grapheme-cluster transitions, `FontGate` tofu protection, zero layout shift, `prefers-reduced-motion` static lockup, and a `44×44px` Pause/Play toggle (`matrika:wordmark-paused`).
- **Editorial Paper & Ink Design Tokens (`css/tokens.css`):** Warm rag paper (`#EFEDE8`), vellum surface (`#E3E0D8`), solid carbon ink (`#0E0E0E`), `Fraunces` & `Plus Jakarta Sans` typography, optional high-contrast dark theme toggle (`matrika:theme`), sharp chrome controls against `24px` monochrome halftone photographs.
- **Layered Object-Oriented ES Modules (`js/`):** Clean `config → models → data → services → components → pages` architecture with a single `Container` dependency-injection root in `js/main.js`, `DataSource` / `JsonDataSource` backend swap point, `ContributionStore` / `LocalContributionStore`, `RightsPolicy` enforcement, and zero `innerHTML` data templates.
- **Rights-Aware Digital Library & Gallery:** Separates `public-domain`, `open-licence`, `permission-granted`, `restricted`, and `metadata-only` records; restricted and metadata-only entries never expose unauthorised downloads.
- **Interactive Leaflet Language Map (`map.html`):** Lazy-loads pinned Leaflet `1.9.4` with OpenStreetMap attribution, approximate state/district markers, an accessible non-map button selector, and required orientation disclaimers.
- **Scripted Matrika Assistant (`Ask Matrika`):** Browser-only, zero-network assistant powered by `IntentMatcher`, `KnowledgeBase` (`data/chat/knowledge.json`), and `SearchService`.

---

## Development Setup

Because Matrika uses native ES modules (`<script type="module">`) and `fetch()` to load JSON datasets under `data/`, opening HTML files via `file://` will not work.

Serve the repository over a local HTTP server during development (or use **VS Code Live Server**):

```bash
python -m http.server
```

Run unit tests (Node built-in test runner, zero dependencies):

```bash
npm test
```

---

## Stewardship & Prototype Disclaimer

- Wordmark renderings marked as demonstration are transliterations pending review by native readers.
- Sample records, quotes, and mock audio tracks (`Mock player — no recording`) are Review 1 placeholders pending community verification and consent clearance.
- Submissions, bookmarks, theme settings, and admin mockup status changes stay strictly inside your browser's `localStorage`.
