# Audit 05 — JavaScript Bundle Size

**Scope:** Production build output in `.next/static/chunks/` and the per-route
HTML in `out/`. Mapping of every chunk loaded on first paint, identification
of which library each chunk is mostly composed of, and the top tree-shake /
lazy-load wins.
**Build:** Next.js 16.2.6 (Turbopack), `output: 'export'`, `pnpm build`
clean run on 2026-06-01.
**Read-only.** No source edits applied.

---

## Severity

**HIGH.**

Every route on the site ships **>290 KB of gzipped JavaScript** before any
section JS or three.js is decoded. The home page is **316 KB gz / ~977 KB
raw**, well above the 200 KB-gz First Load JS budget that's generally
considered the cutoff for "fast on mid-tier mobile." The contact page is
**378 KB gz / ~1.25 MB raw** because `react-hook-form + zod + @hookform/
resolvers` add a dedicated 314 KB raw / ~77 KB gz chunk that exists nowhere
else.

The three.js / @react-three/fiber bundles (~876 KB raw three core, ~221 KB
raw fiber+drei) are correctly lazy-loaded via `next/dynamic` in
`src/components/three/lazy.tsx` — they do **not** count toward First Load
JS, which is the one thing the team already got right. Those chunks still
land on `/` (HammerStrikeHero) and `/renders/*` (StlViewer/StlPreview) on
demand, so they do cost the user, just not on the First-Paint critical
path.

The dominant cause of the inflated First Load is **framer-motion shipped on
every route** as a ~141 KB raw / ~46 KB gz chunk (`10nl8422medmk.js`), even
though **10 of the 17 source files that import it use only
`useReducedMotion`** — a single line of `matchMedia` code that does not
need the framer runtime at all.

There is **no `next.config.ts` optimisation work** done at all: no
`experimental.optimizePackageImports`, no `compiler.removeConsole`, no
`modularizeImports`. Every recommended Next 16 perf flag is left at the
default.

---

## Per-route First Load JS table

Computed by parsing the `<script src=…/_next/static/chunks/…>` references
out of each `out/<route>/index.html` and summing raw byte counts +
re-gzipping every referenced chunk at default level. (Next.js 16 stopped
printing the First Load JS table in `next build` output under Turbopack —
this is the equivalent measurement.) Bytes include the framework
chunks, polyfills, root-main, and any per-route chunks. Bytes **exclude**
lazy chunks (three.js, fiber+drei) which load after hydration on demand.

| Route          | First Load JS (raw) | First Load JS (gz) | Notes                                                    |
| -------------- | ------------------- | ------------------ | -------------------------------------------------------- |
| `/` (home)     |       977,507 B     |    **316,049 B**   | 15 chunks. Includes `0jz0q0g~m4-an.js` (36 KB, gsap+motion) |
| `/about`       |       952,469 B     |    **306,689 B**   | 14 chunks. `0k_wn2gfpon8j.js` (21 KB, gsap+motion) is /about-only |
| `/solutions`   |       959,275 B     |    **308,823 B**   | 14 chunks. `06u~op-gd.zy9.js` (27 KB) is /solutions-only |
| `/products`    |       957,797 B     |    **308,421 B**   | 14 chunks. `0-13n2bi1.bb0.js` (26 KB) is /products-only  |
| `/materials`   |       931,536 B     |    **300,409 B**   | 13 chunks. Cleanest route.                              |
| `/renders`     |       938,235 B     |    **302,971 B**   | 14 chunks. `16vr2z8h.3ojp.js` (6.6 KB) is renders-only  |
| `/renders/[a]` |       936,792 B     |    **302,377 B**   | 14 chunks. Detail page; three.js lazy-loads after hydration |
| `/careers`     |       938,937 B     |    **303,184 B**   | 14 chunks. `11~3gbghgepea.js` (7.4 KB) is careers-only  |
| `/contact`     |     1,253,229 B     |    **377,761 B**   | **15 chunks. +314 KB raw zod chunk dedicated to this one route** |

Reference budgets: web.dev "good" First Load JS = <170 KB gz; common Next
project target = <200 KB gz. Every route here is **1.5×–1.9×** over the
ceiling.

---

## Top 10 heaviest chunks (raw, in `.next/static/chunks/`)

| Rank | Chunk                       | Raw   | Gz    | Identity                                       | Loaded by                  |
| ---- | --------------------------- | ----- | ----- | ---------------------------------------------- | -------------------------- |
| 1    | `0eh4uw_tto76y.js`          | 876 KB | 230 KB | **three.js core** (Texture/Matrix/Shader heavy) | LAZY — on demand only      |
| 2    | `11wsi.w0ngp94.js`          | 314 KB |  77 KB | **zod + @hookform/resolvers + react-hook-form** | `/contact` only            |
| 3    | `0guh74bd2uwpg.js`          | 221 KB |  69 KB | **React + react-dom + scheduler** (Fiber)      | EVERY route                |
| 4    | `0a69~pbc7k3x1.js`          | 221 KB |   — KB | **@react-three/fiber + @react-three/drei**     | LAZY — on demand only      |
| 5    | `0x.fjcdki_f4v.js`          | 146 KB |  40 KB | **Next.js client runtime** (router, RSC, link) | EVERY route                |
| 6    | `10nl8422medmk.js`          | 141 KB |  46 KB | **framer-motion** (motion-dom, animate, Variant) | EVERY route              |
| 7    | `0dmerrdr3t7hx.js`          | 111 KB |  44 KB | **gsap + ScrollTrigger + Observer**            | EVERY route                |
| 8    | `03~yq9q893hmn.js`          | 110 KB |  39 KB | **Polyfills** (legacy browser shims)           | EVERY route                |
| 9    | `0a69~pbc7k3x1.js` (alt)    |  90 KB |   — KB | three-stdlib loaders (GLTFLoader etc., second slice) | LAZY               |
| 10   | `0dqch27ou~wlz.js`          |  53 KB |  20 KB | next/image + Suspense + small ui shared        | EVERY route                |

Notable smaller-but-eager chunks:

- `0lhaqebtz80aj.js` (50 KB raw) — **Lenis** + a small slice of motion/gsap.
  Loaded on every route via `LenisProvider` in `app/layout.tsx`.
- `0vpc8f.j6nq-i.js` (43 KB raw) — turbopack runtime + chunk loader.
- `0jz0q0g~m4-an.js` (36 KB raw) — `/`-only home section glue
  (gsap + motion call sites).

The top-3 chunks that ship to **every** route — React (221), Next runtime
(146), framer (141), gsap (111), polyfills (110), next/image (53), Lenis
(50) — total **~832 KB raw / ~268 KB gz** before a single section
component has loaded.

---

## Findings

### F1 — `framer-motion` shipped on every route just for `useReducedMotion` (root cause of bloat)

`grep "from 'framer-motion'" src/` returns **22 import sites**. Of those,
**10 files import only `useReducedMotion`** — verified by:

```
src/app/not-found.tsx
src/components/sections/home/ClosingCta.tsx
src/components/sections/home/ProductsMarquee.tsx
src/components/sections/contact/ContactHero.tsx
src/components/sections/products/ProductsClosingCta.tsx
src/components/sections/products/ProductsHero.tsx
src/components/sections/solutions/SolutionsClosingCta.tsx
src/components/sections/solutions/SolutionsHero.tsx
src/components/sections/careers/CareersHero.tsx
src/components/motion/useStaticPins.ts
```

`useReducedMotion` is a 6-line `matchMedia('(prefers-reduced-motion:
reduce)')` wrapper. It does not need the 141 KB framer-motion runtime.

Additionally `src/app/layout.tsx:4` imports `MotionConfig` at the root —
which alone wouldn't be expensive (it's a Context provider), but it
pulls the rest of motion into the **root** chunk so every route consumes
the full 141 KB / 46 KB gz on first paint, even routes that have zero
actual `motion.*` elements (e.g. `/materials`).

A local `useReducedMotion()` hook (~10 lines) + dropping `MotionConfig`
from the root layout into the few sections that actually animate
**removes** the 141 KB chunk from every route except home/contact.

### F2 — `next.config.ts` has no perf flags set

`next.config.ts` (32 lines) configures `output: 'export'`,
`trailingSlash: true`, `images.unoptimized: true` — and nothing else.
Missing:

- **`experimental.optimizePackageImports`** for `framer-motion`,
  `@react-three/drei`, `gsap` — would convert `import { x } from 'lib'`
  to `import x from 'lib/x'` at build time and let Turbopack tree-shake
  what's unused. Particularly large win for `drei`, which contains
  hundreds of unused helpers.
- **`compiler.removeConsole: { exclude: ['error'] }`** — strips
  `console.log` from production bundles. We didn't grep call sites but
  the dev workflow + `HANDOFF.md`-style notes suggest several remain.
- **`modularizeImports`** for `lucide-react`-style libraries (none in
  use today — verified `package.json` — so no action, but record the
  flag as the standard pattern in case icons are added later).

### F3 — `react-hook-form + zod` ships as 314 KB raw on `/contact` only — most expensive form on the site

`src/components/sections/contact/ContactForm.tsx:4-7` imports
`useForm`, `zodResolver`, `motion`, `AnimatePresence`, and `z`. The form
schema is ~5 fields. `zod` accounts for ~487 of the 600+ identifier
occurrences in the chunk (`grep -c "zod"` = 487). Two cheaper paths:

- (a) Replace `zod` with `valibot` (~1/10th the size for an equivalent
  5-field schema) — invasive but the right call if more forms are
  planned.
- (b) Skip the schema library entirely and write 5 line-by-line
  validations inside `useForm`'s `resolver`. The schema is trivial;
  every byte of zod is wasted here.

This is contained to `/contact` so it doesn't slow other routes — but
`/contact` is the **conversion page**. A B2B prospect who taps "Contact"
from the homepage menu downloads 80 KB gz on top of the 316 KB they
already paid for, while their attention is on submitting an enquiry.

### F4 — `gsap + ScrollTrigger + Observer` (111 KB raw, 44 KB gz) ships on every route, including routes with no scroll-pinned content

`src/lib/gsap.ts` is a `'use client'` module that imports
`'gsap'`, `'gsap/ScrollTrigger'`, `'gsap/Observer'` and immediately
registers the plugins on `window`. The subpath imports are correct (good
— this is one place tree-shaking already works). But the file is
imported by `LenisProvider` and `RouteResetEffects`, both of which are
mounted in `app/layout.tsx`. As a result the gsap chunk lands on
**every route**, including `/contact`, `/careers`, `/materials`, and
`/about` — pages that have zero pinned sections.

Options:

- Move `gsap.registerPlugin` invocation into a dynamic import inside
  the components that actually use ScrollTrigger (Hero,
  PlantWalkthrough, HammerStrikeIntro, MethodsPinned, etc.) and let
  `next/dynamic` create a shared lazy chunk.
- Or: gate the registration on a `prefers-reduced-motion: no-preference`
  matchMedia check at the top of `LenisProvider` so reduced-motion
  visitors don't download ScrollTrigger at all (saves them ~44 KB gz
  on every page, including the home).

### F5 — three.js + fiber + drei are correctly lazy-loaded (no regression here)

Confirmed by grep: chunks `0eh4uw_tto76y.js` (876 KB three core) and
`0a69~pbc7k3x1.js` (221 KB fiber+drei) are NOT referenced in any
`out/*/index.html`. They are pulled in by `next/dynamic` via
`src/components/three/lazy.tsx`, exactly as the file's own header
comment intended.

This means three.js downloads on a separate connection after the LCP
candidate is on screen — the right place for it. The cost shows up
later (when HammerStrikeHero or StlViewer mounts), but it is **off the
First Load JS critical path**, which is the only metric Lighthouse
scores against in the perf-score formula.

The only mild concern: `@react-three/drei` is treated as a single
import boundary by Turbopack and ships its whole exported surface
inside the 221 KB fiber chunk even if only `useGLTF` + `Center` are
used. `experimental.optimizePackageImports: ['@react-three/drei']`
would trim this — see F2.

### F6 — `MagneticCursor` and `PageTransition` are eagerly imported in `app/layout.tsx`

Both are `'use client'` components imported statically at
`app/layout.tsx:10-11`. `MagneticCursor` is a no-op on touch devices
(verified by reading the file in this audit pass: see existing
`src/components/motion/MagneticCursor.tsx`) — meaning every mobile user
downloads the code but never runs it. `PageTransition` runs a single
`<AnimatePresence>` wipe between routes and could trivially be lazy.

Wrapping both in `dynamic(() => import(…), { ssr: false })` would
push their code out of the root-main chunk and into deferred chunks
fetched after First Paint. It also lets the root chunk drop the
`AnimatePresence` named export that `PageTransition` pulls from
framer-motion, which would partially shrink the 141 KB motion chunk
once F1 is also applied.

### F7 — 110 KB polyfill chunk on every route

`03~yq9q893hmn.js` (110 KB raw, 39 KB gz) is in the `polyfillFiles`
list of every route's `build-manifest.json`. Next 16 ships polyfills
only when `browserslist` indicates legacy targets — this project has
no `browserslist` config in `package.json`, so it falls back to the
default which still ships `core-js` shims for ES2018 features that
literally every shipping browser has supported for 6+ years. Adding a
`browserslist: "defaults and supports es6-module"` (or similar) entry
in `package.json` will let Next drop the polyfill chunk entirely, or
at minimum shrink it to a tiny stub. Worth roughly **39 KB gz off
every route**, including the home.

---

## Proposed fixes (in priority order)

### Fix A — Replace `framer-motion useReducedMotion` with a local hook *(highest ROI)*

Touch the 10 files in F1. Replace:

```ts
import { useReducedMotion } from 'framer-motion';
```

with a `useReducedMotion` hook in `src/lib/use-reduced-motion.ts`:

```ts
'use client';
import { useEffect, useState } from 'react';
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}
```

The framer-motion chunk drops off `/about`, `/materials`, `/renders`,
`/renders/[slug]`, `/careers`, `/solutions`, `/products`. Estimated
savings: **~46 KB gz × 7 routes** worth of code-eviction (it'll still
ship on `/` and `/contact` where real `motion.*` elements exist).

### Fix B — Add the missing `next.config.ts` flags

```ts
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@react-three/drei',
      '@react-three/fiber',
      'gsap',
    ],
  },
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },
};
```

Expected impact: 10–25 % shrink on the framer-motion, drei, and fiber
chunks. Free — no source changes.

### Fix C — Lazy-load `MagneticCursor` and `PageTransition` in `app/layout.tsx`

```ts
import dynamic from 'next/dynamic';
const MagneticCursor = dynamic(
  () => import('@/components/motion/MagneticCursor'),
  { ssr: false },
);
const PageTransition = dynamic(
  () => import('@/components/motion/PageTransition'),
  { ssr: false },
);
```

Pushes both out of the root chunk into deferred-fetch chunks that load
after First Paint. Cuts the 36–141 KB motion-call-site code from the
critical path on every route.

### Fix D — Add `browserslist` to `package.json` to drop the polyfill chunk

```json
"browserslist": [
  ">0.3% and supports es6-module and not dead",
  "not op_mini all"
]
```

Frees ~39 KB gz from every route. No source changes.

### Fix E — Audit `gsap` registration

Move `src/lib/gsap.ts`'s `registerPlugin` call into a function that
consumers call inside `useEffect` only on routes that need
ScrollTrigger, OR gate it behind `prefers-reduced-motion: no-preference`.
This is the most invasive change here (touches 4–5 components) but is
the only path to dropping the 44 KB gz gsap chunk from `/contact`,
`/careers`, `/materials`.

### Fix F — Trim `zod` from `/contact`

Either swap to `valibot` or write hand-rolled validators inside
`useForm`'s resolver. Saves ~70 KB gz on the conversion page.

### Fix G — `framer-motion` LazyMotion + `m` alias (deferred)

For the routes where motion *is* needed (`/`, `/contact`, hero scroll
reveals), wrap usage in `<LazyMotion features={domAnimation}>` and use
`<m.div>` instead of `<motion.div>`. Trims the motion chunk further by
loading only the DOM animations slice. Bigger refactor — schedule
after A–D land.

---

## Combined impact estimate (back-of-envelope)

Apply Fix A + B + C + D on every route:

| Route          | Before (gz) | After (gz, est.) | Δ              |
| -------------- | ----------- | ---------------- | -------------- |
| `/` (home)     |   316 KB    |   ~225 KB        | **−91 KB (29 %)** |
| `/about`       |   307 KB    |   ~175 KB        | **−132 KB (43 %)** |
| `/solutions`   |   309 KB    |   ~180 KB        | **−129 KB (42 %)** |
| `/products`    |   308 KB    |   ~180 KB        | **−128 KB (41 %)** |
| `/materials`   |   300 KB    |   ~170 KB        | **−130 KB (43 %)** |
| `/renders`     |   303 KB    |   ~172 KB        | **−131 KB (43 %)** |
| `/renders/[a]` |   302 KB    |   ~172 KB        | **−130 KB (43 %)** |
| `/careers`     |   303 KB    |   ~172 KB        | **−131 KB (43 %)** |
| `/contact`     |   378 KB    |   ~285 KB        | **−93 KB (25 %)** |

(Numbers are estimates; only a clean re-build after each fix gives
ground truth. The home and contact pages benefit less because they
genuinely need motion + form code.)

Most-bang-for-buck: **Fix D (browserslist) and Fix B (config flags)**
are zero-risk, source-free wins worth ~50 KB gz across every route.
Fix A is mechanical but touches 10 files. Fix C is 4 lines in
`app/layout.tsx`. Fix E is the most fiddly; Fix F is opinionated.

---

## GH issue draft

> **Title:** perf(bundle): First Load JS is 300–378 KB gz on every route
>
> **Body:**
> Production build inspection of `.next/static/chunks/` shows every route
> ships **>290 KB gzipped First Load JS**, with `/contact` at **378 KB gz
> (~1.25 MB raw)** and `/` at **316 KB gz (~977 KB raw)**. The web.dev
> "good" budget is 170 KB gz and the common Next target is 200 KB gz.
> Every route is 1.5×–1.9× over.
>
> Root causes (audit `docs/audit/05-js-bundle.md`):
> - F1: `framer-motion` (141 KB / 46 KB gz) ships on every route purely
>   because 10 section files import `useReducedMotion` from it. A 10-line
>   local hook removes the chunk from 7 routes.
> - F2: `next.config.ts` has zero perf flags — no
>   `experimental.optimizePackageImports`, no `compiler.removeConsole`,
>   no `browserslist`.
> - F3: `/contact` ships a dedicated 314 KB raw / 77 KB gz chunk for
>   `zod + @hookform/resolvers + react-hook-form` to validate 5 fields.
> - F4: gsap + ScrollTrigger + Observer (111 KB / 44 KB gz) ships on
>   every route, including pages with zero pinned sections, because
>   `lib/gsap.ts` is imported by `LenisProvider` in the root layout.
> - F6: `MagneticCursor` and `PageTransition` are statically imported in
>   `app/layout.tsx` instead of lazy.
> - F7: Default Next polyfill bundle (110 KB / 39 KB gz) ships because
>   `package.json` has no `browserslist` field.
>
> three.js / fiber / drei are correctly lazy-loaded (`src/components/
> three/lazy.tsx`) and don't count toward First Load JS — leave that
> alone.
>
> **Proposed PR sequence:**
> 1. `chore(config): add experimental.optimizePackageImports +
>    browserslist + removeConsole` (Fix B + D, zero source changes)
> 2. `perf(motion): replace framer useReducedMotion with local
>    matchMedia hook` (Fix A, 10 files)
> 3. `perf(layout): lazy-load MagneticCursor + PageTransition`
>    (Fix C, 4 lines)
> 4. `perf(scroll): defer gsap plugin registration to pinned routes`
>    (Fix E, follow-up)
> 5. `perf(contact): replace zod with hand-rolled validators (or
>    valibot)` (Fix F, follow-up)
>
> Audit doc: `docs/audit/05-js-bundle.md`.
> Severity: HIGH (First Load JS is the dominant input to LCP on mobile
> for a content site like this).

---

## Out of scope for this audit (deferred)

- Whether the LCP element on `/` is the hero canvas or the H1 — covered
  in audit 01 (image preload). The JS budget here doesn't change LCP
  on its own, but every KB of First Load JS deferred earlier paint of
  the hero canvas.
- Server-render strategy for the form on `/contact` — currently fully
  client; could be a `<form action="…">` POST that doesn't need
  react-hook-form at all. Audit 02 (forms) — not yet written.
- Edge-cache and HTTP/2 push tuning at the Pi-VPS / Tailscale layer.
  Compression and HTTP/2 server-push are downstream of the bundle
  sizes we ship — fix the bundles first, then revisit.
