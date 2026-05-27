# Ommi Forge — cinematic rebuild

A scroll-driven Next.js 16 rebuild of [ommiforge.com](https://www.ommiforge.com) — an Indian steel-forging company founded in Bangalore in 1975, plant in Malur, Karnataka.

Replaces a stock WordPress + Elementor build with an editorial, animation-led static site that puts the actual brand asset — interactive 3D STL renders of forged parts — at the centre of the experience.

## Stack

- **Next.js 16** App Router with `output: 'export'` (deploys anywhere as static HTML)
- **TypeScript** strict
- **Tailwind CSS v4** (CSS-first `@theme` tokens — single source of truth in `src/app/globals.css`)
- **React Three Fiber** + `@react-three/drei` — interactive STL viewer + the home-page drop-hammer scene
- **GSAP** + ScrollTrigger + Observer — pinned-scrub sections, marquee, heritage timeline
- **Framer Motion** — page transitions, page-wipe slab, magnetic cursor, layout animations
- **Lenis** — smooth scroll, wired into ScrollTrigger so pinned sections track the smoothed position
- Self-hosted Manrope + Work Sans + Roboto via `next/font/google`

## Routes

| Route | What it is |
| --- | --- |
| `/` | 9-section cinematic home (hero · hammer-strike pin · materials · products marquee · stats · drone walkthrough · heritage timeline · location · CTA) |
| `/about/` | Heritage essay, values, sustainability |
| `/solutions/` | Closed die / open die / ring rolling / upset forging — pinned scroll with morphing illustration |
| `/products/` | Masonry gallery with shared-element modal (mixes STL previews + photos) |
| `/materials/` | Carbon · alloy · stainless · custom families + certifications (request-on-email) |
| `/careers/` | Single-CTA "send us your CV" panel |
| `/contact/` | Quote form + address + map |
| `/renders/` | Hub: 3×3 grid of interactive 3D parts |
| `/renders/{a..i}/` | Full-screen STL viewer per part (auto-rotate, drag, fullscreen, download) |

Legacy WordPress URLs (`/home/about-ommi-forge`, `/render-a`, `/3d-renders`, etc.) are mapped to the new routes via both a pre-hydration `beforeInteractive` script and a `public/_redirects` file for Netlify/Hostinger.

## Local development

```bash
pnpm install
pnpm dev               # dev server on :3000 (or pass --port)
pnpm build             # static export to ./out/
pnpm lint              # ESLint (Next.js + React-hooks rules)
pnpm exec tsc --noEmit # typecheck
```

## Design tokens

Defined inside `@theme` in `src/app/globals.css` — Tailwind v4 auto-promotes each variable to a utility class:

| Token | Hex | Role |
| --- | --- | --- |
| `--color-saffron` | `#FF9933` | India-heritage accent, primary CTAs |
| `--color-mesh` | `#FF5533` | 3D render mesh color, eyebrows |
| `--color-graphite` | `#1F2124` | Primary text + dark surfaces |
| `--color-steel` | `#54595F` | Secondary text |
| `--color-ash` | `#7A7A7A` | Body gray |
| `--color-peach` | `#FFBC7D` | Transitions, rim lighting |
| `--color-paper` | `#FAFAFA` | Page background |
| `--color-render-bg` | `#D9D9D9` | STL viewer floor |
| `--font-display` | Manrope | Headlines |
| `--font-eyebrow` | Work Sans | Uppercase eyebrows |
| `--font-body` | Roboto | Body copy |
| `--header-h` | `60px` mobile / `76px` desktop (+ iOS safe-area) | Shared by header, `<main>`, Hero offset |

For R3F materials that can't consume Tailwind classes, the same palette is exported from `src/lib/brand.ts` as `BRAND_HEX`.

## Project layout

```
src/
├── app/                     App Router routes + layout
├── components/
│   ├── motion/              MagneticCursor, PageTransition + PageWipe, SplitText, PinnedSection
│   ├── providers/           LenisProvider, LegacyRedirects, RouteResetEffects
│   ├── three/               StlViewer, StlPreview, HammerStrikeHero, lazy.tsx (dynamic-imports for code-split)
│   ├── ui/                  Header, Footer, Eyebrow, NumberCounter
│   └── sections/            Per-page section blocks
├── data/                    Locked content (nav, home, materials, renders, certifications, …)
├── lib/                     brand.ts, cn.ts, gsap.ts (registers ScrollTrigger + Observer)
└── styles/                  globals.css (Tailwind v4 + @theme tokens)
public/
└── assets/                  hero/plant videos · 9 numbered + 11 named STLs · images · MEDIA_MANIFEST.md
```

## Notable behaviour

- **Smooth scroll ↔ ScrollTrigger**: `LenisProvider` drives `lenis.raf` from `gsap.ticker` and pipes `lenis.on('scroll', ScrollTrigger.update)` so pinned-scrub sections track the smoothed position. External code can pause smooth scroll (e.g. mobile menu open) by dispatching `lenis:setpaused` / `lenis:scrollto` CustomEvents — no Lenis ref needed.
- **Route reset**: `RouteResetEffects` runs on every pathname change, scrolls to top via the Lenis bridge, sweeps detached ScrollTriggers, and calls `ScrollTrigger.refresh()` on the next rAF so the new route's pin positions are measured correctly.
- **Reduced-motion**: every animated component reads `prefers-reduced-motion: reduce` and short-circuits (no smooth scroll, no magnetic cursor, no auto-rotate, no sparks, no scroll-scrubbed video).
- **Bundle**: three.js is shared across `/`, `/renders/*`, and `/products/` via `src/components/three/lazy.tsx` (`dynamic({ ssr: false })` from a single module) — one shared async chunk instead of one per route.

## Brand authorisation

Built as authorized client work for Ommi Forge Pvt. Ltd. via [SMARK8ING](https://smark8ing.com). The hero video, plant footage, and all 3D STL part files are the client's own assets, downloaded from their existing site and the YouTube channel that hosts their plant tour.

## Privacy + headers

This build has no analytics, no third-party trackers, no cookies, and
no outbound `fetch`/`XHR` at runtime. The Google Maps embeds use the
unauthenticated `output=embed` URL (no API key). Drei's HDRI is
self-hosted (see `public/assets/hdr/`).

Security headers are supplied by the host. `public/_headers`
(Netlify-style) and `public/.htaccess` (Apache/Hostinger) ship a
baseline policy: `X-Frame-Options DENY`, `Referrer-Policy`,
`Permissions-Policy`, HSTS, and a Content-Security-Policy that only
allows `self` for everything except the Google Maps iframe and Google
Fonts. Update the policy if you add analytics or third-party widgets.

## License

MIT — see [LICENSE](./LICENSE).
