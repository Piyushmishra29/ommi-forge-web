# Audit 02 — React Three Fiber Bundle

**Date:** 2026-06-01
**Auditor angle:** R3F + three.js + drei chunk weight on `/`, `/renders/`, `/renders/[slug]/`
**Build target:** Next 16.2.6 (Turbopack), `output: 'export'`
**Build verified locally:** `pnpm build` (clean, 22/22 static pages)

---

## Severity — **MEDIUM**

Bundle gating is already in place and works as designed. The three.js chunk does **NOT** appear in initial-load JS for any route (`/`, `/renders/`, `/renders/[slug]`). It is fetched lazily via `next/dynamic({ ssr: false })` after the IntersectionObserver in `HammerStrikeIntro` / `StlPreview` / `StlViewer` fires.

What pushes this to Medium (not Low):

| Metric | Measured | Note |
|---|---|---|
| Three+r3f+drei single chunk (raw) | **873 KB** (`.next/static/chunks/0eh4uw_tto76y.js`) | Single de-duplicated copy across `/`, `/renders/`, `/renders/[slug]` — gating layer is correct, dedup is correct. |
| Three chunk (gzip) | **~229 KB** | What the user actually downloads. |
| Trigger on `/` | hero in-view (`rootMargin: 600px`) | Fires within ~1 viewport of page load on every device. |
| Trigger on `/renders/` | tile in-view (`rootMargin: 200px`) | Fires immediately — grid is above the fold. |
| Initial-load JS for `/` | ~966 KB raw across 14 chunks | Three chunk excluded; biggest single piece is GSAP (321 KB raw). |
| HDRI ground truth | `public/assets/hdr/empty_warehouse_01_1k.hdr` = **1.6 MB** | Fetched on `/renders/[slug]` mount; not in JS bundle but adds to transfer. |

**Net:** every visitor who scrolls past Act 01 ships ~229 KB gzipped of three to their device. Fine for desktop, painful on mid-range mobile + LTE. This is the largest single async chunk in the app.

---

## Findings

### F1 — `<Environment>` in `StlViewer` pulls PMREMGenerator + RGBELoader + gainmap into the shared three chunk

**File:** `src/components/three/StlViewer.tsx:271`
```tsx
<Environment files="/assets/hdr/empty_warehouse_01_1k.hdr" />
```

Confirmed `PMREMGenerator` is present in `0eh4uw_tto76y.js` (the 873 KB chunk). `drei`'s `Environment` pulls in `three-stdlib` HDR loaders + `@monogrid/gainmap-js` via `useEnvironment`. Even though only `Environment` is named, the module graph drags PMREM in for the irradiance pre-filter.

`HammerStrikeHero` already does **not** use `Environment` — only `ambientLight + directionalLight + ContactShadows` (`HammerStrikeHero.tsx:99-147`). So the entire HDRI/PMREM cost exists for `StlViewer` only. But because the lazy import map is shared (drei is a single graph), the chunk shipped to `/` (HammerStrikeHero) also contains PMREM/HDRI loader code that `/` will never execute.

**Impact:** ~80–150 KB raw (~25–45 KB gz) of dead code on the home page route. Hard to nail exactly without `@next/bundle-analyzer` (see Q1 in Recommendations).

---

### F2 — `Environment files="/assets/hdr/…"` adds 1.6 MB HDRI on every `/renders/[slug]` load

**File:** `src/components/three/StlViewer.tsx:271`, asset at `public/assets/hdr/empty_warehouse_01_1k.hdr` (1.6 MB on disk; HDR is RGBE-encoded so transfer ≈ same).

The comment in `StlViewer.tsx:264-270` explains the file was inlined to avoid `raw.githack.com` fetches — correct call. But the user only sees one of 9 detail pages at a time. 1.6 MB per visit just for an environment map on a near-matte forging mesh (`metalness: 0.7`, `roughness: 0.35`) is heavy. The metalness benefits visually, but a `meshPhysicalMaterial` lit by the two existing directional lights + a bumped `envMapIntensity` from a procedural `RoomEnvironment` or a 256×256 pre-baked equirect PNG (~30 KB) would look ~95% as good.

---

### F3 — `StlPreview` mounts a full R3F Canvas + STLLoader **per tile**, x9 on `/renders/`

**File:** `src/components/three/StlPreview.tsx:144-168`

Each `/renders/` tile, once in view, parses its STL (1.2–5.1 MB raw, total ~27 MB of STL data across 9 parts), uploads the BufferGeometry to GPU, and runs a separate WebGL context + `useFrame` loop. On entry into the grid (above-the-fold), up to 4–6 of these mount in the same paint frame.

The grid only uses these for a slow auto-rotate decoration (`SpinningModel`, `StlPreview.tsx:65-69`). No interaction, no zoom — just rotation. The interactive viewer is on `/renders/[slug]/` (via `StlViewer`).

This is the lever the audit prompt asked about: **pre-render a 1024×1024 PNG (or short GIF / video sprite) per part at build time, swap `<StlPreview>` on `/renders/` for `<img>`.** That removes:
- 9 Canvas + WebGL context allocations on grid view
- ~27 MB of STL transfer if the visitor only browses the grid
- The entire R3F mount cost on this route — and because `/renders/` is the second-highest-traffic route after `/`, the win compounds

`StlViewer` (the real interactive one on `/renders/[slug]/`) keeps full R3F as-is.

---

### F4 — Drei imports are already correctly named (no audit needed beyond confirmation)

**Files:**
- `src/components/three/StlViewer.tsx:11-15` — `import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";`
- `src/components/three/HammerStrikeHero.tsx:5` — `import { ContactShadows } from "@react-three/drei";`

`@react-three/drei`'s `package.json` declares `"sideEffects": false` and `index.js` is pure `export { X } from './path/X.js'` re-exports. Turbopack + the chunk dump confirm tree-shaking is working — neither `Stage`, `<Center>`, `<Float>`, `<Sky>`, drei text helpers nor `troika-three-text` show up in the chunk strings. **No action needed on (C).**

---

### F5 — `next/dynamic({ ssr: false })` IS set everywhere R3F touches

**File:** `src/components/three/lazy.tsx:152-177`

All three R3F components (`StlViewer`, `StlPreview`, `HammerStrikeHero`) are exported only via `lazy.tsx` with `ssr: false`. Direct grep confirms no consumer imports the bare component: every importer references `@/components/three/lazy`. **No action needed on (D).**

The IntersectionObserver double-gate (`HammerStrikeIntro.tsx:39-65`, `StlPreview.tsx:94-126`) adds the second deferral so the chunk isn't fetched until the section is within `200–600 px` of the viewport. This is good practice and should stay.

---

### F6 — `OrbitControls` is only on `<StlViewer>` (correct), and only activates after tap

**File:** `src/components/three/StlViewer.tsx:280-289`

`OrbitControls` is correctly gated by `enabled={active}` and the canvas is `pointer-events-none` until tap. No TouchScroll/Pointer extension was added (drei's `OrbitControls` wraps three-stdlib `OrbitControls`; no extra plugin in use). **No action needed on (3) from the prompt.**

---

### F7 — Single chunk dedup is working (confirmation)

The 873 KB chunk is the **only** copy of three+r3f+drei in `out/_next/static/chunks/`. It is referenced from at least 5 small dynamic-loader chunks (`0-qrn9-.duis3.js`, `0-13n2bi1.bb0.js`, `06u~op-gd.zy9.js`, `0n1w2abodedw-.js`, `16vr2z8h.3ojp.js`) — i.e. shared across routes. The concern raised in `lazy.tsx:8-14` (about per-route duplication) is no longer reproducing on this Next 16 / Turbopack setup. Lazy wrappers are still the right call (SSR safety, gating), but the duplication motivation can be updated in the comment block.

---

## Recommended fixes (ranked)

### (B1) Pre-render 9 STL thumbnails at build time, ship `<img>` on `/renders/` — **High impact, Medium effort**

**Effort:** ~3–4 hr (one-time build script + grid swap).
**Impact:**
- Removes 9 Canvas + R3F + WebGL contexts on `/renders/`.
- Drops `/renders/` initial JS-execution cost dramatically — three chunk is still cached (used on `/renders/[slug]`), but not parsed/executed on this route.
- Saves ~27 MB STL transfer for grid-only visitors.
- ~9 × 80 KB WebP thumbnails ≈ 720 KB **total** transfer for the grid, served as next-gen images.

**Recipe:**
1. Add `scripts/build-stl-thumbnails.mjs` that uses `three` + `node-canvas` (or headless puppeteer driving the existing `StlPreview` Canvas) to render each `public/assets/stl/part-*.stl` to `public/assets/renders/part-*.webp` at 1024×1024.
2. Add to `prebuild`.
3. Add `thumbnail?: string` to the `Render` type and populate.
4. Swap `<StlPreview>` in `src/app/renders/renders-grid.tsx:37` for a plain `<img>` (or `<picture>` with AVIF fallback) — keep the same `aspect-square` hover styling.
5. Keep `<StlPreview>` available in `solutions/MethodsPinned.tsx` (uses it for the methods strip) — or migrate that to thumbnails too, same script.

### (A1) Drop `<Environment>` from `StlViewer`, use procedural lighting + `envMapIntensity` tuning — **Medium impact, Low effort**

**Effort:** ~30 min.
**Impact:** Removes PMREM + RGBELoader + gainmap from the shared three chunk (~80–150 KB raw, ~25–45 KB gz). Removes 1.6 MB HDRI transfer per `/renders/[slug]` visit. Saves bandwidth even more than JS.

**Recipe:**
- Delete `<Environment files="/assets/hdr/empty_warehouse_01_1k.hdr" />` (`StlViewer.tsx:271`).
- Add a third rim light (cool top-back) to compensate for lost specular reflections.
- Bump `meshStandardMaterial` `envMapIntensity` to 1.5 or switch to `meshPhysicalMaterial` with `clearcoat: 0.3`.
- Optionally swap to drei's `<Environment preset="warehouse" />` only if you want to keep HDRI — but **don't**, the `preset` form fetches from `raw.githack.com` and was deliberately removed (see comment at `StlViewer.tsx:264-270`).
- Delete `public/assets/hdr/empty_warehouse_01_1k.hdr`.

### (Q1) Wire `@next/bundle-analyzer` — **Low effort, enables future work**

**Effort:** 10 min.
**Impact:** Lets us see exactly which drei sub-modules / three sub-files are in the chunk. Currently we infer via grep on minified output. Listed for completeness; the audit prompt explicitly said "don't add it yourself" — recommending only.

### (DEFER) Hand-rolled lights on `<HammerStrikeHero>` — **Already done**

Audit prompt's fix (A) was "replace `<Stage>` with lights + `<ContactShadows>`". `HammerStrikeHero` was never using `<Stage>` — see `HammerStrikeHero.tsx:99-147`. No action.

---

## GitHub issue draft

**Title:** Perf: shave three.js cost — pre-render STL thumbnails for `/renders/` grid + drop HDRI from `StlViewer`

**Body:**

```
## Problem

The three.js + r3f + drei chunk is 873 KB raw / 229 KB gzip
(`.next/static/chunks/0eh4uw_tto76y.js`). It is correctly lazy-loaded
via `next/dynamic({ ssr: false })` from `src/components/three/lazy.tsx`
and gated by `IntersectionObserver`, so it doesn't appear in initial
JS for any route. But:

- Every visitor who scrolls past the Act 01 hammer hero on `/` pulls
  the entire chunk (~229 KB gz).
- Every visitor to `/renders/` mounts up to 9 separate R3F Canvases,
  one per tile, parses ~27 MB of STL data, and runs nine `useFrame`
  loops just to display gently-spinning thumbnails.
- Every visitor to `/renders/[slug]/` additionally downloads
  `public/assets/hdr/empty_warehouse_01_1k.hdr` (1.6 MB) for an
  environment map that lights a near-matte forging mesh.

## Proposed fixes

### B1 — Pre-render STL thumbnails (priority)

Add `scripts/build-stl-thumbnails.mjs` to render each
`public/assets/stl/part-*.stl` to a 1024×1024 WebP at build time
(via `node-canvas` or headless puppeteer). Add a `thumbnail?: string`
field to the `Render` type in `src/data/renders.ts`. Swap the
`<StlPreview>` mount in `src/app/renders/renders-grid.tsx:37` for an
`<img>`. Optionally also apply to
`src/components/sections/solutions/MethodsPinned.tsx:114`.

**Win:** removes the entire R3F mount + WebGL context cost on
`/renders/` (the second-busiest route), saves ~27 MB STL transfer for
grid-only visitors, replaces with ~720 KB total WebP thumbnails.

### A1 — Drop `<Environment>` from `StlViewer`

Remove `<Environment files="/assets/hdr/empty_warehouse_01_1k.hdr" />`
from `src/components/three/StlViewer.tsx:271`. Compensate with a
third (cool, top-back) rim light + raise `envMapIntensity` or switch
to `meshPhysicalMaterial` with `clearcoat: 0.3`. Delete the HDRI from
`public/assets/hdr/`.

**Win:** ~80–150 KB raw / 25–45 KB gz off the shared three chunk
(PMREM + RGBELoader + `@monogrid/gainmap-js`), 1.6 MB off every
`/renders/[slug]` page load.

### Quick recommendation, not part of this issue

Wire `@next/bundle-analyzer` so future R3F audits can read drei /
three sub-module sizes off a treemap instead of grepping minified
chunks.

## Out of scope / already fine

- `HammerStrikeHero` already hand-rolls lights + `<ContactShadows>`
  (no `<Stage>`). No action.
- All `@react-three/drei` imports are correctly named; drei is
  `"sideEffects": false`; Turbopack tree-shakes properly.
- `next/dynamic({ ssr: false })` is set everywhere; consumers only
  import via `src/components/three/lazy.tsx`.
- `OrbitControls` is only on `<StlViewer>` and only `enabled` after
  user tap — no extra extension is bundled.
- The 873 KB chunk is the single de-duplicated copy across `/`,
  `/renders/`, `/renders/[slug]/`. Per-route duplication is not
  reproducing on this Next 16 / Turbopack setup; the comment block
  at `src/components/three/lazy.tsx:8-14` can be relaxed.

## Acceptance

- [ ] `/renders/` initial render no longer mounts an R3F Canvas
      (verify with React DevTools / `chrome://tracing`).
- [ ] `.next/static/chunks/*.js` no longer contains the strings
      `PMREMGenerator`, `RGBELoader`, `monogrid`, `gainmap`.
- [ ] No request to `*.hdr` from `/renders/*`.
- [ ] Visual diff on `/renders/[slug]/` shows acceptable specular
      response (compare with `_masters/` reference).
```

---

## Quick reference — file:line index

| Concern | File:Line |
|---|---|
| Lazy wrappers (the right pattern) | `src/components/three/lazy.tsx:152-177` |
| `<Environment>` HDRI in viewer | `src/components/three/StlViewer.tsx:271` |
| `<OrbitControls>` (gated, fine) | `src/components/three/StlViewer.tsx:280-289` |
| Per-tile R3F Canvas (replace with `<img>`) | `src/components/three/StlPreview.tsx:144-168` |
| Hammer hero (already hand-rolled lights) | `src/components/three/HammerStrikeHero.tsx:99-147` |
| Hero gating IntersectionObserver | `src/components/sections/home/HammerStrikeIntro.tsx:39-65` |
| Grid consumer (swap to `<img>`) | `src/app/renders/renders-grid.tsx:37` |
| Methods strip (also consider swap) | `src/components/sections/solutions/MethodsPinned.tsx:114` |
| HDRI asset (delete after A1) | `public/assets/hdr/empty_warehouse_01_1k.hdr` (1.6 MB) |
| STL assets (no change) | `public/assets/stl/part-*.stl` (9 files, ~27 MB total) |

---

## Build evidence

```
.next/static/chunks/0eh4uw_tto76y.js  873 KB raw / 229 KB gzip   ← three + r3f + drei
.next/static/chunks/11wsi.w0ngp94.js  314 KB raw /  77 KB gzip   ← GSAP (separate audit)
.next/static/chunks/0guh74bd2uwpg.js  221 KB raw /  71 KB gzip   ← react-dom
.next/static/chunks/0x.fjcdki_f4v.js  146 KB raw /  40 KB gzip   ← (uncategorised)
.next/static/chunks/10nl8422medmk.js  141 KB raw /  46 KB gzip   ← framer-motion
```

Initial-load JS for `/`: 14 chunks totalling ~966 KB raw (three chunk NOT included; verified via grep against `out/index.html`).

Chunk content confirmed via `grep` for `PMREMGenerator` (2 hits), `REVISION "184"` (three r184), and absence of `Stage`, `troika-three-text`, `meshline` (good — tree-shake works).
