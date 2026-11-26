# BhashaVerse — India Language & Cultural Heritage Archive

> *“An archive of India’s underrepresented languages: words, voices, scripts and photographs, shared with community consent.”*

BhashaVerse is a community-guided static digital archive prototype designed to document, display, and preserve India’s underrepresented and marginalised languages—connecting scripts, lexical comparisons, archival manuscripts, visual plates, and regional geography within a unified editorial web experience.

**Live Site:** [https://anubhabhalder06.github.io/BhashaVerse/](https://anubhabhalder06.github.io/BhashaVerse/)

---

## Highlights & Key Features

- **Zero-Build Static Architecture:** Runs directly in any modern browser with semantic HTML5, custom CSS design tokens, and modular vanilla JavaScript (`window.BhashaVerseData` & `window.BhashaVerseGeo`).
- **Editorial Hero & Transcript Controls (`index.html`):** Features a Mishing weaving archival photograph (`CC BY 2.5`) with subtle SVG ink-displacement typography, Web Audio tone-preview synthesis (no autoplay), and an accessible collapsible transcript toggle.
- **Interactive Cross-Script Specimen Poster:** Rotates shared core vocabulary (*water*, *home*, *song*) across eight documented writing systems in real time with Romanisation, IPA transcription, and Web Audio previews, alongside a transparent verification placeholder for **Koda (Kora)**.
- **35-Region Cartographic Map of India (`map.html`):** Built from custom cosine-projected SVG vector geometry (`js/india-geo.js`) covering 35 Indian states and union territories, interactive zoom/pan controls, and an approximate language-region inspector.
- **Digital Library with Rights-Gated Access (`library.html`, `library-item.html`):** Filterable catalogue separating openly licensed manuscripts and plates from `Restricted` and `Metadata only` items pending elder/community clearance.
- **Unified Multi-Page Archive (20 Pages):** Full client-side search (`search.html`), script & family filtering (`languages.html`), dynamic profile routing (`language-profile.html?lang=...`), Wikimedia Commons monochrome photo gallery (`gallery.html`), consent-first contribution workflow (`contribute.html`), and a browser-side moderation queue preview (`admin.html`).

---

## Documented Languages (`js/data.js`)

| Language | Family | Primary Region | Script(s) | Archive Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tulu** (`ತುಳು`) | Dravidian | Karnataka / Kerala | Tigalari / Kannada | Sample lexicon & talegari folio |
| **Gondi** (`गोंडी`) | Dravidian | Central Deccan | Devanagari / Masaram | Sample lexicon & Gond art study |
| **Santali** (`ᱥᱟᱱᱛᱟᱲᱤ`) | Austroasiatic | Jharkhand / Odisha | Ol Chiki | Sample lexicon & script chart |
| **Sora** (`𑃐𑃦𑃝` / `ସଉରା`) | Austroasiatic | Odisha / Andhra | Sora Sompeng & Odia | Sample lexicon & palm-leaf bundle |
| **Kui** (`କୁଇ`) | Dravidian | Odisha | Odia / Oral | Sample lexicon & cultural notes |
| **Toda** (`தோதா`) | Dravidian | Tamil Nadu | Tamil / Phonetic | Sample lexicon & 1871 archival plate |
| **Mishing** (`মিশিং`) | Tibeto-Burman | Assam / Arunachal | Assamese / Latin | Sample lexicon & handloom plate |
| **Bhili** (`भीली`) | Indo-Aryan | Gujarat / MP / Rajasthan | Devanagari / Gujarati | Sample lexicon & craft study |
| **Koda (Kora)** | Austroasiatic | West Bengal | *To be verified* | **Awaiting community verification** |

> **Data Integrity Principle:** BhashaVerse avoids fabricating unverified linguistic data. Languages awaiting consultation—such as **Koda (Kora)**—explicitly retain `"to be verified"` markers and open contribution links rather than placeholder translations.

---

## Repository Structure

```text
BhashaVerse/
├── .github/workflows/
│   └── deploy-pages.yml      # GitHub Actions build & GitHub Pages deployment
├── assets/
│   └── images/               # Curated Wikimedia Commons plates + manifest.json
├── css/
│   ├── tokens.css            # Paper (#EFEDE8) & ink (#0E0E0E) typography/colour tokens
│   ├── base.css              # Accessible layout primitives, skip links & focus styles
│   └── editorial.css         # Multi-page grid, hero, map, poster, and print styling
├── js/
│   ├── data.js               # Language, library, gallery, history, culture & story datasets
│   ├── india-geo.js          # 35-state/UT vector paths for India cartographic map
│   └── main.js               # Page renderers, filters, audio synthesis & form logic
├── index.html                # Archive landing page & specimen poster
├── languages.html            # Filterable language directory
├── language-profile.html     # Dynamic language detail view (?lang=<id>)
├── map.html                  # Interactive India language-region map
├── library.html              # Rights-aware digital library catalogue
├── library-item.html         # Single catalogue item detail (?id=<item_id>)
├── gallery.html              # Monochrome archival & craft photography plates
├── audio.html                # Spoken-word showcase & transcript toggles
├── history.html              # Timelines, script movements & regional contexts
├── culture.html              # Festivals, oral traditions, crafts & stewardship
├── stories.html              # Community oral-memory archive slots
├── search.html               # Client-side cross-archive search (?q=<term>)
├── contribute.html           # Consent-first community submission workflow
├── admin.html                # Client-side moderation queue preview
├── about.html                # Archive mission & governance overview
├── guidelines.html           # Submission, rights & cultural sensitivity guide
├── copyright.html            # Licensing & reuse policy
├── privacy.html              # Privacy notice
├── terms.html                # Terms of archival use
└── contact.html              # Contact & record-correction reporting
```

---

## Running Locally

Because BhashaVerse uses plain HTML, CSS, and browser-native JavaScript with relative paths, no bundler or install step is required:

1. Clone the repository:
   ```bash
   git clone https://github.com/anubhabhalder06/BhashaVerse.git
   cd BhashaVerse
   ```
2. Serve with any lightweight static server:
   ```bash
   # Using Python
   python -m http.server 8080

   # Or using Node.js
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser (or open `index.html` directly).

---

## Archival Visual Assets & Attribution

All photographic plates in [`assets/images/`](assets/images/manifest.json) are openly licensed or public domain works sourced from Wikimedia Commons with preserved attribution:

| File | Subject | Credit | Licence |
| :--- | :--- | :--- | :--- |
| `loom-weaver-assam.jpg` | Assamese handloom weaver | Deepraj | CC BY 2.5 |
| `weaver-hands-bundi.jpg` | Traditional weaver at wooden loom, Bundi | Daniel Villafruela | CC BY-SA 3.0 |
| `toda-archival-1871.jpg` | Toda men and women in Poothkuli shawls (1871) | Madras School of Arts | Public domain |
| `odia-palm-leaf.jpg` | Odia cord-bound palm-leaf manuscript | Manoj Choudhury | CC BY-SA 3.0 |
| `kannada-talegari.png` | Historical Kannada palm-leaf talegari folio | Ananda Devaraj | CC BY-SA 4.0 |
| `gond-art-detail.jpg` | Close-up of Gond traditional painting | Sumita Roy Dutta | CC BY-SA 4.0 |
| `lachen-weaving-sikkim.jpg` | Traditional weaving at Lachen, Sikkim | Jirah P Lepcha | CC BY-SA 4.0 |

---

## Ethical Stewardship & Prototype Notice

- Sample records, quotes, and synthesized audio previews across this prototype are placeholders pending community verification and consent clearance.
- Contribution and moderation views (`contribute.html`, `admin.html`) store submissions locally in browser `localStorage` for demonstration; production deployment requires server-side authentication, encrypted media storage, and community review governance.
