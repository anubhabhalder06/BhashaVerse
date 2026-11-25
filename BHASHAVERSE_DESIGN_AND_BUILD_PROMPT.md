# BhashaVerse — Comprehensive Design, Architecture & Implementation Specification

> **Document Role:** Master creative, architectural, and implementation prompt for building **BhashaVerse** (Digital Language & Cultural Heritage Archive — EPICS Project).
> **Grounded Sources:** `Website_Requirements_BhashaVerse.pdf`, existing `bhashaverse-skeleton/` HTML/CSS/JS architecture, and the 5 supplied visual references in `design references/`.
> **Hosting Target:** Always-live, zero-cost static/edge deployment (**GitHub Pages** or **Cloudflare Pages**) with **zero paid backend dependencies** during the prototype phase.

---

## 1. Mission & Product Identity

BhashaVerse is a trusted, searchable digital heritage archive where Indian communities, students, researchers, and visitors discover, study, and responsibly contribute records of **underrepresented languages, scripts, histories, literature, oral traditions, photographs, and cultural knowledge**.

- **Conceptual parallel:** Archival rigor, metadata provenance, rights transparency, and open preservation akin to an institutional heritage repository.
- **Visual divergence:** Must **never** imitate Internet Archive’s utilitarian legacy UI or generic SaaS landing pages. It should feel like a **contemporary museum, cultural research institution, editorial publication, and minimalist generative art monograph**.

---

## 2. Synthesis of the 5 Visual Design References

Treat the five images in `design references/` as a unified artistic philosophy rather than rigid templates to duplicate:

1. **Swiss Archival Specimen & Editorial Book Grids (`b6913b2c-e004-4824-94de-62d88ef85aab.webp`)**
   - Crisp `1px` structural hairline grids, monumental high-contrast editorial serif display titles, scholarly micro-captions (`[15 pt]`, dossier indices), and authoritative asymmetric spreads.
2. **Translucent Vellum & Palimpsest Layering (`46ba4107-6b82-4ded-b405-d93c8ec7749b.webp`)**
   - Subtle translucent archival paper sheets overlapping primary typography and faint underlying script/handwritten traces—symbolizing layered historical memory without decorative SaaS glassmorphism.
3. **Minimalist Generative Line-Cartography (`b4235d11-bbcc-4850-af12-9ba0cee49a7b.webp`)**
   - Matte charcoal surfaces paired with ultra-fine, continuous off-white geometric paths, modular semantic glyphs, quartered taxonomy circles, and branching node systems.
   - Used selectively as visual connective tissue (hero origin diagram, regional linguistic map, language-family connections, dark cartographic sections)—**never** turning reading pages into cluttered diagrams.
4. **Tactile Multi-Script Archival Dossiers (`226ccfb7-d833-43fa-83bd-d70fdb8f5847.webp`)**
   - Aged cotton-paper ground, archival stamp dates (`REC'D`), vertical multi-script linguistic specimens paired with IPA/romanization, and understated ink vignettes.
5. **Embodied Human Documentary Presence (`64e9953e-2bd7-4327-a603-74c40f35298f.webp`)**
   - Calm warm-stone negative space, monochrome silver-gelatin documentary photography inside softly rounded editorial apertures (`14px`–`20px` radius contrasting against sharp `0px`–`2px` grid rules), vertical script marginalia (`writing-mode: vertical-rl`), and quiet stepped typography.

---

## 3. Dual-Theme Color & Surface Architecture

### 3.1 Polarity Strategy
- **Default Experience:** **Warm Archival Paper (Light)** for calm reading, archival manuscripts, and scholarly browsing.
- **Intentional Dark Contrast Bands:** Matte Charcoal (`#161715`) appears purposefully for the **Language Map**, **Cartographic Explorations**, and visual transitions.
- **First-Class Dark Mode Toggle:** Switching to Dark Mode transitions the entire site to the **Deep Charcoal Line-Cartography** palette—intentionally composed for contrast and legibility, never a naive color inversion.

### 3.2 Design Token Contract

| Token | Warm Archival Paper (Light Default) | Deep Charcoal Cartography (Dark) | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#F4F0E7` | `#161715` | Primary reading / cartographic canvas |
| `--color-surface` | `#DCD7CE` | `#20211E` | Stone dossier bands, sidebars, table headers |
| `--color-vellum` | `rgba(250, 247, 240, 0.82)` | `rgba(31, 32, 29, 0.86)` | Translucent palimpsest notes & overlays |
| `--color-text` | `#161614` | `#ECE7DD` | Primary ink / chalk copy (`>= 12:1` contrast) |
| `--color-muted` | `#56534C` | `#A6A197` | Captions, metadata labels (`>= 4.5:1` contrast) |
| `--color-rule` | `rgba(22, 22, 20, 0.18)` | `rgba(236, 231, 221, 0.18)` | Swiss grid hairline dividers |
| `--color-accent-red` | `#9A3B2B` | `#DF7B67` | Provenance stamps, active map node, Restricted badge |
| `--color-accent-ochre` | `#855E1E` | `#D6AB61` | Demonstration / Pending Review stamps |
| `--color-accent-sage` | `#3F5C45` | `#8BB192` | Openly Licensed / Community Cleared stamps |

### 3.3 Modern CSS Implementation Rules
- Declare `<meta name="color-scheme" content="light dark">` in `<head>` plus a minimal synchronous inline FOUC-prevention script reading `localStorage.getItem("color-scheme") ?? "light dark"`.
- Bind `:root { color-scheme: light dark; }` and reflect explicit overrides with `:root:has(> head > meta[name="color-scheme"][content="dark"])` and `light-dark(...)` tokens (with `@media (prefers-color-scheme: dark)` fallback).
- Provide a clean theme switcher that respects `System`, `Light (Archival Paper)`, and `Dark (Charcoal)`.

---

## 4. Typography, Visual Density & Accessibility

- **Premium Editorial Header & Body Pairing (Self-Hosted WOFF2 / Static Assets):**
  - *Display / Monumental Headers:* High-contrast editorial serif (**Cormorant Garamond**, **Instrument Serif**, or **Bodoni Moda**, weight `400`–`500`, with authentic italics for emphasis) — `text-wrap: balance`, restrained negative tracking (`-0.025em`). Avoid generic system fallbacks as primary headers in production builds.
  - *Body / Reading Sans:* Clean neo-humanist sans (**Plus Jakarta Sans** or **Inter**) — `max-width: 60ch`, unitless `line-height: 1.6`, `text-wrap: pretty`.
  - *Archival Monospace:* Tabular monospace (**IBM Plex Mono** or **JetBrains Mono**) for Record IDs, dates, IPA tags, rights stamps, and commands.
  - *Multi-Script Indic Fallbacks & Self-Hosted Rare Scripts:* Explicit `lang` attributes (`tcy`, `gon`, `kxu`, `kru`, `tod`, `mrg`, `bhb`, `srb`, `sat`, `lep`, `hi`) paired with self-hosted **Noto Serif / Noto Sans** WOFF2 files (including `Noto Sans Sora Sompeng`, `Noto Sans Tolong Siki`, `Noto Sans Ol Chiki`, and `Noto Sans Lepcha` so rare Indian indigenous scripts never render as missing glyph boxes on desktop/mobile OS stacks) and normalized via `font-size-adjust: from-font` (with `@supports not (font-size-adjust: from-font)` fallback).
- **Visual-First, Minimal-Text Editorial Density & Real Media Discipline:**
  - Treat negative space (`35%–45%` open canvas) as a primary structural element.
  - Replace prose-heavy cards with **oversized Indian script specimens, real consent-cleared documentary photography or manuscript scans (`16px–20px` soft apertures), crisp `1px` Swiss rules, and concise captions (`<= 18` words on index cards)**. Keep long-form scholarship inside dedicated Language Profiles and History/Story essays.
  - **Never** draw cryptic abstract geometric faces or placeholder shapes inside media apertures: if real photography/scans are pending during early prototyping, display an explicit, clean `[Archival Field Photograph / Manuscript Scan Slot]` container paired with meaningful India cartography and real Indic typography.
- **Fluid Zoom-Safe Sizing:** Use `clamp(min, preferred, max)` in `rem`/`vw` with `max <= 2.5 * min` so WCAG 1.4.4 200% browser zoom works cleanly. Never fix container heights around text (`min-block-size` only).
- **WCAG AA Compliance:** Visible `:focus-visible` outlines (`>= 3:1` contrast), `>= 24x24` CSS px interactive targets, semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`), skip links, `aria-current="page"`, non-color status cues (`text + icon/stamp`, never color alone), and verbatim `<details>` transcripts for audio/video.

---

## 5. Inspection of Existing Skeleton & Architecture Strategy

### 5.1 What Exists in `bhashaverse-skeleton/`
Inspection of `d:\BhashaVerse\bhashaverse-skeleton\` shows:
- **Zero-build static semantic HTML backbone:** 20 HTML files (`index.html`, `languages.html`, `language-profile.html`, `history.html`, `library.html`, `library-item.html`, `gallery.html`, `audio.html`, `map.html`, `culture.html`, `stories.html`, `contribute.html`, `about.html`, `search.html`, `contact.html`, `guidelines.html`, `privacy.html`, `terms.html`, `copyright.html`, `admin.html`).
- **Tokenized base styling:** `css/tokens.css` (color/font/spacing tokens + `[data-theme="dark"]`) and `css/base.css` (landmarks, skip link, `.detail-layout`, `.filter-bar`, `.meta`, reduced-motion rule).
- **Lightweight client behavior:** `js/main.js` (mobile menu toggle, generic `data-filter-target` + `data-filter-key` list filtering, demo form validation, `?q=` search prefill).
- **No `package.json`, no bundler, no React setup yet**, though `README.md` anticipates optional migration to modular components when moving to Next.js.

### 5.2 Architecture Decision (Zero Unnecessary Rewrites)
Respect the existing skeleton and avoid rewriting just for framework novelty:

- **Option A — Modular Static Evolution (Lowest friction for Review 1 on GitHub Pages / Cloudflare Pages):**
  - Keep the 20-page semantic HTML skeleton structure and upgrade `css/tokens.css`, `css/base.css`, plus dedicated modular stylesheets (`css/editorial.css`, `css/cartography.css`, `css/print-stamps.css`).
  - Organize client JavaScript cleanly into modular ES files (`js/data/*.js` static JSON catalogs, `js/services/archiveService.js`, `js/services/rightsPolicy.js`, `js/svg/motifEngine.js`, `js/ui/archiveGuide.js`, `js/ui/themeController.js`) using **composition, pure functions, and repository adapters**—zero build step, instant static deploy.
- **Option B — Componentized Static Next.js (`output: 'export'` + TypeScript + Tailwind CSS):**
  - Adopt ONLY when ready to eliminate duplicated `<header>`/`<footer>` across the 20 HTML pages and share typed components (`ArchiveHeader`, `LanguageProfileView`, `RightsBadge`, `CartographyCanvas`, `ArchiveGuideDrawer`).
  - **Architecture discipline:** Use **functional React components, custom hooks, and clean TypeScript domain services/repositories** (`src/domain/types.ts`, `src/repositories/StaticArchiveRepository.ts`, `src/services/searchFilter.ts`, `src/services/rightsGuard.ts`, `src/svg/motifBuilder.ts`). **Prefer composition and clean interfaces over forcing OOP inheritance hierarchies into React components.**
  - Ensure `next.config` supports static export (`images: { unoptimized: true }`, `output: 'export'`) so the build deploys free and always-live on **Cloudflare Pages** or **GitHub Pages**.

---

## 6. Custom Generative SVG Line-Cartography Engine

Build a lightweight, deterministic SVG composition module (`motifEngine`) that evolves across sections while maintaining a unified visual language (`1.1px–1.25px` uniform strokes, orthogonal bends with rounded corners, concentric resonance rings, quartered taxonomy circles, diamond intersection nodes):

| Section | Motif Name | Semantic Role | Motion & Transition Policy |
| :--- | :--- | :--- | :--- |
| **Initial Load** | *Archival Calibration* | Draws a quiet `1.15px` geometric ink path (`~950ms`) before fading cleanly to content | Opt-in via `@media (prefers-reduced-motion: no-preference)`; skipped immediately under reduced motion |
| **Homepage Hero** | *Origin Convergence* | Links *Discover · Preserve · Contribute* across vellum & plate | One-time `stroke-dashoffset` draw + subtle vellum micro-lift on hover |
| **Explore Languages** | *Modular Glyph Matrix* | Deterministic emblem per language encoding family, script & oral depth | Hairline underline sweep + crisp node highlight on focus/hover |
| **Language Map** | *Corridor Cartography* | Abstracted regional routes connecting linguistic zones over matte charcoal | Gentle traveling corridor signal (`offset-path`) & active node pulse with **Pause Live Motion** toggle (WCAG 2.2.2) |
| **Route Transitions** | *Editorial Crossfade* | `View Transitions API` / subtle `opacity` + `6px` lift between archive routes | Compositor-only `opacity`/`transform`; `@starting-style` + `allow-discrete` on drawers |
| **Audio & Stories** | *Acoustic Resonance* | Concentric breath rings + waveform trace beside non-autoplay audio player | Strictly static until user initiates playback |
| **Digital Library** | *Folio Lattice* | Orthogonal shelving grid framing rights stamps & metadata dossiers | Static architectural hairline geometry |

**Hard constraints:** All decorative SVGs carry `aria-hidden="true"`. Meaningful diagrams/maps carry `role="img"`, `<title>`, and text/table alternatives. Never use scroll-jacking parallax, bouncy SaaS animations, or un-pausable continuous motion.

---

## 7. Information Architecture, Metadata & Rights Controls

### 7.1 Required Pages (Aligned to `Website_Requirements_BhashaVerse.pdf`)
1. `Home`: Asymmetrical editorial hero, Demo Notice, *Discover / Preserve / Contribute* essay, Featured Languages, Dark Cartographic Region Explorer, Featured Heritage plates, Digital Library preview, Voices & Stories, Latest Additions, Contribute CTA, Policy Footer.
2. `Explore Languages` & `Language Profile`: Live search + verified filters (Region, Family, Script, Resource Type); 10-section individual profile (Names/IPA, Context, Approximate Geography, Classification + verification date, Writing System specimen, History timeline, Vocabulary table with audio cue, Literature, Related media, References/Review status/Report link).
3. `Language Map`: Interactive SVG regional corridor canvas (paired cleanly with Leaflet GeoJSON when real geographic layers are sourced), explicit approximate-boundary disclaimer, region filter panel.
4. `Digital Library` & `Library Item Detail`: Multi-facet filtering (Category, Language, Format, **Rights**) and 2-column detail view with preview box, full citation, and **rights-enforced download state**.
5. `Photo & Video Archive` & `Audio Archive`: Curated documentary plates with alt text/captions/consent metadata; non-autoplaying audio player with expandable `<details>` transcript/translation.
6. `History & Heritage`, `Culture & Traditions`, `Community Stories`: Editorial reading layouts distinguishing verified facts, oral accounts, and demonstration records.
7. `Contribute` & `Admin Queue (Mockup)`: Validated contribution form with mandatory rights/consent checkboxes feeding a **client-side simulated Pending Review Queue** (clearly bannered as non-secure mockup UI).
8. `Search` & `Trust/Policy Pages`: Grouped global search results; dedicated `About`, `Contact / Report`, `Contribution Guidelines`, `Privacy`, `Terms`, `Copyright & Reuse` pages.

### 7.2 Mandatory Record Metadata Schema (PDF Section 9)
Every archive entity in `src/domain/` or `js/data/` must carry structured fields across all 8 metadata groups:
- **Identity:** `id`, `title`, `alternateTitle`, `contentType`, `summary`, `isDemo` (`boolean` — visibly badged!)
- **Language/Community:** `languageId`, `preferredCommunityName`, `dialect`, `script`
- **Place & Time:** `regionSafeLevel`, `dateOrPeriod`, `dateRange`
- **Creator/Source:** `creator`, `speaker`, `photographer`, `contributor`, `sourceInstitution`, `recorder`
- **Description:** `caption`, `transcript`, `translation`, `keywords[]`, `subjectCategory`, `notes`
- **Rights & Consent:** `copyrightOwner`, `rightsStatus` (`Public domain` | `Openly licensed` | `Permission granted` | `Restricted` | `Metadata only`), `consentStatus`, `accessRestrictions`, `attributionText`
- **Quality Control:** `verificationStatus`, `reviewer`, `sourceReferences[]`, `dateAdded`, `dateUpdated`
- **Technical Details:** `fileFormat`, `fileSize`, `dimensionsOrDuration`, `metadataLanguage`, `altText`

---

## 8. Quiet "Archive Guide" Command Drawer (Optional Helper)

If included, the Archive Guide must act as a **restrained archival index tool**—never a noisy AI chatbot or floating glowing bubble:
- **Visual design:** Crisp `1px` bordered museum index trigger in bottom-right (`Archive Guide (/help)`), expanding with `@starting-style` + `transition-behavior: allow-discrete` (`opacity` + `translateY`, disabled under `prefers-reduced-motion: reduce`).
- **Functionality (100% client-side, deterministic):**
  - Supports simple commands: `/help`, `/languages`, `/map`, `/library`, `/audio`, `/contribute`, `/rights`, `/theme`, and `/search <query>`.
  - Uses local catalog matching (no paid LLM API calls, no hallucinated answers).
  - Keyboard accessible (`Escape` closes, focus returns cleanly, **IME-safe Enter submit** checking `event.isComposing` + `compositionend` timestamp window for Devanagari/Indic/CJK input).

---

## 9. Prototype Capability Matrix (Honest Boundary Tracking)

| Capability | Status in Prototype | Behavior & Labeling Rule | Future Production Phase |
| :--- | :--- | :--- | :--- |
| Multi-page routing, search & multi-facet filters | **Genuinely Implemented** | Live client-side index filtering across demo records | Database/FTS queries via Supabase |
| Dual Light/Dark theme + FOUC guard | **Genuinely Implemented** | System preference + persistent override via `localStorage` | Same |
| Rights-gated Library download states | **Genuinely Implemented** | Disables download (`aria-disabled="true"`) for `Restricted` / `Metadata only` | Enforced server-side via signed storage URLs |
| Generative SVG motifs & region nodes | **Genuinely Implemented** | Deterministic SVG line art + accessible node selection | Paired with verified Leaflet GeoJSON layers |
| Archive Guide command drawer | **Genuinely Implemented** | Deterministic local command router & search bridge | Optional enhanced semantic index |
| Indian Language / Media Records | **Simulated (Demo Data)** | Must display `Demonstration Content` badge; zero invented history | Verified community-cleared fieldwork assets |
| Audio pronunciation / oral clips | **Simulated** | Non-autoplay `<audio>` / synthesized cue clearly marked as demo | Real permission-cleared `.mp3`/`.ogg` + WebVTT |
| Contribute form & Admin Moderation Queue | **Simulated (Client-only)** | Stores demo entries in memory / `localStorage` only; banner states no backend auth | Next.js API + Supabase PostgreSQL + Auth/RLS |

---

## 10. What TO Do & What NOT To Do (Implementation Guardrails)

### MUST-DOs
1. Keep **Warm Archival Paper** as the primary reading surface and **Deep Charcoal** for dark mode and selective cartographic zones.
2. Pair high-contrast museum editorial typography, translucent vellum overlays, monochrome documentary photo apertures, and crisp `1px` Swiss rules with the custom SVG line-cartography signature.
3. Use real, respectful **India-only underrepresented, tribal, and endangered language examples** (**Tulu, Gondi, Kui, Kurukh, Toda, Mishing, Bhili, Sora**), always marked clearly as **Demonstration Content** until community verification—and avoid stigmatizing labels like "backward" in public UI copy per `Website_Requirements_BhashaVerse.pdf`.
4. Keep **attribution, source citations, consent status, and rights badges** first-class on every record.
5. Respect `prefers-reduced-motion`, `200%` text zoom, `Tab`/`Esc` keyboard navigation, and screen-reader semantics.
6. Ensure zero-cost static deployability on **GitHub Pages** or **Cloudflare Pages**.

### STRICT PROHIBITIONS
1. **NO** Internet Archive visual cloning or generic SaaS hero/feature-card templates.
2. **NO** glowing borders, excessive gradients, heavy drop shadows, SaaS glassmorphism blobs, or random 3D objects.
3. **NO** turning every page into dense abstract diagrams—manuscripts, photography, and readable prose stay central.
4. **NO** infinite bouncy animations, auto-playing audio/video, or scroll-jacking parallax.
5. **NO** intrusive glowing AI chatbot widgets, paid APIs, paid hosting requirements, or fake LLM claims.
6. **NO** fabricated historical dates, invented citations, disrespectful labels ("backward"), or publishing sensitive community/child media without authorization.
7. **NO** pretending frontend-only admin mockups provide real authentication or security.

---

## 11. Free Always-Live Deployment Checklist

- **Cloudflare Pages (Recommended):** Connect repository → Build command (none for static skeleton, or `npm run build` for `output: 'export'`) → Publish directory (`bhashaverse-skeleton/` or `out/`). Always online, global CDN, zero sleep timers.
- **GitHub Pages:** Enable Pages from `main` branch (`/docs` or GitHub Actions static artifact upload). Remember relative asset paths (or `basePath` if hosted under `/<repo-name>/`).

---

## 12. Ready-to-Use Master AI / Team Build Prompt

> Copy and provide the prompt block below when instructing a developer or coding agent to implement the production codebase from the existing `bhashaverse-skeleton/`:

```markdown
Build the BhashaVerse Digital Language & Cultural Heritage Archive prototype starting directly from the inspected `bhashaverse-skeleton/` structure and `Website_Requirements_BhashaVerse.pdf`.

1. ARCHITECTURE & STACK:
   - Inspect `bhashaverse-skeleton/` first; do not rewrite into a new stack unnecessarily unless componentizing repeated chrome into Next.js (TypeScript, App Router, static export `output: 'export'`, Tailwind CSS).
   - Keep zero paid backends or external APIs; deploy cleanly as static assets on GitHub Pages or Cloudflare Pages.
   - Separate UI views, domain data models/schemas, search/filter/rights services, and the deterministic SVG Motif Engine (`motifEngine`) cleanly using modular composition and repository interfaces (no forced OOP inheritance inside React components).

2. VISUAL IDENTITY, PREMIUM TYPOGRAPHY & MOTION:
   - Default to Warm Archival Paper (`#F4F0E7` bg, `#DCD7CE` stone, `#161614` ink, `1px` Swiss hairline grids, translucent vellum annotations, monochrome documentary photo apertures with `16px–20px` radius + vertical script marginalia).
   - Use premium self-hosted editorial display serifs (`Cormorant Garamond` / `Instrument Serif` / `Bodoni Moda`) paired with clean humanist sans (`Plus Jakarta Sans` / `Inter`), tabular `IBM Plex Mono`, and `Noto Serif/Sans` Indic scripts normalized via `font-size-adjust: from-font`. Maintain 35–45% breathing space and keep card/preview text concise (`<= 18` words) so photography and script specimens lead.
   - Implement a proper Deep Charcoal Cartography Dark Mode (`#161715` bg, `#ECE7DD` chalk lines) driven by `<meta name="color-scheme" content="light dark">`, `light-dark()`, FOUC prevention, and an accessible theme toggle—never naive color inversion.
   - Render custom SVG line-cartography (`1.15px` continuous geometric paths, semantic glyphs, phase circle matrices) selectively for Hero origin, Language Lineage emblems, the Dark Cartographic Language Map, and section bridges. Include a quiet `~950ms` Archival Calibration line-trace loader, smooth View Transitions between routes, and subtle ambient corridor node motion with a Pause control (`prefers-reduced-motion` compliant).
   - Zero SaaS templates, zero Internet Archive UI copying, zero gradients/glows/heavy shadows, zero autoplaying media.

3. FUNCTIONAL SCOPE & INTEGRITY:
   - Deliver all essential archive views for India's underrepresented languages: Home, Explore Languages + Profiles (Tulu, Gondi, Kui, Kurukh, Toda, Mishing, Bhili, Sora), Interactive India Language Map (with approximate-boundary attribution), Digital Library + Detail with enforced rights-gated downloads (`Public domain`, `Openly licensed`, `Permission granted`, `Restricted`, `Metadata only`), Photo/Video & Audio Archive (with `<details>` transcripts), Contribute form feeding a clearly labeled client-side simulated Admin Queue mockup, Search, and all Policy pages. Never use cryptic abstract SVG blobs in photo slots—pair meaningful India cartography and Indic script specimens with clean `[Field Photo / Manuscript Scan]` frames until cleared assets arrive.
   - Include a minimal, IME-safe, command-driven Archive Guide drawer (`/help`, `/languages`, `/map`, `/library`, `/audio`, `/contribute`, `/rights`, `/search`) with smooth `@starting-style` transitions and zero external AI calls.
   - Label all sample content clearly as Demonstration Content, never fabricate citations or histories, and validate WCAG AA contrast, keyboard navigation, and 200% zoom before completion.
```
