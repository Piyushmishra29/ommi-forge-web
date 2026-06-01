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
- [Visual tour](#visual-tour)
- [The visual system](#the-visual-system)
- [The site this replaces (legacy WordPress)](#the-site-this-replaces-legacy-wordpress)
- [Architecture](#architecture)
- [Deep diagrams](#deep-diagrams)
- [The scroll-scrub engine](#the-scroll-scrub-engine)
- [3D renders & the asset pipeline](#3d-renders--the-asset-pipeline)
- [Component reference](#component-reference)
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

## Visual tour

A clickable record of every page in the static build, captured at three real device sizes against the production `out/` artefact. Mobile is iPhone 14 Pro (393x852 @3x), tablet is iPad Pro 11" (834x1194 @2x), desktop is 1440x900 @2x.

### Every route, every viewport

<table>
  <thead>
    <tr>
      <th align="left">Route</th>
      <th align="center">Mobile · iPhone 14 Pro</th>
      <th align="center">Tablet · iPad Pro 11"</th>
      <th align="center">Desktop · 1440 @2x</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/</code><br/>home, full cinematic stack</td>
      <td align="center"><img src="docs/images/mobile-home.png" width="220" alt="Mobile home hero" /></td>
      <td align="center"><img src="docs/images/tablet-home.png" width="220" alt="Tablet home hero" /></td>
      <td align="center"><img src="docs/images/desktop-home.png" width="220" alt="Desktop home hero" /></td>
    </tr>
    <tr>
      <td><code>/about/</code><br/>heritage, founder voice</td>
      <td align="center"><img src="docs/images/mobile-about.png" width="220" alt="Mobile about" /></td>
      <td align="center">—</td>
      <td align="center"><img src="docs/images/desktop-about.png" width="220" alt="Desktop about" /></td>
    </tr>
    <tr>
      <td><code>/solutions/</code><br/>capability breakdown</td>
      <td align="center"><img src="docs/images/mobile-solutions.png" width="220" alt="Mobile solutions" /></td>
      <td align="center">—</td>
      <td align="center"><img src="docs/images/desktop-solutions.png" width="220" alt="Desktop solutions" /></td>
    </tr>
    <tr>
      <td><code>/products/</code><br/>part families</td>
      <td align="center"><img src="docs/images/mobile-products.png" width="220" alt="Mobile products" /></td>
      <td align="center">—</td>
      <td align="center"><img src="docs/images/desktop-products.png" width="220" alt="Desktop products" /></td>
    </tr>
    <tr>
      <td><code>/materials/</code><br/>alloy library</td>
      <td align="center"><img src="docs/images/mobile-materials-v2.png" width="220" alt="Mobile materials" /></td>
      <td align="center"><img src="docs/images/tablet-materials.png" width="220" alt="Tablet materials" /></td>
      <td align="center"><img src="docs/images/desktop-materials.png" width="220" alt="Desktop materials" /></td>
    </tr>
    <tr>
      <td><code>/renders/</code><br/>STL gallery index</td>
      <td align="center"><img src="docs/images/mobile-renders-grid.png" width="220" alt="Mobile renders grid" /></td>
      <td align="center"><img src="docs/images/tablet-renders.png" width="220" alt="Tablet renders" /></td>
      <td align="center"><img src="docs/images/desktop-renders-grid.png" width="220" alt="Desktop renders grid" /></td>
    </tr>
    <tr>
      <td><code>/renders/a/</code><br/>three.js STL viewer</td>
      <td align="center"><img src="docs/images/mobile-render-a.png" width="220" alt="Mobile render A" /></td>
      <td align="center"><img src="docs/images/tablet-render-a.png" width="220" alt="Tablet render A" /></td>
      <td align="center"><img src="docs/images/desktop-render-a.png" width="220" alt="Desktop render A" /></td>
    </tr>
    <tr>
      <td><code>/renders/b/</code><br/>second STL slug</td>
      <td align="center"><img src="docs/images/mobile-render-b.png" width="220" alt="Mobile render B" /></td>
      <td align="center">—</td>
      <td align="center"><img src="docs/images/desktop-render-b.png" width="220" alt="Desktop render B" /></td>
    </tr>
    <tr>
      <td><code>/renders/c/</code><br/>third STL slug</td>
      <td align="center"><img src="docs/images/mobile-render-c.png" width="220" alt="Mobile render C" /></td>
      <td align="center">—</td>
      <td align="center">—</td>
    </tr>
    <tr>
      <td><code>/careers/</code><br/>hiring + culture</td>
      <td align="center"><img src="docs/images/mobile-careers.png" width="220" alt="Mobile careers" /></td>
      <td align="center">—</td>
      <td align="center"><img src="docs/images/desktop-careers.png" width="220" alt="Desktop careers" /></td>
    </tr>
    <tr>
      <td><code>/contact/</code><br/>quote-to-part form</td>
      <td align="center"><img src="docs/images/mobile-contact-v2.png" width="220" alt="Mobile contact" /></td>
      <td align="center"><img src="docs/images/tablet-contact.png" width="220" alt="Tablet contact" /></td>
      <td align="center"><img src="docs/images/desktop-contact.png" width="220" alt="Desktop contact" /></td>
    </tr>
  </tbody>
</table>

### Home page scroll choreography (mobile)

The home page is a five-act scroll-scrub timeline. Each frame below is the same `/` URL on the same iPhone — only the scroll position changes. The hammer and plant acts are canvas image-sequences driven by `scrollY`; the heritage and footer acts are document-flow layouts.

<table>
  <tr>
    <td align="center"><img src="docs/images/mobile-home-hero.png" width="180" alt="Hero" /><br/><sub><b>1 · Hero</b><br/><i>Forged in India</i></sub></td>
    <td align="center"><img src="docs/images/mobile-home-hammer.png" width="180" alt="Hammer act" /><br/><sub><b>2 · Act 01 Impact</b><br/>hammer scrub</sub></td>
    <td align="center"><img src="docs/images/mobile-home-plant.png" width="180" alt="Plant walkthrough" /><br/><sub><b>3 · Plant walkthrough</b><br/>image sequence</sub></td>
    <td align="center"><img src="docs/images/mobile-home-heritage.png" width="180" alt="Heritage" /><br/><sub><b>4 · Heritage</b><br/>since 1975</sub></td>
    <td align="center"><img src="docs/images/mobile-home-footer.png" width="180" alt="Footer" /><br/><sub><b>5 · Footer</b><br/>quote CTA</sub></td>
  </tr>
</table>

> Want to see the tablet experience pin the plant walkthrough mid-scroll? Here it is in the wild: <img src="docs/images/tablet-home-plant.png" width="320" alt="Tablet plant walkthrough" />

## The visual system

> Brand tokens, type, asset filmstrips, and the 9 forged parts at a glance — so a reader can SEE the design system without leaving the doc.

### Brand tokens

Single source of truth lives in [`src/app/globals.css`](src/app/globals.css) as a Tailwind v4 `@theme` block; [`src/lib/brand.ts`](src/lib/brand.ts) mirrors the hexes for R3F / three.js consumers that can't read CSS vars.

![Brand colors](docs/images/colors.svg)

| Token | Hex | Use case |
| --- | --- | --- |
| `saffron` | `#FF9933` | Primary accent — CTAs, focus rings, selection background |
| `mesh` | `#FF5533` | Heat / hero accent (3:1 — large display only on paper) |
| `ember` | `#C2381C` | AA-safe mesh substitute for small/body text on light bgs (≈5.3:1) |
| `graphite` | `#1F2124` | Body text, dark surfaces, R3F default material |
| `steel` | `#54595F` | Secondary text, rules, captions |
| `ash` | `#7A7A7A` | Muted text, micro-captions |
| `peach` | `#FFBC7D` | Tertiary accent, render-detail highlights |
| `paper` | `#FAFAFA` | Page background |
| `snow` | `#FFFFFF` | Cards, surfaces above paper |
| `render-bg` | `#D9D9D9` | Canvas background behind 3D / STL viewers |

### Typography

Three self-hosted Google fonts wired through `next/font` in [`src/app/layout.tsx`](src/app/layout.tsx); each exposes a CSS variable (`--font-display`, `--font-eyebrow`, `--font-body`) that Tailwind v4 promotes to `font-display` / `font-eyebrow` / `font-body` utilities via the `@theme` block.

![Typography specimen](docs/images/typography.svg)

> Note: GitHub strips remote `@import` from inline SVG `<style>`, so the specimen above renders in the platform sans/serif fallback rather than the live Manrope / Work Sans / Roboto faces. The weights, scale, and role for each track are accurate; for the real type, see the running site or load the SVG in a browser locally.

| Family | Variable | Weights | Role |
| --- | --- | --- | --- |
| Manrope | `--font-display` | 300 / 400 / 500 / 700 | All headings (`h1`–`h6`), hero numerals, render titles. Default 300. |
| Work Sans | `--font-eyebrow` | 600 / 800 | Eyebrows, section labels, skip-link, uppercase chips. |
| Roboto | `--font-body` | 400 / 600 | Body copy, captions, running prose. Line-height 1.55. |

### Hero frame strip — 46 frames @ 12fps, ~3.8s

The hero scrubs through `public/assets/frames/hero/f-001.jpg` … `f-046.jpg` as the user scrolls. Sheet below tiles every 3rd frame (16 thumbnails) to convey the arc.

![Hero frame strip](docs/images/hero-strip.png)

### Plant frame strip — 90 frames @ 10fps, ~9s

The plant section scrubs through `public/assets/frames/plant/f-001.jpg` … `f-090.jpg`. Sheet below tiles every 5th frame (18 thumbnails).

![Plant frame strip](docs/images/plant-strip.png)

### The 9 forged parts

The `/renders` hub surfaces 9 closed-die / open-die parts, keyed by single-letter slug (legacy URL parity) and paired with the real product name from the Ommi Forge dropdown nav. Data lives in [`src/data/renders.ts`](src/data/renders.ts); STL geometry lives in `public/assets/stl/`.

![STL parts contact sheet](docs/images/stl-parts.png)

> The contact sheet above is a synthetic graphite-card layout (slug + product name + filename) rather than rendered STL geometry — full meshes are loaded client-side by the R3F viewer on each detail route.

| Slug | Title | Product | STL |
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

## Deep diagrams

A second pass on the architecture — angles the top-of-README diagrams don't cover. These look at the URL surface, the data spine, the lifecycle of the cinematic primitives, and the brand-token graph that ties Tailwind, R3F materials, and motion together.

### 1. Site map + legacy WordPress redirect map

Every public route in the App Router, plus the `LegacyRedirects` pre-hydration script that catches the old WordPress URLs (`/home/about-ommi-forge/`, `/home/solutuion/`, `/home/forged-products/`, `/3d-renders/`, and `/render-{a..h-2}/`) and rewrites them client-side via `location.replace` before React mounts. The 9 `/renders/[slug]/` leaves are statically generated from `RENDERS` in `src/data/renders.ts`.

```mermaid
graph LR
  subgraph Legacy["Legacy WordPress URLs (LegacyRedirects.tsx)"]
    L1["/home/about-ommi-forge/"]
    L2["/home/solutuion/"]
    L3["/home/forged-products/"]
    L4["/3d-renders/"]
    L5["/render-a/ ... /render-g/"]
    L6["/render-h-2/"]
    L7["/render-h/"]
  end

  subgraph New["App Router routes (trailingSlash: true)"]
    R0["/"]
    R1["/about/"]
    R2["/solutions/"]
    R3["/products/"]
    R4["/materials/"]
    R5["/renders/"]
    R6["/careers/"]
    R7["/contact/"]
  end

  subgraph Leaves["/renders/[slug]/ (generateStaticParams x 9)"]
    A["/renders/a/ — Link"]
    B["/renders/b/ — Shifter Fork"]
    C["/renders/c/ — Carrier"]
    D["/renders/d/ — Steam Manifold"]
    E["/renders/e/ — Lever"]
    F["/renders/f/ — Crank"]
    G["/renders/g/ — Forged Sprocket"]
    H["/renders/h/ — Hub"]
    I["/renders/i/ — Connecting Rod"]
  end

  L1 --> R1
  L2 --> R2
  L3 --> R3
  L4 --> R5
  L5 --> A
  L5 --> B
  L5 --> C
  L5 --> D
  L5 --> E
  L5 --> F
  L5 --> G
  L6 --> H
  L7 --> I

  R5 --> A
  R5 --> B
  R5 --> C
  R5 --> D
  R5 --> E
  R5 --> F
  R5 --> G
  R5 --> H
  R5 --> I
```

### 2. Data → component flow

Every file under `src/data/` is the single source of truth for one slice of copy/structure. This shows which components actually import which file (grepped from `src/`). `home.ts` is the busiest — it fans out to every Act on the home page. `renders.ts` feeds both `/renders/` and the dynamic detail route, and also gets cross-referenced by `MethodsPinned` on `/solutions/`.

```mermaid
flowchart LR
  nav["src/data/nav.ts"]
  home["src/data/home.ts"]
  renders["src/data/renders.ts"]
  materials["src/data/materials.ts"]
  products["src/data/products.ts"]
  about["src/data/about.ts"]
  solutions["src/data/solutions.ts"]
  careers["src/data/careers.ts"]
  certifications["src/data/certifications.ts"]

  nav --> Header["ui/Header.tsx"]
  nav --> Footer["ui/Footer.tsx"]

  home --> Hero["home/Hero.tsx"]
  home --> Hammer["home/HammerStrikeIntro.tsx"]
  home --> Marquee["home/ProductsMarquee.tsx"]
  home --> Stats["home/StatsCounter.tsx"]
  home --> Heritage["home/HeritageTimeline.tsx"]
  home --> Loc["home/Location.tsx"]
  home --> Closing["home/ClosingCta.tsx"]

  renders --> RendersHub["app/renders/page.tsx"]
  renders --> RendersGrid["app/renders/renders-grid.tsx"]
  renders --> RenderDetail["app/renders/[slug]/page.tsx"]
  renders --> MethodsPinned["solutions/MethodsPinned.tsx"]

  materials --> MGrid["home/MaterialsGrid.tsx"]
  materials --> MHero["materials/MaterialsHero.tsx"]
  materials --> MTable["materials/MaterialsTable.tsx"]

  products --> PGallery["products/ProductsGallery.tsx"]

  about --> AHero["about/AboutHero.tsx"]
  about --> AEssay["about/HeritageEssay.tsx"]
  about --> AValues["about/Values3Up.tsx"]
  about --> ASustain["about/Sustainability.tsx"]

  solutions --> SHero["solutions/SolutionsHero.tsx"]
  solutions --> SMethods["solutions/MethodsPinned.tsx"]
  solutions --> SIllus["solutions/MethodIllustration.tsx"]
  solutions --> SClose["solutions/SolutionsClosingCta.tsx"]

  careers --> CList["careers/CareersListings.tsx"]

  certifications --> CertCards["materials/Certifications.tsx"]
```

### 3. Page-transition state machine

`PageTransition.tsx` wraps `{children}` in a Framer Motion `AnimatePresence mode="wait"` keyed on `usePathname()`. Each route is one `motion.div` that enters from `{opacity:0, y:16}` and exits to `{opacity:0, y:-16}` over 350ms with a cubic ease. `prefers-reduced-motion` short-circuits the whole tree to a plain `<>{children}</>`.

```mermaid
stateDiagram-v2
  [*] --> ReducedCheck
  ReducedCheck --> Static : prefers-reduced-motion
  ReducedCheck --> Idle : motion ok

  Static --> Static : pathname change (no animation)

  Idle --> Entering : mount on first paint
  Entering --> Mounted : 350ms (0.22, 1, 0.36, 1)
  Mounted --> Exiting : pathname change
  Exiting --> Entering : new pathname mounts after old exits ("wait" mode)
  Mounted --> [*] : unmount
```

### 4. STL load + interaction sequence on `/renders/[slug]/`

The viewer is split in two: `StlPreview` (grid tile) gates its `<Canvas>` behind an `IntersectionObserver` with `rootMargin: 200px`, while `StlViewer` (detail page) mounts the canvas immediately but keeps it `pointer-events-none` until the user taps the "Tap to interact" affordance. Both lazy-load the three.js chunk via `dynamic(..., { ssr: false })` in `src/components/three/lazy.tsx`. `STLLoader` returns a `BufferGeometry` that gets centered + scaled into a ~100-unit viewbox, then disposed on unmount to free GPU buffers.

```mermaid
sequenceDiagram
  participant U as User
  participant P as /renders/[slug]/page.tsx
  participant LZ as three/lazy.tsx
  participant SV as StlViewer
  participant TJ as three.js chunk
  participant GL as WebGL ctx
  participant OC as OrbitControls
  participant LN as Lenis (page scroll)

  P->>LZ: render <StlViewer src=.../part-x.stl/>
  LZ->>LZ: render StlViewerSkeleton (no Canvas)
  LZ-->>TJ: dynamic import('./StlViewer')
  TJ-->>LZ: chunk ready
  LZ->>SV: mount real component
  SV->>GL: <Canvas dpr=[1,1.5] camera={pos:[0,0,200],fov:35} shadows/>
  SV->>TJ: useLoader(STLLoader, src)
  TJ-->>SV: BufferGeometry
  SV->>SV: center + scale to viewbox 100, computeVertexNormals
  SV->>GL: mount mesh + Environment(empty_warehouse_01_1k.hdr) + ContactShadows
  GL-->>U: scene visible, autoRotate on (1.2 deg/sec)

  Note over SV,LN: Canvas is pointer-events-none here.<br/>Swipes pass to Lenis -> page scroll.

  U->>SV: tap "Tap to interact"
  SV->>SV: setActive(true) -> canvas takes pointers,<br/>data-lenis-prevent attribute set
  U->>OC: drag / pinch
  OC->>GL: rotate camera, zoom 80..350

  U->>SV: tap "Drag to rotate · tap to scroll"
  SV->>SV: setActive(false) -> swipes return to Lenis
```

### 5. Hammer-strike scene timeline (scroll progress 0 → 1)

`HammerStrikeIntro` pins for ~250vh and drives the section's R3F `<Scene>` via a progress ref. `HammerInner` writes opacity + Y-translate directly to three layered word spans (Heat / Strike / Forge), and at `p > 0.95` restarts a one-shot GSAP background flash. Inside `HammerStrikeHero.tsx`, the hammer Y lerps from 80 → 0, the key light brightens from 1.4 → 2.2 on strike, and a 350ms decay envelope tilts the camera ~1.5° on the rising edge of `struck`.

```mermaid
flowchart TD
  Scroll["ScrollTrigger scrub<br/>progress 0 -> 1"]
  Sub["useScrollSubscribe -> onScroll(p)"]
  Words["3 absolutely-positioned word spans<br/>(direct DOM writes, no React render)"]
  Flash["GSAP timeline:<br/>bg paper -> saffron 200ms -> paper 400ms"]
  Ref["progressRef.current = p"]
  Scene["HammerStrikeHero <Scene>"]

  Scroll --> Sub
  Sub --> Words
  Sub --> Ref
  Sub --> FlashCheck{"p > 0.95 ?"}
  FlashCheck -- "rising edge" --> Flash
  FlashCheck -- "p < 0.5" --> Reset["struckRef = false (re-arm latch)"]

  Words --> Heat["p in 0..0.33 -> Heat fades in/out"]
  Words --> Strike["p in 0.2..0.66 -> Strike fades in/out"]
  Words --> Forge["p in 0.55..1.0 -> Forge fades in"]

  Ref --> Scene
  Scene --> Hammer["hammer.position.y lerps 80 -> 0<br/>(linear in progress)"]
  Scene --> StruckLight{"clamped > 0.95 ?"}
  StruckLight -- "yes" --> KeyHi["keyLight.intensity = 2.2"]
  StruckLight -- "no" --> KeyLo["keyLight.intensity = 1.4"]
  Scene --> Tilt["impactPulse on rising edge<br/>cameraTilt -> 1.5deg over 350ms decay"]
```

### 6. Magnetic cursor state machine

`MagneticCursor.tsx` only mounts visible output when `(hover: hover)` is true AND `prefers-reduced-motion` is false (and `NEXT_PUBLIC_CALM_MODE !== '1'`). On any `[data-magnetic]` hover it sets a hover motion value to 1 (ring fades out, saffron pill fades in with a contextual label resolved from `data-cursor-label` / `<a>` / `<button>`). The 35% blend between pointer position and target center is the "magnetic" pull. Touch / coarse-pointer devices and CALM mode bail before any DOM listeners attach.

```mermaid
stateDiagram-v2
  [*] --> CapabilityCheck

  CapabilityCheck --> Disabled : (hover:none) OR reduce OR CALM_MODE=1
  CapabilityCheck --> Idle : hover ok, motion ok

  Disabled --> [*] : component returns null

  Idle --> Hovering : mouseover [data-magnetic]<br/>hover.set(1), label resolved
  Hovering --> Idle : mouseout (not into descendant)<br/>hover.set(0), label cleared after 200ms
  Hovering --> Hovering : mousemove<br/>position = lerp(pointer, target.center, 0.35)
  Idle --> Idle : mousemove -> spring(pointer)

  state ReducedMotionBranch {
    note right of ReducedMotionBranch
      reduced=true but hover=true:
      ring scales 16 -> 48 only,
      no pill, no color tween
    end note
  }

  Hovering --> ReducedMotionBranch : if reduced
```

### 7. Lenis ↔ GSAP ticker bridge

`LenisProvider` is the single place a `Lenis` instance is created. Rather than letting Lenis run its own RAF, it hands every frame to GSAP's ticker — so smooth scroll, ScrollTrigger updates, and any GSAP timelines share one frame budget. `prefers-reduced-motion` and `NEXT_PUBLIC_CALM_MODE=1` both short-circuit the entire setup so native scroll takes over. Two `CustomEvent` channels (`lenis:setpaused`, `lenis:scrollto`) let unrelated components (Header mobile sheet, `RouteResetEffects`) talk to Lenis without holding a reference to the singleton.

```mermaid
sequenceDiagram
  participant ENV as Capability check
  participant LP as LenisProvider
  participant L as Lenis instance
  participant G as gsap.ticker
  participant ST as ScrollTrigger
  participant W as <html> classList
  participant EV as CustomEvent bus

  ENV->>LP: matchMedia(reduce) OR CALM_MODE -> bail
  Note over LP: returns <>{children}</>, no Lenis at all

  ENV->>LP: motion ok
  LP->>L: new Lenis({lerp:0.08, smoothWheel:true, ...})
  LP->>W: add classes "lenis", "lenis-smooth"
  LP->>L: lenis.on('scroll', ScrollTrigger.update)
  LP->>G: gsap.ticker.add((time) => lenis.raf(time*1000))
  LP->>G: gsap.ticker.lagSmoothing(0)
  LP->>ST: ScrollTrigger.refresh()

  loop every animation frame
    G->>L: tick(time) -> lenis.raf
    L->>L: lerp scroll position
    L-->>ST: 'scroll' event -> ScrollTrigger.update()
  end

  EV-->>LP: lenis:setpaused {paused:true}
  LP->>L: lenis.stop()
  EV-->>LP: lenis:scrollto {target:0, immediate:true}
  LP->>L: lenis.scrollTo(0, {immediate:true})

  Note over LP,G: cleanup: ticker.remove(tick), lenis.destroy(),<br/>remove lenis-* classes from <html>
```

### 8. Brand-token relationships

`src/lib/brand.ts` mirrors the `@theme` tokens declared in `src/app/globals.css`. Tailwind utilities (`bg-mesh`, `text-graphite`, `bg-saffron`) read the CSS variables; R3F materials, `<color attach="background">`, and any Framer Motion interpolation between colors all read the hex literals from `BRAND_HEX` because they can't consume `var(--color-...)`. The tokens cluster by role rather than by hue.

```mermaid
graph TD
  ROOT["Ommi Forge brand tokens"]

  ROOT --> Primary["Primary / interaction"]
  ROOT --> Surface["Surfaces"]
  ROOT --> Text["Text + neutrals"]
  ROOT --> Accent["Accent / lighting"]

  Primary --> Saffron["saffron #FF9933<br/>(CTAs, page-flash, magnetic pill)"]
  Primary --> Mesh["mesh #FF5533<br/>(idle cursor ring, STL material, links)"]
  Primary --> Ember["ember #C2381C<br/>(AA-safe body text on light bg)"]

  Surface --> Paper["paper #FAFAFA<br/>(default body bg)"]
  Surface --> Snow["snow #FFFFFF<br/>(card / overlay bg)"]
  Surface --> RenderBg["renderBg / render-bg #D9D9D9<br/>(STL stage radial gradient outer)"]

  Text --> Graphite["graphite #1F2124<br/>(default text, dark surfaces)"]
  Text --> Steel["steel #54595F<br/>(secondary body copy)"]
  Text --> Ash["ash #7A7A7A<br/>(captions, muted)"]

  Accent --> Peach["peach #FFBC7D<br/>(warm rim light in R3F scenes)"]

  Saffron -.consumed by.-> CSS["globals.css @theme<br/>--color-saffron"]
  Mesh -.consumed by.-> CSS
  Graphite -.consumed by.-> CSS

  Saffron -.consumed by.-> TS["lib/brand.ts BRAND_HEX<br/>(R3F + Framer interpolation)"]
  Mesh -.consumed by.-> TS
  Peach -.consumed by.-> TS
  RenderBg -.consumed by.-> TS
  Snow -.consumed by.-> TS
```

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
| **Hero** (`HERO_FRAME_COUNT = 46`) | 46 (`f-001..046.jpg`) | ~18 MB | **1920×1080** | `hero-firstshot.mp4` (1080p YouTube source) | 12 fps, JPG `-q:v 2` |
| **Plant** (`PLANT_FRAME_COUNT = 90`) | 90 (`f-001..090.jpg`) | ~16 MB | 1280×720 (native) | `walkthrough-scrub.mp4`, first ~9 s @ 10 fps | JPG `-q:v 2` + luma `unsharp` |

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
| Hero frame sequence | `public/assets/frames/hero/` | 46 JPGs (`f-001`…`f-046`) | 18 MB | **1920×1080** JPG (`-q:v 2`); driven by `HERO_FRAME_COUNT = 46` |
| Plant frame sequence | `public/assets/frames/plant/` | 90 JPGs (`f-001`…`f-090`) | 16 MB | 1280×720 JPG (`-q:v 2`) + luma `unsharp`; `PLANT_FRAME_COUNT = 90`, ~9s @ 10fps |
| Numbered render STLs | `public/assets/stl/` | 9 (`part-a`…`part-i`) | 59 MB | binary STL; largest `part-b.stl` 5.1 MB, smallest `part-g.stl` 1.2 MB |
| Named-product STLs | `public/assets/stl/named/` | 11 | 64 MB | mirrors of the numbered meshes under product filenames (9 byte-identical to a `part-*`) for `/forged-products` |
| HDRI | `public/assets/hdr/` | 1 | 1.6 MB | `empty_warehouse_01_1k.hdr` (CC0, Poly Haven) — env map for StlViewer |
| Video | `public/assets/video/` | 5 files | ~12.8 MB | see below |

**`public/assets/video/` contents (measured):**

| File | Size | Status |
| --- | --- | --- |
| `hero-firstshot.mp4` | 27 MB | hero footage **at 1920×1080** (YouTube `NBCDb4opv-M`, fetched via `yt-dlp -f 'bestvideo[height<=1080]'`) |
| `hero-poster.jpg` | 320 KB | hero poster frame |
| `plant-pan-1080.mp4` | 1.0 MB | plant panning shot |
| `plant-walkthrough.mp4` | 192 KB | short plant loop |
| `walkthrough-scrub.mp4` | 8.1 MB | source for the plant frame sequence (~49 s @ 720p) |

> `public/assets/MEDIA_MANIFEST.md` documents the original source URLs and the
> STL deduplication (the 9 `part-{a..i}.stl` files and 9 of the 11 named-product
> STLs share identical mesh data — WordPress re-uploaded the same source mesh
> under multiple filenames).

### ffmpeg frame-extraction recipe

The image sequences were extracted from the source clips with ffmpeg. The plant
sequence is decoded at ~10 fps from the first ~9 s of the walkthrough clip:

```sh
# Hero source comes from YouTube at 1080p — `hero-firstshot.mp4` is the
# yt-dlp output. Extract 46 frames at native 1920x1080, 12fps, JPG q:v 2:
ffmpeg -y -i public/assets/video/hero-firstshot.mp4 -t 3.83 -vf "fps=12" -q:v 2 \
  public/assets/frames/hero/f-%03d.jpg

# Plant source is 720p only (the high-res original is gone from Hostinger).
# Extract at native 1280x720 with a subtle luma `unsharp` to recover the
# perceived sharpness lost to the source's low (1.4 Mbps) bitrate. JPG q:v 2.
ffmpeg -y -i public/assets/video/walkthrough-scrub.mp4 -t 9 \
  -vf "fps=10,unsharp=lx=5:ly=5:la=0.7:cx=5:cy=5:ca=0.0" -q:v 2 \
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

## Component reference

> A field guide to every component in `src/components/`. Each card lists what
> it does, its public API, and the key file paths so you can jump straight in.

### UI primitives

#### `Header`
**File:** `src/components/ui/Header.tsx` · **Imports:** `next/link`, `next/image`, `framer-motion`, `@/data/nav`

Fixed top bar — desktop horizontal nav + saffron Quote CTA; tablet/mobile collapses into a graphite right-side sheet (88vw, max 420px) with focus trap.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Reads nav from `@/data/nav` |

**Behaviour:**
- Flips transparent → graphite once `scrollY > 100`; flips graphite-immediately on routes other than `/` (white logo needs a dark backing).
- Closes mobile sheet on route change via React 19 derived-state-from-prop pattern.
- While sheet is open: pauses Lenis (`lenis:setpaused` CustomEvent), locks body scroll, traps focus on Tab/Shift+Tab, restores focus to trigger on close.
- Renders a 2 px mesh-orange scroll-progress hairline at the bottom of the bar via `scaleX(progress)`.

---

#### `Footer`
**File:** `src/components/ui/Footer.tsx` · **Imports:** `next/link`, `next/image`, `@/data/nav`

Graphite slab with three columns (brand+tagline / quick links / contact). Bottom strip carries the mesh-orange hairline + colophon.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Nav links derived from `NAV` minus `/` |

**Behaviour:**
- Pure server component (no `'use client'`); no effects.
- Phone/email/maps links carry tap-to-call / mailto / hover-to-saffron transitions.

---

#### `Eyebrow`
**File:** `src/components/ui/Eyebrow.tsx` · **Imports:** `@/lib/cn`

Small uppercase Work Sans 600 label with a leading mesh-orange dash — used above every section headline.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Label text |
| `className` | `string` | — | Forwarded to root |
| `as` | `'p' \| 'span' \| 'div'` | `'p'` | Semantic tag |

**Behaviour:** Pure presentational, no effects. The leading dash is an `aria-hidden` 8 px mesh-orange span.

---

#### `NumberCounter`
**File:** `src/components/ui/NumberCounter.tsx` · **Imports:** `framer-motion` (`useInView`, `useMotionValue`, `useTransform`, `animate`)

Counts 0 → `to` once the element enters the viewport. Pipes the motion value through `useTransform` so updates bypass React reconciliation.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `to` | `number` | — | Final value |
| `suffix` | `string` | `''` | e.g. `'+'`, `'MT'` |
| `prefix` | `string` | `''` | e.g. `'₹'` |
| `duration` | `number` | `1.6` | Tween seconds |
| `decimals` | `number` | `0` | Fixed-precision digits |
| `className` | `string` | — | Forwarded to root span |
| `ariaLabel` | `string` | derived | Accessible label override |

**Behaviour:**
- `useInView({ once: true, margin: '0px 0px -10% 0px' })` gates the tween.
- `Intl.NumberFormat('en-IN')` for thousands grouping.
- Honours `prefers-reduced-motion` — jumps straight to `to`.

### Motion / interaction

#### `PinnedSection`
**File:** `src/components/motion/PinnedSection.tsx` · **Imports:** `@/lib/gsap` (gsap + ScrollTrigger)

A ScrollTrigger-pinned wrapper that exposes scroll progress (0..1) to descendants via context. Progress lives in a ref-backed store with a manual listener Set — zero React renders on the per-frame scroll path.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | |
| `length` | `number` | `1` | Pin distance in viewport heights |
| `className` | `string` | — | Outer wrapper class |
| `id` | `string` | — | Anchor id for deep-links |

**Exports (hooks):** `useScrollSubscribe(cb)` — side-effect, no re-render. `useScrollProgressRef()` — readonly ref. `useScroll()` — legacy, re-renders via `useSyncExternalStore`.

**Behaviour:**
- Pins the INNER child for `length * 100vh` of scroll; outer wrapper holds the layout space.
- `gsap.context` scope + `ctx.revert()` cleanup so HMR/route changes don't leak triggers.
- Reduced-motion: bails entirely — section renders as a normal stacked block.

```mermaid
stateDiagram-v2
    [*] --> Mounted
    Mounted --> Pinned: ScrollTrigger.create()
    Pinned --> Pinned: onUpdate → store.progress + listeners
    Pinned --> [*]: ctx.revert()
```

---

#### `SplitText`
**File:** `src/components/motion/SplitText.tsx` · **Imports:** `@/lib/cn`

Splits text into `[data-char]` (or `[data-word]` when `byWord`) spans so GSAP timelines can stagger over them. Whitespace is preserved as spaced spans so `Let'sforge` doesn't happen at huge sizes.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `string` | — | Source string (also surfaced as `aria-label`) |
| `as` | `'h1'…'h6' \| 'p' \| 'span' \| 'div'` | `'span'` | Root tag |
| `className` | `string` | — | Root class |
| `charClassName` | `string` | — | Per-char/word class (e.g. font-size for whitespace too) |
| `byWord` | `boolean` | `false` | Split per-word instead of per-char |

**Behaviour:** Callback-ref forces a reflow post-split so any consumer ScrollTrigger sees the final dimensions. Each char/word span is `inline-block` so transforms compose.

---

#### `MagneticCursor`
**File:** `src/components/motion/MagneticCursor.tsx` · **Imports:** `framer-motion`, `@/lib/brand`

16 px mesh-orange ring tracking the pointer with spring easing. Morphs into a saffron labelled pill over any `[data-magnetic]` target (label resolved from `data-cursor-label` / `<a>` / `<button>`).

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Singleton, mounted in root layout |

**Behaviour:**
- Enablement via `useSyncExternalStore` over `(hover: hover)` + `(prefers-reduced-motion)` media queries — no `setState`-in-effect.
- Disabled on touch / coarse-pointer and when `NEXT_PUBLIC_CALM_MODE=1`.
- Reduced-motion: ring scales only, no pill morph, no label.
- Toggles `html[data-magnetic-cursor="on"]` so `globals.css` hides the native cursor.
- 35% magnetic pull blend between pointer and target centre on hover.

---

#### `PageTransition`
**File:** `src/components/motion/PageTransition.tsx` · **Imports:** `framer-motion`, `next/navigation`

Wraps children in `AnimatePresence mode="wait"` keyed on `pathname` for a 350 ms y+opacity crossfade between routes.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Route content |

**Behaviour:**
- `useReducedMotion()` → renders children directly, no animation.
- Replaces an earlier `<PageWipe />` saffron slab that got stuck at full opacity (single-key `AnimatePresence` couldn't run enter→hold→exit on one path change).

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Exiting: pathname change
    Exiting --> Entering: old child unmounted
    Entering --> Idle: new child mounted
    Idle --> Idle: reduced motion (skip)
```

---

#### `useScrollImageSequence` (hook)
**File:** `src/components/motion/useScrollImageSequence.ts` · **Imports:** `@/lib/gsap` (ScrollTrigger)

Apple-style scroll-scrub: preload an image sequence and draw the correct frame onto a canvas for the current ScrollTrigger progress. See [The scroll-scrub engine](#the-scroll-scrub-engine) for the deep dive.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `canvasRef` | `RefObject<HTMLCanvasElement \| null>` | — | Target canvas (CSS-sized) |
| `sectionRef` | `RefObject<HTMLElement \| null>` | — | Pinned section |
| `count` | `number` | — | Number of frames |
| `src` | `(i: number) => string` | — | Frame URL builder (0-based) |
| `end` | `string` | `'+=220%'` | ScrollTrigger pin length |
| `scrub` | `number` | `0.5` | Scrub smoothing (s) |

**Behaviour:** Preloads all frames up front · sizes backing buffer (DPR ≤ 2) from the canvas client box only — never inline style.width/height · object-cover draw with last-frame fallback · ResizeObserver + window resize handlers · reduced-motion → single frame, no pin.

---

#### `useStaticPins` (hook)
**File:** `src/components/motion/useStaticPins.ts` · **Imports:** `framer-motion`

Returns `true` when the section should render its static fallback instead of a GSAP-pinned scroll: either OS reduced-motion OR viewport ≤ 767 px.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Reads `useReducedMotion()` + a `matchMedia` subscription |

**Behaviour:** SSR-safe — returns `false` on server and first client render to match SSR markup, then flips after mount on mobile. Used by `HammerStrikeIntro` and `HeritageTimeline` to skip stacked-pin jank on phones.

### Three / R3F

#### `StlViewer`
**File:** `src/components/three/StlViewer.tsx` · **Imports:** `@react-three/fiber`, `@react-three/drei`, `three`, `STLLoader`, `framer-motion`, `@/lib/brand`

Full-bleed 3D inspector for an STL part. Auto-frames the geometry into a ~100-unit viewbox, lights it with a key + warm peach rim, renders a brand-radial-gradient stage, and exposes Rotate / Reset / Fullscreen / Download toolbar buttons.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string` | — | STL URL |
| `title` | `string` | — | Bottom-left text overlay heading |
| `productName` | `string` | — | Subtitle in the overlay |
| `autoRotate` | `boolean` | `true` | Initial rotation state |
| `className` | `string` | — | Forwarded to wrapper |

**Behaviour:**
- Tap-to-activate gate: while inactive the canvas is `pointer-events-none` so vertical swipes scroll the page (Lenis owns the gesture); on tap, canvas takes over and `data-lenis-prevent` is applied.
- Self-hosted HDRI from `/assets/hdr/empty_warehouse_01_1k.hdr` — avoids the drei default raw.githack.com fetch.
- Reduced-motion auto-rotate falls back to off (overridable manually).
- Geometry cloned + disposed on src change to prevent GPU buffer leaks.

```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active: tap
    Active --> Inactive: tap "Drag · tap to scroll"
    Active --> Active: OrbitControls drag/zoom
    Inactive --> Inactive: auto-rotate (if !reduced)
```

---

#### `StlPreview`
**File:** `src/components/three/StlPreview.tsx` · **Imports:** `@react-three/fiber`, `three`, `STLLoader`, `framer-motion`, `@/lib/brand`

Square gently-spinning STL tile for grid/marquee use. Slow rotation idle, ~3× speed on hover.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string` | — | STL URL |
| `className` | `string` | — | Forwarded to wrapper |
| `ariaLabel` | `string` | — | Sets `role="img"` + label |

**Behaviour:**
- IntersectionObserver-gated mount (200 px rootMargin) — Canvas only mounts when tile nears the viewport, then observer self-disconnects.
- DPR clamped to `[1, 1]` — marquee tiles don't justify super-sampling.
- Geometry cloned + disposed on src change.
- Reduced-motion: stops spinning (geometry still rendered).

---

#### `HammerStrikeHero`
**File:** `src/components/three/HammerStrikeHero.tsx` · **Imports:** `@react-three/fiber`, `@react-three/drei`, `three`

R3F scene used inside `HammerStrikeIntro` — box anvil + box-head/cylinder-handle hammer that descends as scroll progress rises. On strike (`progress > 0.95`) the key light brightens 1.4 → 2.2 and the camera tilts ~1.5° on a 350 ms decay envelope.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `progress` | `number \| { readonly current: number }` | — | 0..1; the ref form lets the parent mutate per frame without re-rendering |
| `className` | `string` | — | Wrapper class |

**Behaviour:**
- Reads `progress.current` inside `useFrame` so scroll updates skip React entirely.
- Rising-edge latch (`wasStruck`) prevents the impact pulse from re-firing once scroll bottoms out.
- Delta capped at `1/30 s` so background-tab unfreezes don't snap the scene.

---

#### `lazy.tsx` (lazy wrappers)
**File:** `src/components/three/lazy.tsx` · **Imports:** `next/dynamic`

Re-exports `StlViewer`, `StlPreview`, `HammerStrikeHero` wrapped in `next/dynamic({ ssr: false })` with on-brand skeletons. Without this, Turbopack ships three.js (~876 KB) once per route that statically imports a 3D component.

| Export | Skeleton | Notes |
| --- | --- | --- |
| `StlViewer` | `StlViewerSkeleton` (radial gradient + animated anvil SVG) | |
| `StlPreview` | `StlPreviewSkeleton` (square radial gradient) | |
| `HammerStrikeHero` | `HammerStrikeHeroSkeleton` (paper block) | |

**Behaviour:** All importers should use this file — single source of truth for on-demand three.js loading.

### Providers

#### `LenisProvider`
**File:** `src/components/providers/LenisProvider.tsx` · **Imports:** `lenis`, `@/lib/gsap`

Mounts a single Lenis instance, drives its RAF through `gsap.ticker` (one frame budget), and pipes scroll events into `ScrollTrigger.update` so scrubbed animations track smoothed scroll position.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | |

**Behaviour:**
- Skips entirely under `NEXT_PUBLIC_CALM_MODE=1` or `prefers-reduced-motion`.
- Adds/removes `lenis lenis-smooth` classes on `<html>` (Lenis 1.3+ no longer does this).
- Listens for two CustomEvents on `document`:
  - `lenis:setpaused` — toggles `lenis.stop/start` (used by mobile menu).
  - `lenis:scrollto` — drives `lenis.scrollTo(target, { immediate })` (used by `RouteResetEffects`).
- `gsap.ticker.lagSmoothing(0)` so heavy frames don't deform the scroll mapping.

---

#### `RouteResetEffects`
**File:** `src/components/providers/RouteResetEffects.tsx` · **Imports:** `next/navigation`, `@/lib/gsap`

Mounts inside the Lenis tree. On every pathname change: snaps scroll to top via `lenis:scrollto` (Lenis owns scroll position so `window.scrollTo` no-ops), kills any orphaned ScrollTriggers whose trigger DOM node is detached, then `ScrollTrigger.refresh()` on the next RAF.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Renders `null` |

**Behaviour:** Belt-and-braces for `AnimatePresence mode="wait"` — exiting route's triggers can outlive their DOM while new route's triggers come online. Reduced-motion users still get a `window.scrollTo({ top: 0 })` fallback.

---

#### `LegacyRedirects`
**File:** `src/components/providers/LegacyRedirects.tsx` · **Imports:** `next/script`

Inline pre-hydration script (Script `strategy="beforeInteractive"`) that maps legacy WordPress slugs (`/home/about-ommi-forge/`, `/render-h-2/`, etc.) to their App Router successors before React mounts — no flash of wrong page.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| _(none)_ | — | — | Map is inline in the script |

**Behaviour:** Needed because `next.config.ts redirects()` is a no-op under `output: 'export'`. Map kept in sync with `public/_redirects` (Netlify-style). All URLs canonicalised to trailing-slash.

### Home page sections

#### `Hero`
**File:** `src/components/sections/home/Hero.tsx` · **Imports:** `framer-motion`, `@/lib/gsap`, `SplitText`, `Eyebrow`, `useScrollImageSequence`, `HERO_COPY`

100dvh opener. Background is the hero footage played as a scroll-scrubbed 46-frame JPG image sequence drawn onto a canvas (`useScrollImageSequence`, `end: '+=220%'`). Foreground: eyebrow → split-char/word headline → subhead → CTA row, with an `AudioPulseBars` SVG visualiser in the scroll cue.

| Data dep | Source | Notes |
| --- | --- | --- |
| `HERO_COPY` | `@/data/home` | Eyebrow, two headline lines, subhead, two CTAs |
| Frames | `/public/assets/frames/hero/f-001…f-046.jpg` | Poster fallback at `/assets/video/hero-poster.jpg` |

**Behaviour:** GSAP timeline staggers chars + words on mount (`power3.out`, 15 ms stagger), then subhead → CTAs → scroll cue. Negative `marginTop: calc(-1 * var(--header-h))` so the fixed header overlays. Reduced-motion: timeline skipped; pulse bars rest at 50%.

---

#### `HammerStrikeIntro`
**File:** `src/components/sections/home/HammerStrikeIntro.tsx` · **Imports:** `@/lib/gsap`, `PinnedSection`, `useStaticPins`, `HammerStrikeHero` (lazy), `HAMMER_INTRO_WORDS`

Act 01. `<PinnedSection length={2.5}>` holds 250vh. Left column cross-fades three layered huge words (Heat → Strike → Forge) by mutating DOM opacity from `useScrollSubscribe`; right column renders the R3F `HammerStrikeHero` gated by an IntersectionObserver (600 px rootMargin) so three.js boots only when nearby. At `progress > 0.95` a saffron flash timeline fires once (rising-edge latch).

| Data dep | Source | Notes |
| --- | --- | --- |
| `HAMMER_INTRO_WORDS` | `@/data/home` | `['Heat', 'Strike', 'Forge']` |

**Behaviour:** Per-frame path writes opacity/transform directly to refs — no React renders. `useStaticPins` swaps in a stacked `HammerStatic` fallback (single "Forge." + a `progress={1}` scene) on mobile + reduced-motion.

---

#### `MaterialsGrid`
**File:** `src/components/sections/home/MaterialsGrid.tsx` · **Imports:** `framer-motion`, `Eyebrow`, `@/data/materials`

Act 02. Four flip cards (Carbon / Alloy / Stainless / Custom) — desktop ≥ lg is a horizontal scroll-snap row, mobile a vertical stack. Front face shows the number + name + blurb; back face lists the de-duped grade families.

| Data dep | Source | Notes |
| --- | --- | --- |
| `MATERIALS`, `MATERIALS_INTRO` | `@/data/materials` | |

**Behaviour:** Flip is CSS 3D (`transformStyle: preserve-3d`, `backfaceVisibility: hidden`) driven by `rotateY: flipped ? 180 : 0`. Reduced-motion: crossfade with AnimatePresence instead of rotateY. Hover, focus, AND click all toggle flip for pointer-type parity.

---

#### `PlantWalkthrough`
**File:** `src/components/sections/home/PlantWalkthrough.tsx` · **Imports:** `Eyebrow`, `useScrollImageSequence`

Act 03. Full-bleed 100dvh scroll-scrubbed walkthrough of the Malur floor — same image-sequence engine as Hero, 90 JPG frames at 10 fps from `/public/assets/frames/plant/`. A graphite/55 caption card sits top-right.

| Data dep | Source | Notes |
| --- | --- | --- |
| Frames | `/public/assets/frames/plant/f-001…f-090.jpg` | First frame doubles as cover-fit poster |

**Behaviour:** Reduced-motion → single static frame (the hook handles it). Background `bg-graphite` so the canvas fade-in stays quiet.

---

#### `ProductsMarquee`
**File:** `src/components/sections/home/ProductsMarquee.tsx` · **Imports:** `framer-motion`, `@/lib/gsap`, `@/lib/image-formats`, `PRODUCT_IMAGES`

Act 04. Two infinite horizontal marquees of forged-product photos (top row left, bottom row right, asymmetric splits so they don't mirror). Each tile is a native `<picture>` with AVIF/WebP/JPG fallbacks (cheaper than `next/image` under `output: 'export'`).

| Data dep | Source | Notes |
| --- | --- | --- |
| `PRODUCT_IMAGES` | `@/data/home` | First 14 images split 7/7 |

**Behaviour:** GSAP linear `xPercent` tween (`repeat: -1`, durations 40 s / 55 s). Pauses on `mouseenter` + `touchstart`, resumes on leave/end. Image errors swap to an on-brand gradient tile so a missing photo never shows a broken-image icon. No live STLs in the marquee — that bottleneck moved to `/renders/`.

---

#### `StatsCounter`
**File:** `src/components/sections/home/StatsCounter.tsx` · **Imports:** `Eyebrow`, `NumberCounter`, `STATS`

Graphite slab with four `<NumberCounter>` tiles in mesh-orange Manrope bold. Font size tuned via `clamp(52px, 5.5vw, 72px)` so the widest stat (`1,000+`) fits a 4-up xl cell at gap-12 without spilling.

| Data dep | Source | Notes |
| --- | --- | --- |
| `STATS` | `@/data/home` | Each: `{ value, suffix, label }` |

**Behaviour:** Each counter is independently in-view-gated by `NumberCounter`. Reduced-motion handled inside the counter.

---

#### `HeritageTimeline`
**File:** `src/components/sections/home/HeritageTimeline.tsx` · **Imports:** `@/lib/gsap`, `PinnedSection`, `useScrollSubscribe`, `useStaticPins`, `Eyebrow`, `MILESTONES`

Act 05. `<PinnedSection length={4}>` (400vh hold). The horizontal track translates leftward by a measured `scrollWidth - innerWidth` distance proportional to progress — so milestone #6 always lands flush at `progress=1` regardless of card width breakpoint.

| Data dep | Source | Notes |
| --- | --- | --- |
| `MILESTONES` | `@/data/home` | `[{ year, title, body, inProgress? }, …]` |

**Behaviour:** Per-frame path uses `gsap.quickSetter(track, 'x', 'px')` — memoised setter, no inline-style React diffing. `useStaticPins` swaps in a stacked `StaticList` on mobile + reduced-motion.

---

#### `ClosingCta`
**File:** `src/components/sections/home/ClosingCta.tsx` · **Imports:** `@/lib/gsap`, `SplitText`, `CLOSING_CTA`

Full-viewport saffron slab. `SplitText` headline; on viewport entry GSAP sweeps chars in from `y: 80, opacity: 0` with 50 ms stagger. Two CTAs underneath.

| Data dep | Source | Notes |
| --- | --- | --- |
| `CLOSING_CTA` | `@/data/home` | Headline, subhead, primary + secondary CTA |

**Behaviour:** `scrollTrigger: { start: 'top 70%', once: true }` — fires once, no re-trigger on scroll back. Top/bottom graphite vignette gradients soften the saffron wall into a band. Reduced-motion skips the timeline.

---

#### `Location`
**File:** `src/components/sections/home/Location.tsx` · **Imports:** `Eyebrow`, `LOCATION`

Two-column section: address / phone / email / hours / GPS on the left, embedded Google Maps iframe on the right with an "Open in Maps" deep link beneath.

| Data dep | Source | Notes |
| --- | --- | --- |
| `LOCATION` | `@/data/home` | `street`, `area`, `region`, `phone(Href)`, `email(Href)`, `hours`, `lat/lng`, `embed`, `openInMaps` |

**Behaviour:** Pure server component (no `'use client'`). Iframe is `loading="lazy"` with `referrerPolicy="no-referrer-when-downgrade"`.

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
