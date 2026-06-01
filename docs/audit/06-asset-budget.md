# 06 — Asset Budget Audit (image/video/STL payload + delivery format)

> Scope: total weight + delivery format of media shipped to the browser.
> Date: 2026-06-01.  Auditor angle: image/asset payload + delivery format.

---

## Severity

**HIGH.** Home page mounts two scroll-scrub image sequences that **fetch every frame up front** — 136 HTTP requests for ~34 MB of JPGs before the canvas can even compose its first frame correctly. Plus 27 MB of `hero-firstshot.mp4` is shipped in `out/` despite being **dead code** (no `src/` reference) and 36 MB of `.mp4` total sits in `/public/assets/video/` of which only the 276 KB `hero-poster.jpg` is actually referenced.

Net effect: a phone on cellular pays a ~34 MB image-decode bill on `/` and a ~63 MB transfer bill on `out/` for static deploys (assuming the host serves the orphan videos because they're under `public/`).

---

## Asset Inventory

### Source tree (`public/assets/`)

| Path | Size | Referenced from `src/`? | Notes |
|---|---|---|---|
| `frames/hero/` (46 JPGs, 1920×1080) | **18 MB** | `Hero.tsx` (all 46) | Preloaded up front |
| `frames/plant/` (90 JPGs, 1280×720) | **16 MB** | `PlantWalkthrough.tsx` (all 90) | Preloaded up front |
| `video/hero-firstshot.mp4` | **27 MB** | **No** (replaced by hero frames) | Dead weight in `out/` |
| `video/walkthrough-scrub.mp4` | **8.1 MB** | **No** (replaced by plant frames) | Dead weight in `out/` |
| `video/plant-pan-1080.mp4` | 1.0 MB | **No** | Dead weight |
| `video/plant-walkthrough.mp4` | 192 KB | **No** | Dead weight |
| `video/hero-poster.jpg` (1920×1080) | 276 KB | `Hero.tsx` bg-cover | Right-sized |
| `stl/part-{a..i}.stl` (9 files) | **30.5 MB** | `renders-grid.tsx` + render detail | Lazy via IO, but all 9 load on scroll-through |
| `stl/named/*` (11 files) | **32 MB** | `data/renders.ts` references `part-*` only | Orphans (duplicates with friendly names) |
| `hdr/empty_warehouse_01_1k.hdr` | 1.6 MB | `StlViewer.tsx` (`/renders/[slug]` only) | Correctly scoped |
| `images/*.{jpg,webp,avif}` (sibling triples) | 14 MB | grid pages via `<picture>` | Already optimised + format-served |
| `brand/favicon-original.png` | 3.5 MB | favicon build only | Source, not shipped |
| `brand/favicon-square-2000.png` | 4.4 MB | favicon build only | Source, not shipped |

### Per-route delivery profile (estimated)

| Route | Eagerly loaded media | Notes |
|---|---|---|
| `/` (home) | hero-poster (276 KB) + **46 hero JPGs (18 MB)** + **90 plant JPGs (16 MB)** + product tile WebPs (~1 MB) | ≈ 35 MB of media before Act 04 |
| `/renders/` | 9 × STL (~30 MB total) staggered by IO 200 px rootMargin | ~3-5 MB per card as user scrolls |
| `/renders/[slug]` | 1 × STL (2-5 MB) + HDRI (1.6 MB) | Scoped correctly |
| `/products/`, `/about/`, etc. | `<picture>` AVIF/WebP/JPG via `image-formats.ts` | Good — modern formats already in place |

### Built tree (`out/`)

Mirrors `public/` exactly because `output: 'export'` + `images.unoptimized: true`. The dead video files **ship to whatever host serves `out/`** unless filtered at deploy time.

---

## Encoder availability (`which` checks)

| Tool | Status | Notes |
|---|---|---|
| `ffmpeg` 8.1 | Installed, **libwebp enabled** (`-formats` shows `E  webp`) | README's "system ffmpeg lacks libwebp" caveat is **stale** as of today |
| `cwebp` 1.6.0 | Installed (`/usr/local/bin/cwebp`) | Best per-image webp encoder |
| `magick` 7.1.2 with AVIF (HEIF 1.21.2) | Installed | `magick foo.jpg -quality 50 foo.avif` works |
| `avifenc` | Not installed | `brew install libavif` would add it; `magick` is sufficient |
| `sharp` (npm) | Already used by `scripts/optimize-images.mjs` | Can do webp + avif in-process |

**Spot-check empirical savings (just ran)**:
- `hero/f-001.jpg` 432 KB → `cwebp -q 80` **218 KB** (-50%) → `magick -quality 50 .avif` **110 KB** (-75%)
- `plant/f-001.jpg` 271 KB → `cwebp -q 80` **161 KB** (-40%)

Extrapolated:
- Hero sequence 18 MB → ~9 MB WebP / ~4.5 MB AVIF
- Plant sequence 16 MB → ~9.6 MB WebP / ~4 MB AVIF
- **Combined: 34 MB → ~18.6 MB WebP (-15 MB) or ~8.5 MB AVIF (-25.5 MB)**

---

## Findings & Recommended Fixes (with byte estimates)

### F1 — `useScrollImageSequence` preloads every frame up front (HIGH)

`src/components/motion/useScrollImageSequence.ts` (lines 56-69) constructs `new Image()` for **all** frames in one synchronous loop. The browser fires `count` parallel requests the instant the section mounts. On `/`, the Hero **and** PlantWalkthrough both run on first paint, so 136 requests / 34 MB hit the wire at once.

**Fix (no code yet, recommendation):**
- Tiered preload: load 1st frame eagerly + every Nth frame for "skeleton" coverage, then idle-prefetch the rest after `requestIdleCallback`/`onload`.
- OR: chunk into 8-frame batches via `await Promise.all()` with concurrency cap.
- OR: delegate to `<link rel="preload" as="image">` for the first frame only and let the rest be opportunistic (canvas falls back to last-drawn frame anyway, which the hook already does).

**Saved**: not bytes saved, but ~5-15 s of "media-noisy" first paint on a 4 G mobile connection.

### F2 — Frames are JPG; WebP/AVIF would shrink them 50-75% (HIGH)

Confirmed locally that libwebp-enabled `ffmpeg` + `cwebp` + `magick` are all installed. README's caveat is out of date.

**Fix A — WebP frames (easy)**
Re-extract sequences using `ffmpeg -c:v libwebp -quality 80` (or pipe to `cwebp`). Update `useScrollImageSequence` callers to point at `.webp` paths.

**Saved**: ~15 MB on `/` (34 MB → ~19 MB).

**Fix B — AVIF frames (better but slower decode)**

`magick f-001.jpg -quality 50 f-001.avif` cuts further; risk is decode CPU on low-end Android. Recommend WebP-first, AVIF as an enhancement.

**Saved**: ~25 MB on `/` (34 MB → ~9 MB) if browsers support it.

### F3 — Three orphan videos shipped in `out/` (HIGH)

`hero-firstshot.mp4` (27 MB), `walkthrough-scrub.mp4` (8.1 MB), `plant-pan-1080.mp4` (1.0 MB), `plant-walkthrough.mp4` (192 KB) are **not referenced anywhere** in `src/` (only in `HANDOFF.md` as the extraction source). They ship to whatever host serves `out/`.

**Fix:**
- Delete them from `public/assets/video/` and keep them under `_masters/` (which already exists at repo root).
- OR add an explicit `.deployignore` / build step that strips them before deploy.

**Saved**: **36 MB** deploy size; reduces accidental crawler/hotlink bandwidth.

### F4 — `stl/named/` 32 MB orphans (MEDIUM)

`data/renders.ts` only references `/assets/stl/part-{a..i}.stl` (the cryptic names). The `named/` folder is a 32 MB duplicate copy with friendly filenames — useful for engineers but no runtime path references them.

**Fix:** Move `stl/named/` to `_masters/stl/` (or `docs/stl/`) so the build artefact only carries the slim `part-*` set.

**Saved**: **32 MB** deploy size.

### F5 — Missing `<link rel="preload" as="image" fetchpriority="high">` for hero frame 1 (MEDIUM)

`Hero.tsx` background uses `url('/assets/video/hero-poster.jpg')` (276 KB) as a cover-fit fallback — good — but the **first actual sequence frame** (`/assets/frames/hero/f-001.jpg`, 432 KB) is requested only when `useEffect` runs and JS executes. A preload tag in `<head>` would move it onto the critical path.

**Fix:** In `app/page.tsx` or `app/layout.tsx`, emit:
```html
<link rel="preload" as="image" href="/assets/frames/hero/f-001.jpg" fetchpriority="high">
```
(Or use Next 16's `<head>` via metadata once on the home route only — `layout.tsx` is too broad.)

**Saved**: ~200-400 ms LCP improvement on cellular — not bytes, but perceived.

### F6 — `images.unoptimized: true` is unavoidable but mitigated (LOW)

This is required for `output: 'export'`. The codebase already compensates via `scripts/optimize-images.mjs` (sharp WebP+AVIF siblings) and `<picture>` tags driven by `image-formats.ts → cssImageSet`. **This is the right pattern.** Only gap: the script doesn't cover `public/assets/frames/` because those JPGs aren't in `public/assets/images/`. Extend the script (or add a sibling `optimize-frames.mjs`) to cover the sequences.

**Saved**: covered by F2.

### F7 — `/renders/` index still pays for 9 STLs as user scrolls (LOW)

`StlPreview` is correctly IO-gated with `rootMargin: 200px`, so STLs aren't fetched until the card is ~200 px from viewport. But a user who scrolls the index to the bottom triggers **all 9 STL fetches** (~30 MB). For a thumbnail rail this is overkill.

**Fix options:**
- Replace the index thumbnails with **pre-rendered PNG/WebP turntable stills** (server-rendered via `node-three` once, then static), and reserve the live R3F for `[slug]` detail. Each thumbnail drops from ~3 MB STL to ~30 KB WebP — **~99% savings**.
- OR add an `<img>` poster behind the canvas (same trick as Hero) so the STL only loads on hover/intent.

**Saved**: up to **29 MB** on `/renders/` if all cards are scrolled past.

### F8 — Mobile delivery: no width variant (LOW)

All hero frames are 1920×1080 baseline JPG. On a 390 px viewport this is overkill. A 960px-wide variant served via `<picture>` source media queries would halve mobile payload.

**Fix:** Generate `f-001@960.webp` siblings alongside `f-001.webp`; switch `useScrollImageSequence` to take a `src(i, variant)` callback and pick based on `window.innerWidth`.

**Saved**: ~50% more on mobile (~7 MB → ~3.5 MB for hero on small screens).

### F9 — `loading="lazy"` / `decoding="async"` already applied (PASS)

Grid pages (`ProductsGallery`, `ProductsMarquee`, `PhotoBreak`, `CareersHero`) already set both. No action needed.

---

## Recommended Fix Priority (ordered by `bytes_saved / effort`)

| # | Fix | Effort | Bytes saved (per visit) |
|---|---|---|---|
| 1 | F3: Move 4 orphan MP4s out of `public/assets/video/` | 1 commit | **36 MB** deploy/cache |
| 2 | F4: Move `stl/named/` out of `public/` | 1 commit | **32 MB** deploy |
| 3 | F7: Replace STL thumbnails with pre-baked WebP stills | medium | up to **29 MB** on `/renders/` |
| 4 | F2 (WebP): Re-extract frames with libwebp-enabled ffmpeg | small | **~15 MB** on `/` |
| 5 | F1: Tier preload in `useScrollImageSequence` | small-medium | smoother first paint |
| 6 | F5: Preload tag for first hero frame | trivial | LCP ms |
| 7 | F2 (AVIF) / F8: AVIF variant + 960px mobile siblings | medium | additional ~10-15 MB on cellular |

---

## GH Issue Draft

```markdown
### Title
perf(assets): cut home-page media payload from ~35 MB to ~9 MB

### Summary
The home page mounts two scroll-scrub image sequences (`Hero` 46 frames /
18 MB, `PlantWalkthrough` 90 frames / 16 MB) and preloads every frame
synchronously on mount via `useScrollImageSequence`. The `out/` directory
additionally ships ~36 MB of MP4s that are no longer referenced anywhere
in `src/`, and a 32 MB `stl/named/` duplicate. None of this is gated for
cellular.

### Inventory
- `/assets/frames/hero/` — 18 MB (46× 1920×1080 JPG)
- `/assets/frames/plant/` — 16 MB (90× 1280×720 JPG)
- `/assets/video/*.mp4` — 36 MB, **zero src references** (dead)
- `/assets/stl/named/` — 32 MB duplicates of `stl/part-*` (dead)
- `useScrollImageSequence` preloads ALL frames on mount → 136 requests / 34 MB on `/`

### Proposed fixes (ranked)
- [ ] **Strip orphan MP4s + `stl/named/` out of `public/`** (move to `_masters/`). Saves ~68 MB deploy.
- [ ] **Re-encode frames to WebP** (`ffmpeg 8.1` + libwebp is now on the dev box; cwebp + magick AVIF also available). Saves ~15 MB on `/` (WebP) or ~25 MB (AVIF). Spot-checked: `hero/f-001.jpg` 432 KB → 218 KB WebP → 110 KB AVIF.
- [ ] **Tier frame preload** in `useScrollImageSequence`: load f-001 eagerly, every-Nth as skeleton, rest via `requestIdleCallback`.
- [ ] **Preload first hero frame** in route `<head>` (`<link rel="preload" as="image" fetchpriority="high">`).
- [ ] **Pre-bake STL thumbnails to WebP turntable stills** for `/renders/` index; reserve live R3F for `/renders/[slug]`. Saves up to 29 MB.
- [ ] **Mobile variant** of frame sequences at 960 px width.
- [ ] Update `scripts/optimize-images.mjs` (or sibling) to cover `public/assets/frames/` too.
- [ ] README/HANDOFF: drop the "system ffmpeg lacks libwebp" caveat — no longer true.

### Acceptance
- Home page transfers ≤ 12 MB of media (excluding fonts/JS) on a cold load over 4G.
- `out/` ≤ 90 MB (currently 160 MB).
- `useScrollImageSequence` no longer fires `count` parallel image fetches on mount.

### Refs
- `docs/audit/06-asset-budget.md`
- `src/components/motion/useScrollImageSequence.ts:56-69`
- `src/components/sections/home/Hero.tsx:117-124`
- `src/components/sections/home/PlantWalkthrough.tsx:27-33`
- `scripts/optimize-images.mjs`
```
