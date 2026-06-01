# Audit 01 — Image-Sequence Frame Preload

**Scope:** `useScrollImageSequence` and its two consumers on `/` (Hero, PlantWalkthrough).
**Date:** 2026-06-01
**Status:** Read-only audit, no edits applied.

---

## SEVERITY: HIGH

The hook eagerly preloads **136 JPGs (~33.24 MB encoded, ~570 MB decoded RGBA in RAM)** as soon as Hero and PlantWalkthrough mount — both mount on the very first render of `/`. The Plant sequence alone is **15.36 MB across 90 files** and is not visually needed until the user has scrolled ~6 viewport-heights past the fold (it sits below Hero → HammerStrikeIntro → MaterialsGrid). All 136 image requests are fired in a single synchronous `for` loop with no concurrency limit, saturating the connection during the most fragile moment of page load: while fonts, the main JS bundle (with the three.js chunk lazy-loaded for HammerStrikeIntro), the hero poster, and critical CSS are all competing for the same sockets. On HTTP/1.1 origins this is immediately throttled to 6 parallel; on HTTP/2 the multiplex still drains bandwidth and stalls the hero's own first-frame decode. On mid-tier mobile (Moto G class, 4G ~10 Mbps) the 33 MB image dump takes ~26 s to land — which is why scrolling "feels rough": the first scroll input has no frames to draw against, so the canvas snaps from poster → frame 0 → late frames as they arrive in random order. This is the dominant performance problem on the page; rough-scroll perception is a *symptom* of starved decode, not GSAP scrub config.

---

## Findings

### F1 — Eager preload of off-screen sequence (root cause)
- `src/components/sections/home/PlantWalkthrough.tsx:27-33` — `useScrollImageSequence` is called unconditionally inside the component body, so all 90 plant frames begin downloading the instant the homepage renders.
- `src/app/page.tsx:46` — `<PlantWalkthrough />` is rendered as the **4th** section in the homepage. With 100dvh sections above it (Hero, HammerStrikeIntro at length 2.5, MaterialsGrid), the plant section's first frame is roughly **~6 viewport-heights below the fold** at first paint and not visible until the user has scrolled significantly.
- **Bytes downloaded before Plant section is visible: 15.36 MB** (90 plant JPGs averaging 175 KB), in addition to the 17.88 MB of hero frames.

### F2 — Unbounded parallel `new Image()` saturating the network
- `src/components/motion/useScrollImageSequence.ts:55-69` — the preload is a single synchronous `for (let i = 0; i < count; i += 1)` loop that constructs `count` `Image()` objects and assigns `.src` immediately. No concurrency limit, no priority hinting, no `fetchpriority='low'`.
- With both consumers mounted, **136 simultaneous image fetches** kick off in the first frame after hydration. On HTTP/2 (Tailscale → Nginx? unknown — but assume modern) the browser opens streams up to its per-origin cap (~100 in Chromium) and immediately starts decode contention on the rasterizer thread.
- Result: the *hero* frames 0–10 (the ones the user actually needs immediately) compete for sockets and decode time with plant frames 50–90 (which won't be drawn for >5 s after first scroll). First-paint of `f-001.jpg` on the hero canvas is delayed.

### F3 — `decode()` is never awaited
- `src/components/motion/useScrollImageSequence.ts:60` — `img.decoding = 'async'` is a hint, not a contract. With no explicit `await img.decode()`, the first `drawImage(img, …)` call on each frame triggers a synchronous main-thread decode at draw time. On a 1920×1080 JPG, that is a ~10–25 ms hit per *novel* frame — which lands inside the scroll-driven `onUpdate` callback at `useScrollImageSequence.ts:152-154`, i.e. on the scroll tick that needs to be ≤8 ms to feel smooth.
- The `onload` handler is only wired for `i === 0` (line 62-67); every other frame's load + decode completion is fire-and-forget. The hook has no way to know which frames are ready to draw cheaply.

### F4 — Frames are oversized for typical viewport
- Hero frames: **1920×1080**, avg **398 KB**, total **17.88 MB** (`file` output confirmed at `f-001.jpg`).
- Plant frames: **1280×720**, avg **175 KB**, total **15.36 MB**.
- Median mobile viewport (~390 CSS px × 2 DPR = 780 device px) only needs ~960×540 source. Serving 1920×1080 to a 390-px iPhone is **~4× over-fetched** on bytes and **~4× over-decoded** on raster.

### F5 — No `lastDrawn`-aware progress draw guard
- `src/components/motion/useScrollImageSequence.ts:152-154` — `onUpdate` calls `draw(Math.round(self.progress * (count - 1)))` every tick. If the target frame is undecoded, `draw()` falls back to `lastDrawn` (line 96-100) — so during the long preload window, scroll progresses but the canvas freezes on whatever frame happened to land first. **This is the visible "rough scroll" symptom.**

### F6 — `firstLoaded` is dead code
- `src/components/motion/useScrollImageSequence.ts:57, 70` — `firstLoaded` is set in the `onload` and immediately discarded via `void firstLoaded;`. Harmless but indicates the original intent (gate on first frame) was abandoned.

---

## Recommended fixes (ranked by impact)

### Fix A — Gate Plant preload behind IntersectionObserver  *[HIGHEST IMPACT]*
**What:** Wrap `<PlantWalkthrough>`'s `useScrollImageSequence` call so it only fires once the section enters a ~200vh-prefetch zone of the viewport. Mirror the `GatedHammerHero` pattern already proven in `HammerStrikeIntro.tsx:31-72` (which gates a 890 KB three.js chunk the same way).
**Where:** `src/components/sections/home/PlantWalkthrough.tsx` — introduce a `Gated` inner component that renders the canvas + bg always (layout stable) but only mounts the hook once `isIntersecting` with `rootMargin: '200%'` (i.e. ~2 viewports above).
**Effort:** S (1–2 hr; close to a copy of `GatedHammerHero`).
**Impact:** Removes **15.36 MB / 90 requests** from initial-paint network budget. On 4G this gives the Hero sequence ~12 s less contention and TTI drops accordingly. First-scroll feel on Hero goes from "frozen / snappy" to "smooth" because the hero frames finish decoding before the user reaches them.

### Fix B — Bounded-concurrency decode pipeline in the hook  *[HIGH IMPACT, GENERIC]*
**What:** Replace the unconditional `for` loop in `useScrollImageSequence.ts:58-69` with a small queue:
  1. Load + `await img.decode()` for the **first 8 frames immediately and sequentially** (these are what the user needs in the first ~1 s of scroll).
  2. Then fan out the rest with **max 4–6 concurrent** `decode()`-aware loads.
  3. Use `img.decode().then(...)` rather than `img.onload` so frames are guaranteed raster-ready at first `drawImage`.
**Where:** `src/components/motion/useScrollImageSequence.ts:55-69` (the preload block).
**Effort:** M (3–4 hr — needs a small `pLimit`-style helper + cleanup on unmount + the queue to abort when the effect re-runs).
**Impact:** Hero first-frame paint stops fighting with frames 30–46 for sockets. Per-tick `draw()` cost drops because frames are already decoded — eliminates the main-thread decode spikes that show up as scroll jank on lower-end devices. Combined with Fix A, this is the single change that will most affect perceived smoothness.

### Fix C — Responsive frame variants (mobile/desktop split)  *[HIGH IMPACT, HIGH EFFORT]*
**What:** Generate a smaller set per sequence:
  - `hero/sm/f-*.jpg` at **960×540** (~100 KB × 46 = ~4.6 MB)
  - `plant/sm/f-*.jpg` at **640×360** (~45 KB × 90 = ~4.0 MB)
Pick at runtime by reading `window.innerWidth` (and DPR) inside the hook's `src` callback, or by accepting `src: (i, variant) => string` and resolving in the consumer. Use `<= 768px` viewport → small set.
**Where:**
  - New ffmpeg/build step (likely a script under `scripts/` that emits `sm/` variants from the source MP4).
  - `src/components/motion/useScrollImageSequence.ts` — extend `src` signature or accept a `variants` array.
  - `src/components/sections/home/Hero.tsx:121-122` and `PlantWalkthrough.tsx:20-21` — supply both variants.
**Effort:** L (1 day — script, build wiring, ensuring the canvas cover-fit math still works at lower resolution, regenerating frames and committing them).
**Impact:** Mobile users (probably **>60%** of traffic for an industrial B2B site arriving via WhatsApp shares and LinkedIn) download **~8.6 MB instead of 33 MB** — a **74% reduction**. Decode time also drops ~4× since raster cost scales with pixels.

### Fix D — Explicit `img.decode()` even without batching  *[CHEAP, MARGINAL]*
**What:** Even without Fix B's queue, at minimum change `img.onload` → `await img.decode()` for the first frame, and call `.decode()` (fire-and-forget) on the rest so the browser schedules decode off-main-thread.
**Where:** `src/components/motion/useScrollImageSequence.ts:60-67`.
**Effort:** S (15 min).
**Impact:** Smaller — most modern browsers already decode async with `decoding='async'`. But it eliminates the worst-case "decode-at-drawImage" stall and removes the `firstLoaded` dead code while we're there.

### Fix E (defensive) — Add a `priority` / `start-loading` prop to the hook
**What:** Pass `{ deferUntilVisible: true }` as a hook option so consumers can opt into Fix A behavior without each rebuilding the IntersectionObserver wrapper. Default `false` so Hero behavior is unchanged.
**Where:** `src/components/motion/useScrollImageSequence.ts` — add the option, run the preload effect from a state flag toggled by an internal IO on `sectionRef.current`.
**Effort:** M.
**Impact:** Makes Fix A a one-liner at the consumer; future sequences (e.g. an Act 06 sequence if added) get the same treatment for free.

---

## Recommended order of operations

1. **Fix A** (gate Plant) — biggest delta for least risk, ships today.
2. **Fix D** (explicit decode) — bundle with A as one PR, tiny diff.
3. **Fix B** (bounded queue) — next PR, also benefits Hero.
4. **Fix C** (responsive variants) — schedule as a build-tooling task; biggest mobile win but needs frame regeneration.

After A+B, expect the user complaint ("rough scrolling, slow") to be resolved on desktop. C closes the gap on mobile.

---

## GH issue draft

```
Title: perf(home): defer Plant frame preload + cap hero decode concurrency

Body:
## Problem
The homepage eagerly preloads 136 JPGs (33.2 MB) on first render via
`useScrollImageSequence`: 46 hero frames (17.9 MB, 1920×1080) and 90 plant
frames (15.4 MB, 1280×720). The Plant sequence is the 4th section on the
page — not visible until the user has scrolled ~6 viewports — yet its
frames start downloading the moment the page hydrates. All 136 requests
fan out in a single unbounded `for` loop in `useScrollImageSequence.ts`,
saturating the connection and starving the hero's own first-frame
decode. Reported as "scrolling feels rough, site feels slow".

Severity: **High**. On 4G mobile (~10 Mbps) the 33 MB image dump takes
~26 s, so the user's first scroll lands on undecoded frames and the
canvas freezes on whatever frame happened to land first. See
`docs/audit/01-frame-preload.md` for the full breakdown.

## Fix
Three changes, ranked by impact:

1. **Gate Plant preload behind IntersectionObserver** (Fix A in the audit)
   — mirror the `GatedHammerHero` pattern in `HammerStrikeIntro.tsx`.
   Mount the `useScrollImageSequence` call only when the Plant section is
   within ~200vh of the viewport. Removes 15.4 MB / 90 requests from the
   first-paint network budget.

2. **Bounded-concurrency decode pipeline** (Fix B) — replace the
   unconditional `for` loop at `useScrollImageSequence.ts:58-69` with:
   load + `await img.decode()` for the first 8 frames immediately, then
   max 4–6 concurrent `decode()`-aware loads for the rest. Eliminates
   per-tick decode stalls in the scroll `onUpdate`.

3. **Explicit `img.decode()`** (Fix D) — even without (2), at minimum
   replace the bare `img.src = …; img.onload` pattern with
   `img.decode().then(…)` so the browser schedules decode off the main
   thread. Removes the `void firstLoaded;` dead code while we're there.

A follow-up issue should track responsive frame variants
(Fix C — 960×540 hero / 640×360 plant for ≤768 px viewports), worth a
~74% byte saving for mobile but needs a build step.

## Files
- `src/components/motion/useScrollImageSequence.ts:55-69` (preload loop)
- `src/components/sections/home/PlantWalkthrough.tsx:27-33` (consumer)
- `src/components/sections/home/HammerStrikeIntro.tsx:31-72` (reference pattern)

## Acceptance
- [ ] Plant frame network requests do not fire until the user scrolls past
      HammerStrikeIntro.
- [ ] Hero first-frame paint no longer waits behind plant frame downloads
      (verify in DevTools waterfall).
- [ ] `useScrollImageSequence` caps concurrent `decode()` at ≤6.
- [ ] No regression in `prefers-reduced-motion` path (single static frame,
      no pin).
- [ ] No regression in canvas cover-fit on resize / DPR change.
```
