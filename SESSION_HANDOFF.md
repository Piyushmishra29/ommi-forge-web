# Session handoff — Ommi Forge rebuild

_Last updated: 2026-05-28 · Repo: <https://github.com/Piyushmishra29/ommi-forge-web> · HEAD: `2aeee5e`_

A cinematic Next.js 16 static-export rebuild of ommiforge.com (Indian steel-forging
company, est. 1975, plant in Malur). This file is the pick-up point for the next session.

---

## How to run

```bash
cd ~/Desktop/ommi-forge-rebuild
pnpm install
pnpm dev --port 4000        # dev server (we've been on :4000)
pnpm build                  # static export → ./out/
pnpm exec tsc --noEmit      # typecheck
pnpm lint                   # eslint
pnpm build:meta             # regenerate favicons + OG + sitemap
pnpm optimize-images        # regen AVIF/WebP siblings from public/assets/images
```

Everything currently: **typecheck clean · lint clean · build green (22 routes)**.

---

## Current state — DONE

### Structure
- 17 routes: `/`, `/about`, `/solutions`, `/products`, `/materials`, `/careers`,
  `/contact`, `/renders` + 9 `/renders/[a–i]` STL detail pages.
- Stack: Next 16 App Router (`output: 'export'`), Tailwind v4 (`@theme` tokens),
  R3F + drei, GSAP + ScrollTrigger, Framer Motion, Lenis. Fonts: Manrope / Work
  Sans / Roboto via `next/font`.

### Home page (Act order — note Act 03 ↔ 04 were swapped)
1. Hero — **scroll-locked pinned video scrub** of the 3.8s first-shot clip
   (`hero-firstshot.mp4`, 720p, 2.6MB). Pins for 300% viewport, `scrub: true`,
   throttled seeks. No autoplay.
2. HammerStrikeIntro — **V1 R3F hammer** (basic box anvil + boxy hammer). User
   explicitly chose V1 over the belt-drop-hammer and SVG versions. Rising-edge
   strike pulse (no post-animation glitch).
3. PlantWalkthrough (Act 03) — scroll-scrubs `walkthrough-scrub.mp4` (720p, 16MB,
   keyframe every 0.5s — purpose-built for seeking).
4. ProductsMarquee (Act 04) — **image-only** now (STLs removed for perf), 7
   tiles/row from the 14 client-master JPGs.
5. StatsCounter — 2-up at lg / 4-up at xl, clamp(56,8vw,96) so "1,000+" never clips.
6. HeritageTimeline · Location · ClosingCta (softened saffron band, "Let's forge
   something.")

### Brand assets (from client's `~/Downloads/Omni forge/`)
- Hero/walkthrough videos re-encoded from the 4K "Omni Forge fin" master (565MB →
  hero.mp4 38MB 1080p / walkthrough-scrub.mp4 16MB 720p / hero-firstshot.mp4 2.6MB).
- 11 high-res master JPGs → optimized scaled+AVIF+WebP siblings in
  `public/assets/images/`. **Masters live in `public/assets/images/originals/`
  which is gitignored.**
- Real logo in the Header (`public/assets/brand/logo-cropped-679x140.png`).
- Favicons regenerated from the 2000×2000 master; OG card composites the real
  wordmark.

### Polish + fixes already shipped
- Mobile header: dynamic `--header-h`, iOS safe-area, focus trap, inline Quote chip,
  backdrop tap-close, reach-us block.
- Navigation: `RouteResetEffects` (scroll-to-top, ScrollTrigger refresh, detached-
  trigger sweep), header readable on every route, no 308 trailing-slash hops.
- Removed the broken saffron `PageWipe` slab (was the "everything turns orange on
  nav" bug). Crossfade `PageTransition` stays.
- /about, /solutions, /products, /careers, /contact all raised to editorial register.
- a11y: skip-link, text-saffron/ash contrast fixes, heading hierarchy, video
  reduced-motion gate.
- Security: `_headers` + `.htaccess` baseline CSP, postcss pinned (audit clean),
  SECURITY.md. three.js in one shared chunk (saved ~800KB).

---

## OPEN — next session

### Needs client input (tracked in `CLIENT_REVIEW.md`)
1. **STL → product-name mapping** for the 9 numbered renders is guessed
   (`src/data/renders.ts`). Need the real catalogue.
2. **Certification PDFs** — 6 cards currently route to "Request copy" mailto;
   drop real PDFs in `public/assets/pdf/` to enable direct download.
3. **Creative-liberty sign-off**: hero headline "since nineteen seventy-five.",
   invented heritage milestones, "Inside the wonderworld" headline.
4. **Photoshoot** — current imagery is 2022 web JPGs + the drone clip.
5. **Contact-form backend**: Formspree wired but needs `NEXT_PUBLIC_FORMSPREE_URL`.
6. **Analytics**: Plausible toggle present, off by default.
7. **Hosting cutover**: `vercel.json` + `docs/DEPLOY.md` ready; pick Vercel vs
   Hostinger. `metadataBase` is `https://www.ommiforge.com` — update if staging.

### Engineering backlog
- A11y audit flagged **`text-mesh` small text on paper = 3.91:1** (just under AA
  4.5:1 body). Passes large-text; needs a `--color-mesh-text` dark-variant token
  decision before a blanket swap (would otherwise weaken the brand signal).
- `ProductsGallery` modal + a few sections could migrate from legacy `useScroll()`
  to the new `useScrollSubscribe()` ref-store for fewer re-renders.

---

## Decisions / gotchas to remember
- **Hammer = V1 only.** Don't re-elaborate it; user rejected the fancier versions.
- **No PageWipe.** The saffron slab is permanently removed — `mode="wait"` + single
  keyed child can't do an enter→hold→exit lifecycle (leaves the slab stuck).
- **Scroll-scrub videos need dense keyframes** (`-g 6` / `-g 12`) or seeking stalls.
  hero.mp4 (normal GOP) is fine for the autoplay-less pin only because the firstshot
  clip is the one actually scrubbed.
- **Lenis ↔ ScrollTrigger** are wired; pin/scrub uses `scrub: true` (not a number)
  because Lenis already smooths — layering both compounds latency.
- `AGENTS.md`/`CLAUDE.md` warn this is Next 16 with breaking changes — check
  `node_modules/next/dist/docs/` before Next-API edits.
- `public/assets/images/originals/` and `public/assets/wp-mirror/` are gitignored
  (large masters / raw scrape).
