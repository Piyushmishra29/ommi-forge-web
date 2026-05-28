# Ommi Forge — cinematic rebuild

![Built with Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-9-FF5533?style=flat-square&logo=three.js&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?style=flat-square&logo=greensock&logoColor=black)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Static export](https://img.shields.io/badge/output-static_export-FF9933?style=flat-square)
![License MIT](https://img.shields.io/badge/license-MIT-FF9933?style=flat-square)
![Lint passing](https://img.shields.io/badge/lint-passing-3FB950?style=flat-square)
![No analytics](https://img.shields.io/badge/analytics-none-FF9933?style=flat-square)

![Ommi Forge hero](docs/images/desktop-hero.png)

A scroll-driven **Next.js 16 static rebuild** of [ommiforge.com](https://www.ommiforge.com) — an Indian steel-forging company founded in **Bangalore in 1975**, with its plant in **Malur, Karnataka**. It replaces a stock WordPress + Elementor build with an editorial, animation-led static site that puts the brand's genuinely distinctive asset — **nine interactive 3D STL renders of forged parts** — at the centre of the experience.

**Live preview:** [https://pi-vps-mumbai.tail641fa8.ts.net](https://pi-vps-mumbai.tail641fa8.ts.net) — the client preview is `robots: Disallow` (intentionally not indexed until the production launch).

## Table of contents

- [Screenshots](#screenshots)
- [The site this replaces (legacy WordPress)](#the-site-this-replaces-legacy-wordpress)
- [Architecture](#architecture)
- [The scroll-scrub engine](#the-scroll-scrub-engine)
- [3D renders & the asset pipeline](#3d-renders--the-asset-pipeline)
- [Performance & accessibility](#performance--accessibility)
- [Build & deploy](#build--deploy)
- [Local development](#local-development)
- [Credits & license](#credits--license)

## Screenshots

### Mobile

Captured at iPhone 14 Pro viewport against the production static build.

<table>
  <tr>
    <td align="center">
      <img src="docs/images/mobile-hero.png" width="250" alt="Mobile home hero" /><br />
      <sub><b>Home hero</b> — "Forged in India" over the Malur plant flyover</sub>
    </td>
    <td align="center">
      <img src="docs/images/mobile-plant.png" width="250" alt="Mobile plant walkthrough" /><br />
      <sub><b>Act 03 walkthrough</b> — scroll-scrubbed plant flythrough</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/images/mobile-renders.png" width="250" alt="Mobile renders grid" /><br />
      <sub><b>3D renders</b> — interactive STL gallery intro</sub>
    </td>
    <td align="center">
      <img src="docs/images/mobile-render-detail.png" width="250" alt="Mobile render detail STL viewer" /><br />
      <sub><b>Render detail</b> — tap-to-interact STL viewer</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/images/mobile-materials.png" width="250" alt="Mobile materials page" /><br />
      <sub><b>Materials</b> — steel families and grades</sub>
    </td>
    <td align="center">
      <img src="docs/images/mobile-contact.png" width="250" alt="Mobile contact page" /><br />
      <sub><b>Contact</b> — quote-to-part in a day</sub>
    </td>
  </tr>
</table>

### Desktop

Captured at 1440x900.

![Desktop home hero — "Forged in India" over the Malur plant flyover](docs/images/desktop-hero.png)

![Desktop Act 03 walkthrough — "Inside the wonderworld" plant flythrough](docs/images/desktop-plant.png)

![Desktop 3D renders gallery — interactive STL grid](docs/images/desktop-renders.png)

## The site this replaces (legacy WordPress)

The current production site at [`https://www.ommiforge.com`](https://www.ommiforge.com)
is a stock **WordPress + Elementor** build. Fingerprints scraped from the live
markup at the time of this rebuild:

- `<meta name="generator" content="WordPress 6.8.5">`
- `<meta name="generator" content="Elementor 4.0.5; ... css_print_method-external, google_font-enabled, font_display-auto">`
- Theme: **`hello-elementor`** (the "Hello" starter theme, `wp-content/themes/hello-elementor/`)
- Plugins in the markup: `elementor`, **`elementor-pro`**, `header-footer-elementor` (Elementor's theme-builder header/footer), and **`vrm360`** (the 3D viewer — see below)
- Per-page Elementor CSS: `wp-content/uploads/elementor/css/post-5.css`, `post-27.css`, `post-891.css`, `post-906.css` (the home page is **post-27**, hence `post-27.css`)
- ~56 stylesheet `<link>`s and a ~6.8 MB HTML document on the home page alone
- `jquery.min.js?ver=3.7.1` (Elementor's front-end is jQuery-bound)
- Server: **LiteSpeed** with `x-litespeed-cache: hit`, **`x-powered-by: PHP/8.2.30`**, on **Hostinger** shared hosting (the contact form still posts to the Hostinger staging origin `orangered-rabbit-312317.hostingersite.com`)
- Analytics: **Site Kit by Google** + `googletagmanager` (the rebuild ships zero analytics by default)
- `wp-json/`, `xmlrpc.php`, RSD/oEmbed link headers — the usual WordPress surface area
- Fonts: Manrope and Roboto loaded via Elementor's Google-Fonts integration

### Why it underserved the brand

Ommi Forge's genuinely distinctive asset is its **nine interactive 3D views of
forged parts** (the `/render-a/` … `/render-h/` + `/render-h-2/` pages). On the
legacy site these run through the **VRM360** WordPress plugin — a jQuery
*drag-to-spin 360° image-sequence* viewer (its assets are `vrm360/drag2spin.svg`
and `vrm360/ajax-loader.svg`, served from `vrm360/vrm360.css`). It is **not** a
true mesh viewer: there are **no `.stl` files anywhere on the old site**; each
"render" is a pre-baked ring of photos spun on mouse-drag. The interaction is
generic, framed in a plain Elementor section with no motion language tying it to
the rest of the page, and the part you are looking at carries no lighting,
material, or depth — just a flipbook of stills.

Everything else is essentially **static Elementor**: the only motion is
Elementor Pro's fade *transitions* (`elementor-pro/.../conditionals/transitions.min.css`),
a handful of **Motion FX** scroll effects (`motion_fx_scrolling` parallax plus a
`_transform_scale_effect_hover: 1.1` scale — the one scroll/hover-scale touch in
the design), an `e-swiper` carousel, and Elementor **counter** widgets that tick
the hero stats up (`data-to-value="8"`, etc.). The hero itself is an Elementor
**background video** widget pointed at a YouTube embed
(`background_video_link: https://www.youtube.com/watch?v=NBCDb4opv-M`,
`background_video_start: 6`) — so the marquee impression of the brand is a
muted, cropped, third-party-hosted YouTube loop.

> Per the source-site inventory, the page set is: Home (`/`), About
> (`/home/about-ommi-forge/`), Solutions (`/home/solutuion/` — **the URL really
> is misspelled "solutuion"**), Forged Products (`/home/forged-products/`),
> Materials (`/materials/`), Careers (`/careers/`), Contact / "Request a Quote"
> (`/contact/`), a renders hub (`/3d-renders/`), and the nine render pages
> `/render-a/`, `/render-b/`, `/render-c/`, `/render-d/`, `/render-e/`,
> `/render-f/`, `/render-g/`, `/render-h/`, `/render-h-2/` (`/render-i/` is a
> 404). The Elementor mega-menu only surfaces seven of the nine renders in its
> "360 Renders" submenu.

### Old architecture

```mermaid
flowchart TD
    Browser["Browser<br/>(jQuery 3.7.1 runtime)"]
    LS["LiteSpeed + LiteSpeed Cache<br/>Hostinger shared hosting"]
    PHP["WordPress 6.8.5<br/>PHP 8.2.30"]
    Theme["hello-elementor theme"]
    EL["Elementor 4.0.5 + Elementor Pro<br/>(Motion FX, transitions, e-swiper, counters)"]
    HFE["header-footer-elementor<br/>(theme-builder header/footer)"]
    CSS["Per-page generated CSS<br/>post-5.css / post-27.css / post-891.css / post-906.css"]
    SK["Site Kit by Google<br/>+ googletagmanager"]
    DB[("MySQL<br/>wp_posts / wp_postmeta")]
    YT["YouTube background embed<br/>video id NBCDb4opv-M"]
    VRM["vrm360 plugin<br/>jQuery 360 image-spin (no STL)"]

    Browser -->|HTTPS request per page| LS
    LS -->|cache miss| PHP
    PHP --> Theme
    PHP --> EL
    PHP --> HFE
    PHP --> SK
    EL --> CSS
    Theme --> CSS
    PHP -->|reads pages + Elementor JSON| DB
    EL --> YT
    EL --> VRM
    CSS -->|56 stylesheets, ~6.8 MB HTML| Browser
    YT -.iframe to youtube.com.-> Browser
    VRM -.image sequence + drag2spin.-> Browser
```

### Old vs new, side by side

| Concern | Legacy WordPress site | This rebuild |
| --- | --- | --- |
| Rendering | Server-side PHP rendered per request (LiteSpeed-cached) | Static HTML via Next.js 16 `output: 'export'` (SSG) — no server at runtime |
| CMS / content source | WordPress + Elementor, content in MySQL (`wp_posts`/`wp_postmeta`) | File-based, typed content in `src/data/*.ts` (no database) |
| Page builder | Elementor 4.0.5 + Elementor Pro drag-and-drop | Hand-authored React Server/Client components |
| Styling | Elementor per-page CSS (`post-27.css` etc.), `hello-elementor` theme, ~56 stylesheets | Tailwind CSS v4 with CSS-first `@theme` tokens (single source of truth in `globals.css`) |
| Motion language | Elementor Pro fade transitions + a little Motion FX parallax + `scale:1.1` hover; counter widgets | GSAP ScrollTrigger/Observer pinned-scrub sections, canvas image-sequence scrub, Framer Motion page transitions, Lenis smooth scroll |
| 3D / renders | **VRM360** jQuery 360° image-sequence spinner (pre-baked stills, no geometry) | **React Three Fiber** `StlViewer` loading real `.stl` geometry — auto-rotate, drag-orbit, zoom, fullscreen, download |
| Hero | Elementor background-video widget → YouTube embed (`NBCDb4opv-M`) | Self-hosted hero video + an R3F drop-hammer scene |
| JavaScript baseline | jQuery 3.7.1 + Elementor front-end bundles | React 19 + targeted GSAP/Three, three.js code-split into one shared async chunk |
| Routing / URLs | WordPress permalinks incl. `/home/solutuion/` (typo) and `/render-h-2/` | Clean routes (`/solutions/`, `/renders/{a..i}/`); legacy URLs mapped via a `beforeInteractive` script + `public/_redirects` |
| Fonts | Manrope/Roboto via Elementor's Google-Fonts loader (external) | Manrope + Work Sans + Roboto self-hosted via `next/font/google` |
| Hosting | Hostinger shared PHP + LiteSpeed (`*.hostingersite.com`) | Static export deployable anywhere — Vercel, or Caddy behind Tailscale, or any static host |
| Build / deploy | Edit live in Elementor; no build step; cache flush | `pnpm build` → static `out/`; prebuild generates sitemap, favicons, OG images |
| Analytics / privacy | Site Kit by Google + Google Tag Manager on by default | No analytics, trackers, cookies, or runtime `fetch` by default (Plausible opt-in) |
| Performance posture | ~6.8 MB HTML home doc, 56 stylesheets, render-blocking jQuery + Elementor | Static HTML, scoped CSS, lazy/code-split three.js, `prefers-reduced-motion` honoured everywhere |

### What carried over verbatim

The factual content was lifted directly from the legacy site and is treated as
locked copy in the rebuild:

- **Hero stats** (from the Elementor counter widgets): **8 hammers**, **1000+ MT/yr**, **100+ parts**, **1-day quote-to-part**.
- **Address:** Plot No 300, 301 & 302, 3rd Phase, Industrial Area, Malur, Karnataka 563160.
- **Phone:** +91 8951953866.
- **Email:** marketing@ommiforge.com.
- **Founding:** Founded **1975** by **BG Ashwath**; expanded into Closed Die forging in **2004** under Anil Ashwath; plant moved to the Malur industrial area in **2006**.
- **Certifications:** IATF 16949, ISO 9001:2015, PED, IBR.
- **Material families:** Carbon Steel, Alloy Steel, Stainless Steel (plus custom on request).
- **Industries served:** Automotive, Railways, Valves, Earth Moving, Wind Power.

## Architecture

Ommi Forge is a **Next.js 16 App Router site compiled to a fully static export** (`output: 'export'`). There is no server at runtime — `next build` emits an `out/` directory of HTML/CSS/JS that any static host (Hostinger, Netlify, Cloudflare Pages, S3) can serve. All "dynamic" behaviour (smooth scroll, scroll-scrubbed 3D, page transitions, the contact form) runs entirely client-side.

### Tech stack

Versions are pulled verbatim from `package.json`.

| Library | Version | Role |
| --- | --- | --- |
| `next` | `16.2.6` | App Router framework, static export (`output: 'export'`), `next/font`, `next/image`, `next/script`. |
| `react` / `react-dom` | `19.2.4` | UI runtime (React 19). |
| `typescript` | `^5` | Type-checked source; `strict` mode, `@/*` path alias to `src/*`. |
| `tailwindcss` | `^4` | CSS-first design system; tokens declared in `@theme` (see globals.css). |
| `@tailwindcss/postcss` | `^4` | Tailwind v4 PostCSS plugin (build pipeline). |
| `three` | `^0.184.0` | WebGL engine behind the hammer hero + STL viewers. |
| `@react-three/fiber` | `^9.6.1` | React renderer for three.js (`<Canvas>`, `useFrame`, `useLoader`). |
| `@react-three/drei` | `^10.7.7` | R3F helpers: `OrbitControls`, `Environment`, `ContactShadows`. |
| `@types/three` | `^0.184.1` | three.js type definitions (dev). |
| `gsap` | `^3.15.0` | Scroll-driven animation; `ScrollTrigger` + `Observer` plugins for pinning/scrubbing. |
| `framer-motion` | `^12.40.0` | Component transitions, page crossfade, magnetic cursor springs, `MotionConfig` reduced-motion gate. |
| `lenis` | `^1.3.23` | Smooth scroll, driven off the GSAP ticker so animation + scroll share one frame budget. |
| `react-hook-form` | `^7.76.1` | Contact form state/validation. |
| `@hookform/resolvers` | `^5.4.0` | Bridges Zod schemas into react-hook-form. |
| `zod` | `^4.4.3` | Contact form schema validation. |
| `clsx` | `^2.1.1` | Conditional class composition (a thin local `cn()` in `src/lib/cn.ts` is also used). |
| `sharp` | `^0.34.5` | Build-time image optimisation (`scripts/optimize-images.mjs`, favicons, OG image — dev only). |
| `eslint` / `eslint-config-next` | `^9` / `16.2.6` | Lint (dev). |

**Scripts** (`package.json`): `dev`, `build` (with a `prebuild` that runs `build-sitemap.mjs` + `build-favicons.mjs` + `build-og.mjs`), `start`, `lint`, `typecheck`, `optimize-images`, and the `build:*` meta helpers.

**Fonts** are self-hosted via `next/font/google` in `layout.tsx`, each exposing a CSS variable consumed by the Tailwind `@theme` block:

- **Manrope** → `--font-display` (headings, `font-display`)
- **Work Sans** → `--font-eyebrow` (uppercase labels, `font-eyebrow`)
- **Roboto** → `--font-body` (body copy, `font-body`)

### Rendering / provider layering

`src/app/layout.tsx` is the single root layout. It wraps every route in a fixed chrome + provider stack; individual `page.tsx` files render only into `<main id="main">`.

```mermaid
flowchart TD
    HTML["html (font vars + antialiased)"]
    BODY["body (bg-paper text-graphite, min-h-dvh)"]
    SKIP["a.skip-link ('Skip to content')"]
    LR["LegacyRedirects (beforeInteractive inline script)"]
    MC["MotionConfig (reducedMotion: CALM_MODE ? always : user)"]
    LP["LenisProvider (single Lenis instance, GSAP ticker RAF)"]
    RRE["RouteResetEffects (scroll-to-top + ScrollTrigger.refresh on nav)"]
    CUR["MagneticCursor (framer-motion spring cursor)"]
    HDR["Header (fixed bar + mobile sheet)"]
    PT["PageTransition (AnimatePresence keyed on pathname)"]
    MAIN["main#main (paddingTop: var('--header-h'))"]
    PAGE["{children} = active route page.tsx"]
    FTR["Footer (graphite slab)"]
    PLAUS["Script: Plausible (only if NEXT_PUBLIC_PLAUSIBLE_DOMAIN set)"]

    HTML --> BODY
    BODY --> SKIP
    BODY --> LR
    BODY --> MC
    MC --> LP
    LP --> RRE
    LP --> CUR
    LP --> HDR
    LP --> PT
    PT --> MAIN
    MAIN --> PAGE
    LP --> FTR
    BODY --> PLAUS
```

Key behaviours:

- **CALM_MODE** — building with `NEXT_PUBLIC_CALM_MODE=1` forces `MotionConfig` into `reducedMotion: 'always'`, and `LenisProvider` skips Lenis entirely (native scroll). This is the tested static path: no page-wipe flash, no scroll-scrubbed video, no GSAP-pinned jumps.
- **Lenis ⇄ GSAP** — `LenisProvider` runs Lenis off `gsap.ticker` and pipes `lenis.on('scroll', ScrollTrigger.update)`, so scrubbed/pinned sections track the smoothed scroll position rather than `window.scrollY`. Components steer it via `lenis:setpaused` / `lenis:scrollto` custom events rather than holding a direct reference.
- **PageTransition** — an `AnimatePresence mode="wait"` keyed on `usePathname()` crossfades route content; it falls through untouched when `useReducedMotion()` is true.

### Home-page scroll narrative ("Acts")

`src/app/page.tsx` composes nine section components in scroll order. The "Act" labels below are the literal `<Eyebrow>` strings rendered by each section (verified in the section files); a couple of sections were re-ordered for performance so the Act numbers are intentionally non-monotonic relative to DOM order.

```mermaid
flowchart TD
    A["Hero — 'EST. 1975 · BANGALORE' (Act intro: muted hero video + headline)"]
    B["HammerStrikeIntro — 'ACT 01 · IMPACT' (pinned R3F hammer, Heat/Strike/Forge)"]
    C["MaterialsGrid — 'ACT 02 · MATERIALS' (Carbon / Alloy / Stainless / Custom)"]
    D["PlantWalkthrough — 'ACT 03 · WALKTHROUGH' (scroll-scrubbed drone footage)"]
    E["StatsCounter — 'OUR POWER IS NUMBERS' (8 / 1000+ / 100+ / 1 day)"]
    F["ProductsMarquee — 'ACT 04 · CATALOGUE' (image-only catalogue marquee)"]
    G["HeritageTimeline — 'ACT 05 · HERITAGE' (1975 to 2026 horizontal timeline)"]
    H["Location — 'FIND US' (Malur address + Maps iframe)"]
    I["ClosingCta — saffron slab CTA ('Let us forge something.')"]

    A --> B --> C --> D --> E --> F --> G --> H --> I
    I --> FOOT["Footer (rendered by root layout)"]
```

Note the deliberate reorder documented in `page.tsx`: `PlantWalkthrough` was promoted to Act 03 (its source video is already warm in cache from the Hero) and `ProductsMarquee` was demoted to Act 04 (cheap lazy JPGs replaced the old STL canvases).

### Project file-tree (`src/`)

```text
src/
├── app/                          # App Router routes + global shell
│   ├── layout.tsx                # Root layout: providers, chrome, metadata, fonts
│   ├── page.tsx                  # Home page — composes the 9 "Act" sections
│   ├── globals.css               # Tailwind v4 import + @theme tokens + base/Lenis CSS
│   ├── error.tsx                 # Route error boundary (client)
│   ├── not-found.tsx             # 404 page (client)
│   ├── about/page.tsx            # /about
│   ├── solutions/page.tsx        # /solutions
│   ├── products/page.tsx         # /products
│   ├── materials/page.tsx        # /materials
│   ├── careers/page.tsx          # /careers
│   ├── contact/page.tsx          # /contact
│   └── renders/                  # 3D render hub + detail
│       ├── page.tsx              # /renders hub (server) — lists RENDERS
│       ├── loading.tsx           # SVG anvil skeleton (no Canvas)
│       ├── renders-grid.tsx      # Client grid of StlPreview tiles
│       └── [slug]/page.tsx       # /renders/[slug] — generateStaticParams from data
├── components/
│   ├── motion/                   # Animation primitives (mostly client)
│   │   ├── MagneticCursor.tsx        # Spring-follow custom cursor
│   │   ├── PageTransition.tsx        # AnimatePresence route crossfade
│   │   ├── PinnedSection.tsx         # GSAP pin + ref-backed scroll-progress store
│   │   ├── SplitText.tsx             # DIY char/word splitter for GSAP timelines
│   │   ├── useScrollImageSequence.ts # Scroll-scrubbed canvas frame sequence hook
│   │   └── useStaticPins.ts          # Mobile/reduced-motion static fallback gate
│   ├── providers/                # App-wide effect providers
│   │   ├── LenisProvider.tsx         # Singleton Lenis on GSAP ticker
│   │   ├── LegacyRedirects.tsx       # Pre-hydration WP slug redirect script
│   │   └── RouteResetEffects.tsx     # Scroll reset + ScrollTrigger refresh per nav
│   ├── three/                    # three.js / R3F (all client, ssr:false)
│   │   ├── lazy.tsx                  # next/dynamic wrappers (dedupe three across routes)
│   │   ├── HammerStrikeHero.tsx      # Animated hammer/anvil Canvas (home Act 01)
│   │   ├── StlPreview.tsx            # Auto-rotating STL tile (grids/cards)
│   │   └── StlViewer.tsx             # Full OrbitControls STL viewer (detail pages)
│   ├── ui/                        # Shared chrome + atoms
│   │   ├── Header.tsx                # Fixed nav + mobile sheet; sets --header-h
│   │   ├── Footer.tsx                # Graphite footer (nav minus Home + contact)
│   │   ├── Eyebrow.tsx               # Uppercase Work Sans label w/ mesh dash
│   │   └── NumberCounter.tsx         # In-view count-up (framer-motion)
│   └── sections/                  # Page-scoped section components
│       ├── home/                     # 9 home "Acts" (Hero … ClosingCta)
│       ├── about/                    # AboutHero, HeritageEssay, Values3Up, etc.
│       ├── solutions/                # SolutionsHero, MethodsPinned, MethodIllustration…
│       ├── products/                 # ProductsHero, ProductsGallery, ProductsClosingCta
│       ├── materials/                # MaterialsHero, MaterialsTable, Certifications
│       ├── careers/                  # CareersHero, CareersListings
│       └── contact/                  # ContactHero, ContactForm, ContactDetails
├── data/                          # Typed content (single source of truth)
│   ├── home.ts                       # Hero/stats/timeline/closing-CTA copy
│   ├── about.ts                      # Heritage chapters, values, sustainability
│   ├── products.ts                   # Catalogue items (stl | image, categories)
│   ├── solutions.ts                  # 4 forging methods (+ sample render slugs)
│   ├── materials.ts                  # Carbon/Alloy/Stainless/Custom grade families
│   ├── careers.ts                    # Listings (empty) + "send us your CV" CTA
│   ├── certifications.ts             # ISO/IATF certs for /materials
│   ├── renders.ts                    # 9 STL renders + getRenderBySlug/generateRenderParams
│   └── nav.ts                        # NAV, CTA, (LEGACY_REDIRECTS map)
└── lib/                           # Cross-cutting helpers
    ├── brand.ts                      # BRAND_HEX (mirrors @theme; for R3F material colors)
    ├── cn.ts                         # Tiny className joiner
    ├── gsap.ts                       # gsap + ScrollTrigger/Observer registration (client guard)
    └── image-formats.ts              # withExt() + cssImageSet() AVIF/WebP/JPG helpers
```

### Routes

All routes are statically generated at build (SSG / static export). There is no runtime SSR.

| Source file | URL | Generation | Renders |
| --- | --- | --- | --- |
| `src/app/page.tsx` | `/` | Static | 9-Act home narrative (Hero → ClosingCta). |
| `src/app/about/page.tsx` | `/about/` | Static | About / heritage sections. |
| `src/app/solutions/page.tsx` | `/solutions/` | Static | 4 forging methods (pinned). |
| `src/app/products/page.tsx` | `/products/` | Static | Product catalogue gallery. |
| `src/app/materials/page.tsx` | `/materials/` | Static | Steel families, grade table, certifications. |
| `src/app/careers/page.tsx` | `/careers/` | Static | "Send us your CV" panel (no posted roles). |
| `src/app/contact/page.tsx` | `/contact/` | Static | Contact details + react-hook-form/Zod form. |
| `src/app/renders/page.tsx` | `/renders/` | Static | Hub grid of all 9 renders (`StlPreview` tiles). |
| `src/app/renders/[slug]/page.tsx` | `/renders/a/` … `/renders/i/` | Static (SSG) | One page per slug via `generateStaticParams()` → `generateRenderParams()` over `RENDERS` in `data/renders.ts`; full `StlViewer` + sibling nav. Unknown slug → `notFound()`. |
| `src/app/not-found.tsx` | (404 fallback) | Static | Branded 404. |
| `src/app/error.tsx` | (error boundary) | Client | Route error fallback. |

`trailingSlash: true` means each route emits `…/index.html`, so static hosts serve clean URLs. `images.unoptimized: true` is required because there's no Image Optimization server in an export.

**Legacy redirects** are handled in two layers (Next's built-in `redirects()` is a no-op under `output: 'export'`):

1. `public/_redirects` — Netlify-style `308` rules (honoured by Netlify, Cloudflare Pages, most CDNs). Primary path.
2. `src/components/providers/LegacyRedirects.tsx` — an inline `beforeInteractive` script (mounted in the root layout) that `location.replace()`s legacy WordPress slugs before hydration, for plain hosts that ignore `_redirects`.

Mapped legacy slugs include `/home/about-ommi-forge/ → /about/`, `/home/solutuion/ → /solutions/`, `/home/forged-products/ → /products/`, `/3d-renders/ → /renders/`, and `/render-a/ … /render-h/`/`/render-h-2/` → `/renders/a/ … /renders/i/` (note `render-h-2 → /renders/h/` and `render-h → /renders/i/`). The full table appears under [Build & deploy](#build--deploy).

### Tailwind v4 design tokens

Tailwind v4 reads tokens CSS-first from the `@theme` block in `src/app/globals.css`. Every variable is auto-promoted to utilities (e.g. `--color-saffron` → `bg-saffron` / `text-saffron` / `border-saffron`). These hex values are mirrored in `src/lib/brand.ts` (`BRAND_HEX`) for contexts that can't read CSS variables, such as R3F `<meshStandardMaterial color={…} />`.

**Colour tokens**

| Token | Utility name | Hex | Notes |
| --- | --- | --- | --- |
| `--color-saffron` | `saffron` | `#FF9933` | Primary brand orange; large display only (≈2:1 on paper, fails AA for small text). |
| `--color-mesh` | `mesh` | `#FF5533` | Accent red-orange (eyebrow dash, hovers); ≈3:1, dark-bg/large only. |
| `--color-ember` | `ember` | `#C2381C` | Darker mesh (≈5.3:1) — use for small/body text on light `paper`. |
| `--color-graphite` | `graphite` | `#1F2124` | Primary dark / default text & footer slab. |
| `--color-steel` | `steel` | `#54595F` | Secondary text. |
| `--color-ash` | `ash` | `#7A7A7A` | Muted / tertiary grey. |
| `--color-peach` | `peach` | `#FFBC7D` | Soft warm tint. |
| `--color-paper` | `paper` | `#FAFAFA` | Page background. |
| `--color-snow` | `snow` | `#FFFFFF` | Pure white surfaces/cards. |
| `--color-render-bg` | `render-bg` | `#D9D9D9` | Neutral backdrop for STL/render canvases. |

**Typography & layout tokens**

| Token | Utility | Value | Font (next/font) |
| --- | --- | --- | --- |
| `--font-display` | `font-display` | `var(--font-display)` | Manrope (headings) |
| `--font-eyebrow` | `font-eyebrow` | `var(--font-eyebrow)` | Work Sans (uppercase labels) |
| `--font-body` | `font-body` | `var(--font-body)` | Roboto (body) |
| `--container-page` | `container-page` | `1140px` | Max content width |

Additional CSS-only variables in `globals.css` (outside `@theme`, so not Tailwind utilities): `--header-h` (`calc(60px + safe-area-inset-top)`, `76px` ≥768px) shared by `<main>` top padding, the Hero offset, and the mobile menu sheet; plus base styles, focus ring (saffron, 2px), `::selection` (saffron), the `.skip-link`, the Lenis CSS contract, `[data-split-text]` primitives, the magnetic-cursor `cursor:none` rules, and a global `prefers-reduced-motion` hard override.

## The scroll-scrub engine

The signature interaction of this site is **"crawl to play"**: as you scroll,
footage advances frame-by-frame, pinned to your scroll position, and runs in
reverse when you scroll back. It is the single hardest interaction to ship
*reliably on mobile Safari*, and almost every naive implementation fails there.

### The core problem: MP4 `currentTime` seeking is unreliable on iOS Safari

The obvious approach is a `<video>` element whose `currentTime` you set from
scroll progress:

```js
video.currentTime = progress * video.duration; // ❌ breaks on iOS
```

This works on desktop Chrome and falls apart on mobile Safari for two
intertwined reasons:

1. **Undecoded seeks paint white / stall.** When you assign `currentTime`,
   Safari must seek to the nearest keyframe and decode forward to the target
   frame. On iOS the decoder frequently has *no frame ready* at the instant
   the browser paints, so the `<video>` surface flashes white/black or holds a
   stale frame. There is no synchronous "give me the frame at time *t*" — the
   `seeked` event fires asynchronously, long after the scroll tick that
   requested it, so the visual lags the finger badly.

2. **The decoder isn't primed without a user-gesture `play()`.** iOS gates
   media decoding behind an autoplay/user-gesture policy. Until the video has
   actually *played*, the hardware decode path may not be warm, so the very
   first seeks (the top of the page, before any tap) are the worst-looking
   ones. You cannot programmatically `play()` your way out of this on first
   paint, and even muted-autoplay only partially warms the decoder.

Net effect: direct video scrubbing is jittery, flashes white, and lags the
scroll on exactly the device where the interaction matters most.

### The solution: pre-decode to a JPG image sequence, draw to `<canvas>`

We use the **"Apple AirPods" technique**: do the video decode *offline*, once,
at build time. Extract the clip into a numbered sequence of JPG frames, ship
those as static assets, preload them into `Image` objects in the browser, and
on each scroll tick simply `drawImage()` the frame for the current scroll
position onto a `<canvas>`.

Drawing an already-decoded `Image` is **synchronous, cheap, and
deterministic** — there is no seek, no decode-on-demand, no async `seeked`
event, no decoder-priming gesture. The frame index is a pure function of
scroll progress, so the crawl is pixel-identical on mobile and desktop and
tracks the finger with zero lag. This is implemented once in
`src/components/motion/useScrollImageSequence.ts` and consumed by both the
Hero and the Plant Walkthrough.

### Anatomy of `useScrollImageSequence`

The hook's real signature and option defaults:

```ts
interface UseScrollImageSequenceOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>; // canvas the frames draw onto
  sectionRef: RefObject<HTMLElement | null>;      // section that pins while scrubbing
  count: number;                                  // number of frames
  src: (i: number) => string;                     // builds URL for frame i (0-based)
  end?: string;                                   // ScrollTrigger pin length, default "+=220%"
  scrub?: number;                                 // scrub smoothing (s), default 0.5
}

export function useScrollImageSequence({
  canvasRef, sectionRef, count, src,
  end = '+=220%',
  scrub = 0.5,
}: UseScrollImageSequenceOptions) { /* ... */ }
```

Everything runs inside one `useEffect` keyed on `[count, end, scrub]`. Step by
step:

**1. Preload every frame into an `Image`.** Up front, the hook allocates one
`Image` per frame, sets `img.decoding = 'async'`, and kicks off the network
fetch by assigning `img.src = src(i)`:

```ts
const images: HTMLImageElement[] = [];
for (let i = 0; i < count; i += 1) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src(i);
  if (i === 0) {
    img.onload = () => { firstLoaded = true; draw(0); };
  }
  images.push(img);
}
```

Only frame 0 carries an `onload` — it draws itself the moment it decodes so
the first frame appears as soon as possible. The rest stream in the
background; the draw path tolerates a not-yet-loaded frame (see the fallback
below).

**2. Cover-fit draw math (`object-cover` semantics), DPR capped at 2.** The
canvas backing store is sized to the section's CSS box times
`devicePixelRatio`, but the DPR is clamped to **2** so 3× phones don't
rasterize an absurd canvas:

```ts
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width  = Math.round(section.clientWidth  * dpr);
canvas.height = Math.round(section.clientHeight * dpr);
canvas.style.width  = `${section.clientWidth}px`;
canvas.style.height = `${section.clientHeight}px`;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px, render at device px
```

`draw(index)` then replicates CSS `object-cover`: compare the image aspect
ratio `ir` to the container aspect ratio `cr`, scale the frame so it fully
covers the box, and center the overflow:

```ts
if (ir > cr) {            // image wider than box → match height, overflow width
  dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0;
} else {                  // image taller than box → match width, overflow height
  dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2;
}
ctx.clearRect(0, 0, cw, ch);
ctx.drawImage(img, dx, dy, dw, dh);
```

**3. The `lastDrawn` fallback to avoid flashes.** If the requested frame hasn't
decoded yet (`!img.complete || img.naturalWidth === 0`), the hook does **not**
clear to white — it redraws the last frame that *did* draw successfully:

```ts
const i = Math.max(0, Math.min(count - 1, index));
let img = images[i];
if (!img || !img.complete || img.naturalWidth === 0) {
  if (lastDrawn < 0) return;       // nothing drawn yet → leave poster showing
  img = images[lastDrawn];
  if (!img || !img.complete) return;
} else {
  lastDrawn = i;                   // record the newest good frame
}
```

This is what keeps a fast scroll smooth while frames are still streaming: you
see the nearest decoded frame instead of a flash. Both consumers also paint a
**poster / first-frame as a CSS `background` behind the canvas**, so there is
no blank flash even before frame 0 decodes.

**4. The ScrollTrigger pin maps progress → frame index.** When motion is
allowed, the hook pins the section and maps scroll progress onto the frame
range with a rounded index:

```ts
st = ScrollTrigger.create({
  trigger: section,
  start: 'top top',
  end,                 // "+=220%" — pin holds for 2.2× viewport height of scroll
  pin: true,
  pinSpacing: true,
  scrub,               // 0.5s smoothing between the scroll position and the draw
  onUpdate: (self) => {
    draw(Math.round(self.progress * (count - 1)));
  },
});
ScrollTrigger.refresh();
```

`start: 'top top'` pins when the section's top hits the viewport top. `end:
'+=220%'` holds the pin for **2.2 viewport-heights** of scroll, giving the
frames room to breathe. `scrub: 0.5` adds a half-second of smoothing so the
draw eases toward the scroll position rather than snapping. The index is
`Math.round(progress * (count - 1))` — `progress` is `0..1`, so this maps to
the inclusive `0 … count-1` frame range and rounds to the nearest real frame.

**5. Resize re-rasterization.** A `resize` listener re-runs `sizeCanvas()` (new
DPR-scaled backing store) and redraws the current frame so the canvas never
goes stale or blurry after an orientation change or window resize:

```ts
const onResize = () => {
  sizeCanvas();
  draw(lastDrawn < 0 ? 0 : lastDrawn);
};
window.addEventListener('resize', onResize);
```

**6. Reduced-motion path.** If `prefers-reduced-motion: reduce` is set, the
hook **skips the ScrollTrigger entirely** — no pin, no scrub. It sizes the
canvas and draws a single static frame (frame 0), then the section behaves as
an ordinary block. The cleanup kills the (possibly null) ScrollTrigger and
removes the resize listener.

### One scroll tick

```mermaid
sequenceDiagram
    autonumber
    participant U as "User (wheel / touch)"
    participant L as "Lenis (smooth scroll, lerp 0.08)"
    participant ST as "ScrollTrigger"
    participant H as "useScrollImageSequence"
    participant C as "Canvas 2D context"

    Note over H,C: Preload phase (once, on mount)
    H->>H: "for i in 0..count-1: new Image(), src = src(i)"
    H->>C: "frame 0 onload -> draw(0)"

    Note over U,C: Per scroll tick
    U->>L: "scroll input"
    L->>ST: "ScrollTrigger.update() (smoothed position)"
    ST->>H: "onUpdate(self) with self.progress (0..1)"
    H->>H: "idx = Math.round(progress * (count - 1))"
    alt "frame idx decoded"
        H->>C: "clearRect + drawImage(images[idx]) cover-fit"
        H->>H: "lastDrawn = idx"
    else "frame idx not ready"
        H->>C: "redraw images[lastDrawn] (no flash)"
    end
```

### Mobile pin policy

Stacking several GSAP pins on a phone is janky, and that jank *compounds* with
the hero's scroll-scrub. So the two **heavy** pinned sections degrade to their
pre-built static layouts on mobile, while the two **reliable canvas** scrubs
keep their pins everywhere. The decision is centralized in
`src/components/motion/useStaticPins.ts`, which returns `true` when
`prefers-reduced-motion: reduce` **OR** `matchMedia('(max-width: 767px)')`
matches (SSR-safe: returns `false` on the server and first client render to
avoid a hydration mismatch, then flips after mount).

```mermaid
flowchart TD
    A["useStaticPins()"] --> B{"reduced-motion OR max-width:767px ?"}

    B -- "yes (mobile / reduced)" --> C["HammerStrikeIntro -> HammerStatic (no pin)"]
    B -- "yes (mobile / reduced)" --> D["HeritageTimeline -> StaticList (no pin)"]

    B -- "no (desktop)" --> E["HammerStrikeIntro -> PinnedSection length=2.5"]
    B -- "no (desktop)" --> F["HeritageTimeline -> PinnedSection length=4"]

    G["Hero (canvas scrub)"] --> H["useScrollImageSequence pin: ALWAYS"]
    I["PlantWalkthrough (canvas scrub)"] --> H

    H -. "reliable on mobile Safari" .-> J["only pins kept on phones"]
    C -.-> J
    D -.-> J

    K["src/lib/gsap.ts: ScrollTrigger.config({ ignoreMobileResize: true })"] --> L["mobile URL-bar show/hide no longer re-fires refresh -> no pin jump"]
```

The `ignoreMobileResize: true` config in `src/lib/gsap.ts` is what stops the
classic mobile bug where the Safari/Chrome URL bar sliding in and out resizes
the viewport, re-fires `ScrollTrigger.refresh()`, and makes pinned sections
visibly jump mid-scroll.

### Frame budget

| Sequence | Frames | Size on disk | Width | Source clip | Extraction |
| --- | --- | --- | --- | --- | --- |
| **Hero** (`HERO_FRAME_COUNT = 46`) | 46 (`f-001..046.jpg`) | ~4.7 MB | 1100 px | `hero.mp4` | ~10–12 fps, JPG q5–6 |
| **Plant** (`PLANT_FRAME_COUNT = 90`) | 90 (`f-001..090.jpg`) | ~6.9 MB on server (5.1 MB source) | 1000 px | `walkthrough-scrub.mp4`, first ~9 s @ 10 fps | JPG q5–6 |

Hero frames live in `/public/assets/frames/hero/`, Plant frames in
`/public/assets/frames/plant/`; both are referenced 1-based on disk
(`f-001 …`) while the hook indexes 0-based, hence the
`String(i + 1).padStart(3, '0')` in each consumer's `src` builder. The exact
ffmpeg extraction recipe lives under [3D renders & the asset pipeline](#3d-renders--the-asset-pipeline).

### Ref-backed progress store (`PinnedSection`)

The *other* pinned sections (Hammer intro, Heritage track) get their scroll
progress from `src/components/motion/PinnedSection.tsx`, which is worth a note
because it solves a 60 fps React problem. It used to expose `progress` via
`useState`, so every ScrollTrigger tick called `setProgress(...)` and
**re-rendered every descendant** — the R3F hammer Canvas, the heritage track,
everything — 60 times a second.

It now keeps `progress` in a **mutable object held in a memoized ref-backed
store** (`{ progress, listeners: Set<() => void> }`, instantiated once via
`useMemo([])` for a stable Context identity). The ScrollTrigger `onUpdate`
writes the store directly and walks the listener set by hand — **no React
state on the hot path**:

```ts
onUpdate: (self) => {
  store.progress = self.progress;                 // direct mutation
  for (const fn of Array.from(store.listeners)) fn(); // notify, snapshot-safe
}
```

Consumers pick the right access pattern for their cost profile:

- **`useScrollSubscribe(cb)`** — fires `cb(progress)` once per tick with
  **zero React re-render**. Use it for DOM style writes, a
  `gsap.quickSetter`, `video.currentTime`, or mutating a ref read inside an
  R3F `useFrame`. It primes the callback once on mount with the current value.
- **`useScrollProgressRef()`** — one-off reads inside callbacks; returns a
  `{ current }` ref kept in sync by the same listener mechanism.
- **`useScroll()`** — legacy `useSyncExternalStore` wrapper that *does*
  re-render the calling component. Reserved for cases where the render output
  genuinely depends on progress (e.g. crossfading SVG opacities React must
  reconcile).

Pairing `useScrollSubscribe` with `gsap.quickSetter` (a pre-resolved,
allocation-free property setter) means a pinned section can drive dozens of
DOM/3D properties per frame without a single React reconciliation.

## 3D renders & the asset pipeline

The site has two distinct WebGL surfaces — a scroll-driven **hammer-strike hero**
on the home page, and a full **STL inspection viewer** on the `/renders/[slug]`
detail routes (plus rotating preview tiles on the `/renders` hub). All of it
runs on **React Three Fiber** (`@react-three/fiber` + `@react-three/drei` +
`three`), and every entry point is loaded lazily so the three.js vendor chunk
never ships on a route that does not paint a `<Canvas>`.

### The `StlViewer` R3F setup

`src/components/three/StlViewer.tsx` is the full-screen interactive viewer used
on each render-detail page. It is precise about cost and correctness:

**Loader.** Geometry is loaded with the example-jsm `STLLoader`
(`import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"`) through
R3F's `useLoader(STLLoader, src)`, which Suspends until the binary STL streams
in. The raw `BufferGeometry` is then cloned and post-processed once (memoized on
the loaded geometry):

1. `computeBoundingBox()` / `computeBoundingSphere()`, then `translate(...)` to
   recenter the part on the origin.
2. Re-compute the bounding sphere and rescale so the part fits a ~100-unit
   viewbox — `targetRadius = 50`, `scale = 50 / boundingSphere.radius` — which
   the camera at `z = 200` / `fov 35` frames cleanly regardless of the source
   part's real-world dimensions.
3. `computeVertexNormals()` for smooth shading.

The cloned geometry is disposed on unmount / `src` change
(`useEffect(() => () => geometry.dispose(), [geometry])`) so GPU buffers are not
leaked across render-to-render navigation.

**Material.** A single `meshStandardMaterial` in the brand "mesh orange"
(`BRAND_HEX.mesh = #FF5533`):

```tsx
<meshStandardMaterial
  color="#FF5533"   // BRAND_HEX.mesh
  metalness={0.7}
  roughness={0.35}
  envMapIntensity={1}
/>
```

`metalness 0.7` + `roughness 0.35` gives a brushed-metal forged look that picks
up the environment reflections; the preview tiles use the same color but a
slightly softer `roughness 0.4` (and no env map).

**Lighting / environment.** Rather than `@react-three/drei`'s `<Stage>`, the
viewer hand-rolls the lighting for control: an `ambientLight` at `0.7`, a key
`directionalLight` at `[10, 20, 10]` intensity `1.4` (casting shadows, 1024²
shadow map), and a warm peach back-rim `directionalLight` at `[-15, 8, -10]`
intensity `0.4`, color `BRAND_HEX.peach = #FFBC7D`. Reflections come from a
**self-hosted HDRI** — `<Environment files="/assets/hdr/empty_warehouse_01_1k.hdr" />`
(CC0 from Poly Haven, 1.6 MB) served same-origin from `/public/assets/hdr/`
instead of drei's `preset`, which would otherwise fetch ~1.5 MB from
`raw.githack.com` on every detail page and leak the referer.

**Controls.** `<OrbitControls>` with `enablePan={false}` (you can orbit and zoom
but never pan the part off-center), `enableZoom` on, `minDistance={80}` /
`maxDistance={350}`, and `autoRotate` at `autoRotateSpeed={1.2}`. Auto-rotate is
gated by `prefers-reduced-motion` and a toolbar toggle. Controls are
`enabled={active}` — they only become live after a tap-to-activate gate, so on
touch devices the inactive canvas is `pointer-events-none` and vertical swipes
fall through to the page scroller (Lenis) instead of being swallowed by the drag
handler. Once active, `data-lenis-prevent` + `touch-action: none` hand the
gesture fully to OrbitControls.

**ContactShadows.** A grounded `<ContactShadows position={[0, -50, 0]}
opacity={0.6} scale={150} blur={2.5} far={50} />` drops a soft contact shadow
under the floating part.

**DPR cap — `dpr={[1, 1.5]}`.** The canvas renders at device pixel ratio but
**clamps the upper bound to 1.5×**. On a Retina phone the native DPR is 3, so
without the cap the GPU would render a full-screen scene at 9× the pixel work for
a barely perceptible sharpness gain — enough to drop frames or thermally throttle
mobile GPUs. Capping at 1.5 keeps the viewer smooth on phones while still looking
crisp. (The smaller, gently-spinning preview tiles in `StlPreview.tsx` go further
and pin `dpr={[1, 1]}`, because up to 8 of them can mount on a single viewport
entry and super-sampling above device pixels buys nothing visible there.)

**Scroll-tilt camera.** The hero's scene (`HammerStrikeHero.tsx`) reads a
scroll-progress value every frame inside `useFrame` — the prop is either a raw
`0..1` number or a `{ current }` ref the parent (`PinnedSection`'s
`useScrollProgressRef`) mutates without re-rendering the component. The hammer
descends linearly from `y = +80 → 0` across the progress range; on the **rising
edge** of `progress > 0.95` (`struck` going false→true, tracked via a `wasStruck`
ref so it fires exactly once) it kicks a 350 ms impact pulse that tilts
`camera.rotation.y` by ~1.5° and brightens the key light from `1.4 → 2.2`, then
decays back to zero. Delta is clamped to `1/30` so a backgrounded tab waking up
does not snap the scene.

**Lazy-mount / IntersectionObserver gating.** `src/components/three/lazy.tsx`
wraps every three component in `next/dynamic(..., { ssr: false })`. Two things
fall out of this:

- **No SSR / no `window` on the server** — the WebGL code never runs during
  rendering.
- **A shared async chunk.** Turbopack emits per-route bundles and will not dedupe
  the ~876 KB three.js vendor across them; statically importing the components
  would ship three.js *twice* (once for `/` via `HammerStrikeHero`, once for
  `/renders/*` via `StlViewer`/`StlPreview`). Routing every import through the one
  `dynamic()` wrapper defers three to a single chunk the runtime shares across
  routes. While it loads, on-brand SVG/skeleton fallbacks are shown.

On top of the dynamic import, `StlPreview` only mounts its `<Canvas>` at all once
it is near the viewport: a callback-ref wires up an `IntersectionObserver` with
`rootMargin: "200px"` that flips `inView` and **self-disconnects after the first
intersection**. Until then the tile renders just a radial-gradient div — so the
WebGL context, the STL fetch, and the three.js evaluation are all deferred until
the scene is about to scroll on screen, and a grid of preview tiles does not spin
up eight WebGL contexts on page load.

### The 9 render parts (`src/data/renders.ts`)

The `/renders` hub and `/renders/[slug]` detail pages are driven by the `RENDERS`
array. Slugs mirror the legacy site's cryptic `RENDER A…I` codes; each is paired
with the real product name. `generateStaticParams()` pre-renders all nine detail
routes.

| Slug | Title | Product | STL file |
| --- | --- | --- | --- |
| `a` | RENDER A | Link | `/assets/stl/part-a.stl` |
| `b` | RENDER B | Shifter Fork | `/assets/stl/part-b.stl` |
| `c` | RENDER C | Carrier | `/assets/stl/part-c.stl` |
| `d` | RENDER D | Steam Manifold | `/assets/stl/part-d.stl` |
| `e` | RENDER E | Lever | `/assets/stl/part-e.stl` |
| `f` | RENDER F | Crank | `/assets/stl/part-f.stl` |
| `g` | RENDER G | Forged Sprocket | `/assets/stl/part-g.stl` |
| `h` | RENDER H | Hub | `/assets/stl/part-h.stl` |
| `i` | RENDER I | Connecting Rod | `/assets/stl/part-i.stl` |

### Asset pipeline

Source media was captured from the live canonical site (`ommiforge.com`) and a
YouTube hero clip, then processed locally into web-friendly formats and dropped
into `public/assets/`. Nothing is fetched at runtime — every asset is served
same-origin.

```mermaid
flowchart TD
    subgraph SRC["Source media"]
        YT["YouTube hero clip 'NBCDb4opv-M' (1920x1080 VP9, ~57s)"]
        PLANTMP4["Plant walkthrough MP4 ('IMG_1668-1.mp4', 1260x906 H.264)"]
        STLSRC["9 binary STLs ('File-0000N.stl' from WP uploads)"]
    end

    subgraph PROC["Processing (local, one-time)"]
        YTDLP["yt-dlp (download hero clip)"]
        FF1["ffmpeg: extract hero frame sequence -> JPG"]
        FF2["ffmpeg: extract plant frame sequence @ ~10fps -> JPG"]
        RENAME["rename 'File-0000N.stl' -> 'part-{a..i}.stl'"]
    end

    subgraph OUT["public/assets/"]
        VIDEO["video/ (mp4 + poster jpg)"]
        FHERO["frames/hero/ (f-001.jpg ... f-046.jpg)"]
        FPLANT["frames/plant/ (f-001.jpg ... f-090.jpg)"]
        STLOUT["stl/ (part-a.stl ... part-i.stl)"]
    end

    subgraph CONS["Consumed by"]
        HEROC["Hero canvas (useScrollImageSequence, 46 frames)"]
        PLANTC["PlantWalkthrough canvas (useScrollImageSequence, 90 frames)"]
        STLVIEW["StlViewer / StlPreview (R3F + STLLoader)"]
    end

    YT --> YTDLP --> VIDEO
    YTDLP --> FF1 --> FHERO
    PLANTMP4 --> FF2 --> FPLANT
    PLANTMP4 --> VIDEO
    STLSRC --> RENAME --> STLOUT

    FHERO --> HEROC
    FPLANT --> PLANTC
    STLOUT --> STLVIEW
```

Note the scroll-scrub sections (`Hero.tsx`, `PlantWalkthrough.tsx`) do **not**
play an MP4 — they draw a pre-decoded JPG image sequence onto a `<canvas>` via
`useScrollImageSequence` (the "Apple technique" detailed in
[The scroll-scrub engine](#the-scroll-scrub-engine)). MP4 `currentTime` seeking
paints white on iOS, so the frame sequence is the reliable cross-device path.
The hammer-strike hero is the R3F scene; the plant section is pure 2D canvas.

### Asset inventory (measured)

| Asset | Location | Count | Total size | Per-file / notes |
| --- | --- | --- | --- | --- |
| Hero frame sequence | `public/assets/frames/hero/` | 46 JPGs (`f-001`…`f-046`) | 4.7 MB | 1100×618 baseline JPG; driven by `HERO_FRAME_COUNT = 46` |
| Plant frame sequence | `public/assets/frames/plant/` | 90 JPGs (`f-001`…`f-090`) | 5.1 MB | 1000×562 baseline JPG; `PLANT_FRAME_COUNT = 90`, ~9s @ 10fps |
| Numbered render STLs | `public/assets/stl/` | 9 (`part-a`…`part-i`) | 59 MB | binary STL; largest `part-b.stl` 5.1 MB, smallest `part-g.stl` 1.2 MB |
| Named-product STLs | `public/assets/stl/named/` | 11 | 64 MB | mirrors of the numbered meshes under product filenames (9 byte-identical to a `part-*`) for `/forged-products` |
| HDRI | `public/assets/hdr/` | 1 | 1.6 MB | `empty_warehouse_01_1k.hdr` (CC0, Poly Haven) — env map for StlViewer |
| Video | `public/assets/video/` | 5 files | ~12.8 MB | see below |

**`public/assets/video/` contents (measured):**

| File | Size | Status |
| --- | --- | --- |
| `hero-firstshot.mp4` | 3.0 MB | hero footage (the YouTube `NBCDb4opv-M` source) |
| `hero-poster.jpg` | 320 KB | hero poster frame |
| `plant-pan-1080.mp4` | 1.0 MB | plant panning shot |
| `plant-walkthrough.mp4` | 192 KB | short plant loop (source for the plant frame sequence) |
| `walkthrough-scrub.mp4` | 9.0 MB | **unreferenced legacy artifact** |

> `public/assets/MEDIA_MANIFEST.md` documents the original source URLs and the
> STL deduplication (the 9 `part-{a..i}.stl` files and 9 of the 11 named-product
> STLs share identical mesh data — WordPress re-uploaded the same source mesh
> under multiple filenames).

### ffmpeg frame-extraction recipe

The image sequences were extracted from the source clips with ffmpeg. The plant
sequence is decoded at ~10 fps from the first ~9 s of the walkthrough clip:

```sh
# Hero sequence (-> public/assets/frames/hero/f-001.jpg …)
ffmpeg -i hero.mp4 -vf "scale=1100:-1" -q:v 4 \
  public/assets/frames/hero/f-%03d.jpg

# Plant walkthrough sequence, ~10fps, first ~9s (-> frames/plant/f-001.jpg …)
ffmpeg -i plant-walkthrough.mp4 -t 9 -vf "fps=10,scale=1000:-1" -q:v 4 \
  public/assets/frames/plant/f-%03d.jpg
```

> **Why JPG, not WebP:** the system `ffmpeg` used for this build was compiled
> **without `libwebp`**, so it cannot encode `.webp` frames. The sequences are
> therefore baseline JPG. (WebP would shrink the sequence payload meaningfully,
> so re-encoding with a libwebp-enabled ffmpeg is a future optimization.)

> **Legacy artifact:** `public/assets/video/walkthrough-scrub.mp4` (9.0 MB) was
> the original scrub source before the plant section moved to the
> `frames/plant/` JPG sequence. It is **no longer referenced anywhere in `src/`**
> and can be deleted to reclaim space.

## Performance & accessibility

### Performance

The site is a **fully static export** (`output: 'export'` in `next.config.ts` → an `out/` of HTML/CSS/JS only). There is no Node server at runtime, so the whole thing is CDN-friendly: every route is a flat file that any static host or edge can serve and cache. `trailingSlash: true` emits `/about/index.html` so clean URLs work everywhere.

- **Per-route code splitting.** Turbopack emits a bundle per route, so a visitor to `/contact` never downloads the home page's hero/scroll machinery.
- **Lazy, IntersectionObserver-gated three.js.** three.js is ~876 KB. All three.js components (`HammerStrikeHero`, `StlViewer`, `StlPreview`) are wrapped in `next/dynamic(..., { ssr: false })` in `src/components/three/lazy.tsx`, so the heavy three chunk is split into its own shared async chunk and never runs on the server. On top of that, `StlPreview` mounts its `<Canvas>` only after an `IntersectionObserver` (`rootMargin: '200px'`) reports it near the viewport — until then it shows a cheap SVG/gradient skeleton, so up to 8 marquee tiles don't all spin up WebGL contexts at once.
- **DPR caps on every R3F canvas.** `HammerStrikeHero` and `StlViewer` render at `dpr={[1, 1.5]}`; the small rotating marquee tiles in `StlPreview` are pinned to `dpr={[1, 1]}` (they're ~280×360 — super-sampling past device pixels just burns GPU for no visible gain). Frame deltas in `HammerStrikeHero` are clamped to `1/30` so a backgrounded tab doesn't snap on resume.
- **Scroll image-sequence instead of `<video>`.** The hero (`HERO_FRAME_COUNT = 46`) and the plant walkthrough (`PLANT_FRAME_COUNT = 90`) use `useScrollImageSequence`, which preloads N JPGs and draws the frame for the current scroll position onto a `<canvas>` (cover-fit, DPR-aware). **The honest tradeoff:** this costs upfront KB — you pay to download all N frames before the scrub is fully smooth. In return, scrubbing is *pure canvas draws of already-decoded images* — cheap, deterministic, and identical on mobile and desktop. Seeking an MP4 per scroll tick is unreliable (mobile Safari paints white on undecoded seeks and the decode cost causes jank); frame sequences buy buttery, reliable scrub for that upfront cost.
- **next/font self-hosting.** Manrope, Work Sans, and Roboto load via `next/font/google` (`display: 'swap'`), self-hosted at build time and wired to CSS variables. No third-party font request, no layout shift.
- **`images.unoptimized: true` + immutable caching.** Required under `output: 'export'` (no Image Optimization server). We pre-generate AVIF + WebP siblings via `scripts/optimize-images.mjs` and reference them through `src/lib/image-formats.ts` (`cssImageSet()` emits a `image-set()` with `type()` so browsers pick AVIF → WebP → source). Raster `<img>`s use `loading="lazy"` + `decoding="async"`. `public/_headers` sets `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and `/_next/static/*`.
- **Caddy edge.** The deploy host runs Caddy with `encode zstd gzip` and HTTP Range support, so text assets compress and media (STL/HDRI, large files) stream and seek via `206 Partial Content`.

### Is motion enabled? (decision flow)

```mermaid
flowchart TD
    A["Page mounts"] --> B{"prefers-reduced-motion: reduce?"}
    B -- yes --> S["Static path"]
    B -- no --> C{"NEXT_PUBLIC_CALM_MODE === '1'?"}
    C -- yes --> S
    C -- no --> D{"Viewport width <= 767px? (useStaticPins)"}
    D -- yes --> P["Heavy pinned sections render static fallback (no pin)"]
    D -- no --> F["Full motion path"]

    S --> S1["MotionConfig reducedMotion='always' -> Framer animations no-op"]
    S --> S2["GSAP ScrollTriggers skipped (PinnedSection / useScrollImageSequence early-return)"]
    S --> S3["Canvas draws a single frame (no scrub)"]
    S --> S4["Lenis disabled -> native scroll; magnetic cursor off"]

    F --> F1["MotionConfig reducedMotion='user' -> Framer plays"]
    F --> F2["useStaticPins() false -> GSAP pins + scrub timelines run"]
    F --> F3["useScrollImageSequence pins section + scrubs N frames"]
    F --> F4["Lenis smooth scroll + magnetic cursor on"]
```

Two gates do most of the work. `<MotionConfig reducedMotion={...}>` in `layout.tsx` is `'always'` when `NEXT_PUBLIC_CALM_MODE === '1'`, else `'user'` (follows the OS) — this controls every Framer `useReducedMotion()` consumer. `useStaticPins()` (`reduced || max-width: 767px`) separately routes the *heavy GSAP-pinned* sections (e.g. `HammerStrikeIntro`, `HeritageTimeline`) to their already-built static layouts, because stacking pinned scrubs is janky on phones. Lenis and the magnetic cursor read the flags directly via `matchMedia` (`MotionConfig` doesn't reach them).

### Accessibility

- **`prefers-reduced-motion` is fully honored** — not just dampened:
  - GSAP timelines no-op: `PinnedSection` and `useScrollImageSequence` early-return before creating any `ScrollTrigger` when reduce is set.
  - The scroll-sequence canvas paints a **single static frame** instead of scrubbing.
  - Pins are disabled (`useStaticPins` → static layout).
  - The magnetic cursor is off and Lenis falls back to native scroll.
  - A global CSS hard override (`@media (prefers-reduced-motion: reduce)`) crushes any stray `animation`/`transition` to `0.001ms` and forces `scroll-behavior: auto`.
- **Decorative media is `aria-hidden`.** The three.js skeletons and canvas hosts carry `aria-hidden="true"`; interactive viewers expose a real label (`StlPreview` sets `role="img"` + `aria-label`, `StlViewer`'s tap-gate is a `<button aria-label="Tap to interact with the 3D model">`).
- **Semantic headings and landmarks**, with a real **skip-to-main**: a `.skip-link` (`<a href="#main">Skip to content</a>`) targets `<main id="main" tabIndex={-1}>`, so it's programmatically focusable after the jump.
- **Visible focus rings + keyboard nav** throughout; the STL viewer toolbar (rotate / reset / fullscreen / download) is real `<button>`/`<a>` elements with `aria-label`s.
- **`viewport-fit=cover`** (`viewport.viewportFit: 'cover'`) so `env(safe-area-inset-*)` resolves on notched iPhones and the header/menu don't collide with the notch or home indicator.
- **CALM_MODE escape hatch.** Build with `NEXT_PUBLIC_CALM_MODE=1` to force the entire tested static path (no page-wipe flash, no scrubbed media, no pinned jumps, native scroll, no custom cursor) — rock-solid for live demos or low-power devices.
- **Resilience:** `src/app/error.tsx` detects `ChunkLoadError` (cold-edge/relay chunk drops) and auto-reloads exactly once (sessionStorage-guarded), so a dropped lazy chunk shows a brief blink rather than a crash screen — never a raw stack trace in front of a client.

### SEO / meta

- **`metadataBase` override via `NEXT_PUBLIC_SITE_URL`.** Defaults to `https://www.ommiforge.com`; set `NEXT_PUBLIC_SITE_URL` at build time for a temp preview (e.g. a Tailscale Funnel link) so OG/Twitter card images and canonicals resolve to the preview host and the share thumbnail renders.
- **Per-route metadata** via the App Router `metadata` export, with a title template (`%s · Ommi Forge`), OpenGraph + Twitter `summary_large_image` cards pointing at `/og-image.png`, and `locale: 'en_IN'`.
- **Preview is not indexable.** `public/robots.txt` currently ships `User-agent: *` / `Disallow: /` (with a `Sitemap:` line for production). The comment flags it: *"Temp preview — remove `Disallow` before production launch."* So the client preview stays out of search results until launch.

### Lighthouse posture

Performance is **deliberately traded** for cinematic media: preloading frame sequences and shipping three.js mean the home route is intentionally heavier than a content site would be — that's the design intent (buttery, reliable scrub and live 3D over a top-end Perf score). **Accessibility, Best Practices, and SEO are targeted high** — semantic structure, full reduced-motion support, focus management, a strict CSP / security headers (`public/_headers`), and clean per-route metadata. Need a pristine Perf trace for a demo? Build with `NEXT_PUBLIC_CALM_MODE=1` to drop the scrubbed media and smooth-scroll layers.

## Build & deploy

The site is a **Next.js 16 static export** (`output: 'export'`). `pnpm build`
emits a fully self-contained `out/` directory (HTML, CSS, JS, fonts, frames,
videos, STLs, plus the `_headers` / `_redirects` / `.htaccess` sidecars copied
verbatim from `public/`). There is no Node runtime in production — anything
that can serve a folder of files can serve this site.

The live client preview is hosted on a **Pi VPS in Mumbai**, served by
**Caddy** and exposed over the public internet via **Tailscale Funnel** at:

> https://pi-vps-mumbai.tail641fa8.ts.net

### Build + deploy commands

The canonical preview build + push (from `docs/DEPLOY.md` and `HANDOFF.md`):

```bash
# 1. Build the static export, pointing OG/canonicals at the preview host
NEXT_PUBLIC_SITE_URL=https://pi-vps-mumbai.tail641fa8.ts.net pnpm build

# 2. Mirror out/ to the Pi VPS web root (deletes stale files server-side)
rsync -az --delete -e ssh out/ root@pi-vps-mumbai:/srv/ommi-forge/
```

No server restart is needed — Caddy serves files live off disk, so the next
request picks up the new build immediately.

**Always verify after deploy** (`HANDOFF.md`): `curl` the home page + a sample
of the new assets for `200`, and confirm `cache-control: ...immutable` is
present on hashed assets.

#### What `NEXT_PUBLIC_SITE_URL` does

It overrides `metadataBase`, which is what every Open Graph / Twitter card
image URL and canonical link is resolved against. From `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  // Production defaults to ommiforge.com. For a temp preview (e.g. a
  // Tailscale Funnel link) set NEXT_PUBLIC_SITE_URL at build time so the
  // OG/Twitter card image + canonicals resolve to the preview host and
  // the link-preview thumbnail renders when the URL is shared.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ommiforge.com',
  ),
  ...
};
```

So a plain `pnpm build` bakes in `https://www.ommiforge.com` (production); a
build with `NEXT_PUBLIC_SITE_URL=https://pi-vps-mumbai.tail641fa8.ts.net` makes
the OG link-preview thumbnail correct when someone pastes the temp link into
WhatsApp/Slack. It is a `NEXT_PUBLIC_*` var because it bakes into the static
HTML at build time — there is no server to read it at runtime.

#### Take the preview down

```bash
ssh root@pi-vps-mumbai 'tailscale funnel --https=443 off && systemctl disable --now ommi-forge.service'
```

### Deploy pipeline

```mermaid
flowchart LR
    subgraph dev["Dev machine"]
        A["pnpm build<br/>(NEXT_PUBLIC_SITE_URL set)"] --> B["out/ (static export)"]
    end
    B -->|"rsync -az --delete (ssh)"| C
    subgraph pi["Pi VPS — Mumbai"]
        C["/srv/ommi-forge"] --> D["Caddy @ 127.0.0.1:8080<br/>zstd/gzip · Range/206 · immutable cache"]
        D --> E["Tailscale Funnel<br/>(public 443 to 127.0.0.1:8080)"]
    end
    E -->|"HTTPS"| F["https://pi-vps-mumbai.tail641fa8.ts.net"]
    F --> G["Client browser"]
```

### Request lifecycle

```mermaid
sequenceDiagram
    participant B as Browser
    participant TF as "Tailscale Funnel (TLS 443)"
    participant C as "Caddy (127.0.0.1:8080)"
    participant FS as "Static file (/srv/ommi-forge)"

    B->>TF: "GET /assets/frames/hero/f-001.jpg (HTTPS)"
    TF->>C: "Proxy to 127.0.0.1:8080 (TLS terminated)"
    C->>FS: "Read file from disk"
    FS-->>C: "File bytes"
    C-->>TF: "200/206 + cache-control: public, max-age=31536000, immutable + zstd/gzip"
    TF-->>B: "Response over HTTPS"

    Note over B,C: "Media (video/STL): browser sends Range header, Caddy replies 206 Partial Content for seek/stream"
    Note over B,C: "HTML (e.g. /about/): served without the immutable header so updates are picked up"
```

### Caddy config & systemd unit (Pi VPS)

> These live on the server (`/etc/caddy/Caddyfile`, `ommi-forge.service`) and
> are documented here from `docs/DEPLOY.md` — the repo intentionally does not
> vendor the server files. Per `docs/DEPLOY.md`, the preview runs:

- **Caddy** (`/etc/caddy/Caddyfile`) serving `/srv/ommi-forge` on
  `127.0.0.1:8080` with `encode zstd gzip`, HTTP Range support (videos
  stream + seek → `206`), and `Cache-Control: immutable` on `/assets/*` +
  `/_next/static/*`. The stock `caddy.service` is **disabled** (it binds
  `:443` and would fight Funnel).
- **systemd unit** `ommi-forge.service` → `caddy run` with `Restart=always`
  (survives reboot/crash).
- **Tailscale Funnel** proxying public `443` → `127.0.0.1:8080`.

> Note: Python `http.server` was the first cut but serves uncompressed with
> poor Range support, so media (videos/STL) struggled over the relay — Caddy
> replaced it.

### Caching strategy

| Path | `Cache-Control` | Rationale |
| --- | --- | --- |
| `/assets/*` (incl. `/assets/frames/*`) | `public, max-age=31536000, immutable` | Content-stable media (frames, videos, STLs); 1-year immutable cache |
| `/_next/static/*` | `public, max-age=31536000, immutable` | Build-hashed JS/CSS chunks — filename changes on every rebuild, so safe to cache forever |
| HTML pages (e.g. `/`, `/about/`) | not immutable (revalidate) | Pages change between deploys; the browser revalidates so a redeploy is picked up |

- **Range / 206 support**: Caddy honours HTTP `Range` requests, so large media
  (the scroll-scrub video + `.stl` viewer files under `/renders/`) can stream
  and seek with `206 Partial Content` instead of a full re-download.
- **Compression**: `encode zstd gzip` (zstd preferred, gzip fallback).
- The same immutable rules are mirrored in `vercel.json` (`/assets/(.*)` and
  `/_next/static/(.*)` → `public, max-age=31536000, immutable`) for the Vercel
  route, since Vercel ignores `public/_headers`.

### `next.config.ts` specifics

```ts
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

- **`output: 'export'`** — emits a static `out/` with HTML/CSS/JS only; no
  Node server in production.
- **`images.unoptimized: true`** — required under static export (there is no
  Image Optimization server at runtime).
- **`trailingSlash: true`** — emits `/about/index.html` so any static host
  (Hostinger, Netlify, S3, Caddy `file_server`) serves clean URLs out of the
  box. Nav hrefs in `src/data/nav.ts` already carry trailing slashes to avoid
  a `308` hop on every navigation.

#### Legacy WordPress redirect map

Next.js' built-in `redirects()` is a **no-op under `output: 'export'`**, so old
WordPress slugs are handled by `public/_redirects` (Netlify-style, honoured by
Netlify / Cloudflare Pages / most CDN rule engines) with a client-side fallback
in `src/components/providers/LegacyRedirects.tsx` for hosts that don't read it
(plain Hostinger, etc.). On the Caddy preview these are expressed as nginx-style
`return 308` rules in `docs/DEPLOY.md`. The real map (from `public/_redirects`,
all `308`):

| Old WordPress URL | New route |
| --- | --- |
| `/home/about-ommi-forge` (+ trailing `/`) | `/about/` |
| `/home/solutuion` (+ trailing `/`) | `/solutions/` |
| `/home/forged-products` (+ trailing `/`) | `/products/` |
| `/3d-renders` (+ trailing `/`) | `/renders/` |
| `/render-a` … `/render-g` (+ trailing `/`) | `/renders/a/` … `/renders/g/` |
| `/render-h-2` (+ trailing `/`) | `/renders/h/` |
| `/render-h` (+ trailing `/`) | `/renders/i/` |

> The render slugs are intentionally remapped: the source site's `render-h-2`
> is "RENDER H" (→ `/renders/h/`) and `render-h` is "RENDER I"
> (→ `/renders/i/`). Both with-slash and without-slash source forms are listed
> in `public/_redirects` to cover any inbound link style.

### Self-host anywhere

Because the output is a pure static `out/` directory, it runs on **any** static
host with no special runtime:

- **Vercel** — `vercel --prod`; reads `vercel.json` (`buildCommand: pnpm build`,
  `outputDirectory: out`, `framework: null`, header + immutable-cache rules).
- **Netlify** — drop `out/` (or wire the repo); `public/_redirects` is honoured
  natively.
- **Hostinger / Apache** — upload the contents of `out/` to `public_html/`;
  `out/.htaccess` carries the security headers (the production cutover path).
- **S3 + CloudFront / Cloudflare Pages / plain nginx / Caddy** — point the doc
  root at `out/`. The Pi VPS preview above is exactly this case (Caddy serving
  `/srv/ommi-forge`). The full Vercel + Hostinger playbook lives in
  [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Local development

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io) (the lockfile is
`pnpm-lock.yaml`). The project uses Turbopack via Next.js 16 — no extra global
tooling is required.

```bash
pnpm install              # install dependencies

pnpm dev                  # dev server on http://localhost:3000

pnpm build                # static export → ./out/
                          # (prebuild also generates sitemap, favicons, OG image)

pnpm lint                 # ESLint (Next.js + React-hooks rules)
pnpm exec tsc --noEmit    # typecheck (also exposed as `pnpm typecheck`)
```

Optional build-time helpers (see `package.json` `scripts`): `pnpm optimize-images`
(AVIF/WebP siblings via `sharp`), and `pnpm build:meta` /
`pnpm build:sitemap` / `pnpm build:favicons` / `pnpm build:og` for the
metadata generators that the `prebuild` hook runs automatically.

**The `NEXT_PUBLIC_CALM_MODE=1` escape hatch.** Building or running with this
env var forces the entire tested static path — `MotionConfig` flips to
`reducedMotion: 'always'`, Lenis is skipped (native scroll), and every
GSAP-pinned / scroll-scrubbed section early-returns to its static layout. No
page-wipe flash, no scrubbed media, no pinned jumps, no custom cursor. Use it
for rock-solid live demos, low-power devices, or a pristine Lighthouse Perf
trace:

```bash
NEXT_PUBLIC_CALM_MODE=1 pnpm dev      # or pnpm build
```

To wire the contact form to a real email endpoint, copy `.env.example` to
`.env.local` and set `NEXT_PUBLIC_FORMSPREE_URL`; without it the form falls back
to a no-network "log only" mode so local dev still flows end-to-end. Analytics
are off by default — set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to opt into Plausible.

## Credits & license

Built as authorised client work for **Ommi Forge Pvt. Ltd.** via
[SMARK8ING](https://smark8ing.com). The hero video, plant footage, and all 3D
STL part files are the client's own assets, sourced from their existing site and
the YouTube channel hosting their plant tour.

Engineered with **Next.js 16** (App Router, static export), **React Three Fiber**
+ **three.js**, **GSAP** (ScrollTrigger + Observer), **Framer Motion**,
**Lenis**, and **Tailwind CSS v4**.

No analytics, no third-party trackers, no cookies, and no outbound runtime
`fetch`/`XHR` by default. Security headers ship via `public/_headers`
(Netlify-style) and `public/.htaccess` (Apache/Hostinger) with a strict CSP.

Licensed **MIT** — see [LICENSE](./LICENSE).
