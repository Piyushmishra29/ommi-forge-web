# Audit 04 — Pin Count & Scroll Length

> Read-only audit. No code changed. Quantifies the cost of pinned ScrollTriggers
> on `/` and proposes containment + structural fixes to reduce paint/layout
> per scroll event.

## Severity

**HIGH (desktop) · MEDIUM (mobile).** The home page composes **4 pin
instances on desktop** (Hero, Hammer, Plant, Heritage) producing a combined
**~10.8× viewport-height of scroll length** on top of the ~9 unpinned
sections. Each pin instantiates a `pin-spacer` wrapper that GSAP mutates on
every ScrollTrigger tick; `HeritageTimeline` alone holds **400vh of pinned
scroll** and could be expressed as plain CSS sticky. Combined with Lenis
smoothing (`lerp: 0.08`) the desktop page commits a layout/paint per RAF
across the whole pinned chain.

Mobile is already de-risked: `useStaticPins()` swaps `HammerStrikeIntro` and
`HeritageTimeline` to static layouts, so only the two image-sequence pins
(Hero + Plant) survive — that target was hit and should be preserved.

## Pin Inventory

| # | Section | Component | Pin mechanism | `end` | Pin length (vh) | Desktop | Mobile |
|---|---------|-----------|---------------|-------|-----------------|---------|--------|
| 1 | Act 00 — Hero | `Hero.tsx` | `useScrollImageSequence` → `ScrollTrigger.create({ pin: true })` | `+=220%` | 220 | YES | YES |
| 2 | Act 01 — Hammer | `HammerStrikeIntro.tsx` | `<PinnedSection length={2.5}>` → `pin: inner`, `end: +=window.innerHeight * 2.5` | `+=250%` | 250 | YES | no (static fallback) |
| — | Act 02 — Materials | `MaterialsGrid.tsx` | no pin (CSS scroll-snap on `lg:`) | — | 0 | no | no |
| 3 | Act 03 — Plant | `PlantWalkthrough.tsx` | `useScrollImageSequence` → `ScrollTrigger.create({ pin: true })` | `+=220%` | 220 | YES | YES |
| — | Act — Stats | `StatsCounter.tsx` | no pin | — | 0 | no | no |
| — | Act 04 — Products | `ProductsMarquee.tsx` | no pin (GSAP `xPercent` tween) | — | 0 | no | no |
| 4 | Act 05 — Heritage | `HeritageTimeline.tsx` | `<PinnedSection length={4}>` → `pin: inner`, `end: +=window.innerHeight * 4` | `+=400%` | 400 | YES | no (static fallback) |
| — | Find us | `Location.tsx` | no pin | — | 0 | no | no |
| — | Closing CTA | `ClosingCta.tsx` | no pin (one-off `scrollTrigger.once`) | — | 0 | no | no |

**Totals**
- Desktop: **4 pins, ~1090vh of pinned scroll** on top of ~900–1100vh of
  unpinned content. The full document is roughly **~20× viewport height** of
  scroll travel.
- Mobile: **2 pins, ~440vh of pinned scroll** (Hero 220 + Plant 220).
  HammerStatic + StaticList eliminate the heavy two.

## Findings

### F1 — `HeritageTimeline` is a 400vh pin for a horizontal translate
**File:** `src/components/sections/home/HeritageTimeline.tsx:163-172`
**Mechanism:** `<PinnedSection length={4}>` wraps `<TimelineTrack>`; on every
ScrollTrigger tick the inner `quickSetter` writes a single `transform: translateX(-px)`
on `trackRef`. The pin exists only to convert vertical scroll into horizontal
translation — the work being done per tick is one `style.transform` write.

The cost of the pin itself (pin-spacer wrap, GSAP `_refreshAll` math, layout
invalidation on resize) is paying for a `position: sticky` + scroll-driven
animation pattern that the browser can do natively. ScrollTrigger.create with
pinSpacing inserts an extra DOM node 400vh tall and forces ScrollTrigger to
recompute on every layout reflow.

### F2 — `length={2.5}` Hammer pin + R3F canvas under the pin-spacer
**File:** `src/components/sections/home/HammerStrikeIntro.tsx:247`
**Mechanism:** 250vh pin holds the R3F Hammer canvas inert while progress
drives `wordRefs` opacity/translateY and (at p>0.95) a flash timeline. The
hot path is already ref-based (good — see `useScrollSubscribe`), but the
canvas + pin-spacer + `position: fixed` swap by ScrollTrigger means every
resize forces a WebGL canvas resize through the `IntersectionObserver`.
The `setRefAndObserve` callback disconnects on first intersection
(`HammerStrikeIntro.tsx:39-65`), so the observer cannot re-fire when the
section re-enters; the R3F canvas remains mounted for the lifetime of the
section — correct behaviour, but it also means the canvas survives unmount
of the pin only via `ctx.revert()` in `PinnedSection.tsx:232`.

### F3 — Two `useScrollImageSequence` pins draw to canvas inside the pin path
**Files:** `src/components/sections/home/Hero.tsx:117-124`,
`src/components/sections/home/PlantWalkthrough.tsx:27-33`
**Mechanism:** each section installs its own `ScrollTrigger.create({ pin: true, scrub: 0.5 })`
inside the hook (`useScrollImageSequence.ts:144-156`) and draws a JPG frame
to canvas on `onUpdate`. Drawing is cheap; the pin-spacer cost is not.
Both hooks also subscribe a `ResizeObserver` to the canvas — when the pin
flips between fixed/static around boundary scroll, the observer fires a
redraw. On desktop, both pin lengths are `+=220%` (220vh each = **440vh
combined just for the two image sequences**).

### F4 — No CSS containment on pinned sections
**Files:** all four pinned sections.
None of the pinned sections set `contain: layout style paint`. With Lenis
smoothing scroll, every paint cost on a pinned section is multiplied by the
number of frames the smoothing produces between two raw wheel events. The
browser cannot scope invalidation to the pinned subtree without an explicit
contain hint.

`src/app/globals.css` has no `contain:` declarations (only an unrelated
`overscroll-behavior: contain` at line 154).

### F5 — `will-change: transform` is set on the Heritage track but not pin-spacers
**File:** `src/components/sections/home/HeritageTimeline.tsx:94`
The track has `style={{ willChange: 'transform' }}` — correct. The
ProductsMarquee track is the same (line 92 of `ProductsMarquee.tsx`).
GSAP-generated pin-spacers do not carry `will-change`, so the layer the
pinned content rides on top of is created/destroyed by the pin lifecycle
rather than being a stable composited layer. That's normal GSAP behaviour
but contributes to per-tick paint cost on pin start/end.

### F6 — Mobile keeps Hero `+=220%`
**File:** `src/components/sections/home/Hero.tsx:124`
The image sequence pin length is the same on mobile as desktop (220vh /
~2.2 screens). On a 6.1" phone that's ~3300 px of scroll to clear the
hero. The frame count (46) is fine; the pin length is the question.
Brand mandate is "cinematic", so this is intentional, but it is the single
biggest contributor to "rough scrolling" complaints on phones because the
canvas redraw runs while Lenis-on-mobile is still smoothing. We should
consider `+=140%` on mobile (matches a comfortable scroll-flick travel
without trimming frames).

### F7 — `useScrollImageSequence` calls `ScrollTrigger.refresh()` after creating its trigger
**File:** `src/components/motion/useScrollImageSequence.ts:156`
A `refresh()` inside the hook fires a global recalculation across all
ScrollTriggers on the page. Two image-sequence sections mounted at the
same time = two full refreshes during initial mount. `RouteResetEffects`
already runs `ScrollTrigger.refresh()` after route change. The per-hook
refresh is redundant on initial mount and increases time-to-interactive.

### F8 — Two `ResizeObserver`s + `window.addEventListener('resize')` per image sequence
**File:** `src/components/motion/useScrollImageSequence.ts:128-141`
Cheap, but worth noting: every frame-decoded sequence registers both a
window resize listener AND a `ResizeObserver` on the canvas. The
`ResizeObserver` fires once during pin transition because the pin-spacer
re-wraps the section. Redrawing in response is correct (keeps the canvas
sharp); the cost is that pin-start triggers an extra paint vs. a non-pinned
sequence would.

## Proposed Fixes

| ID | Fix | Effort | Impact | Risk |
|----|-----|--------|--------|------|
| A | Add `contain: layout style paint` to each pinned section (and `content-visibility: auto` on offscreen non-pinned sections like Stats/Location). | XS | MEDIUM — measurable paint reduction on Lenis-smoothed ticks. | Low. `paint` containment clips overflow; verify no decorative element bleeds outside the section box. |
| B | Convert `HeritageTimeline` desktop variant from `<PinnedSection length={4}>` to a `position: sticky` viewport + CSS scroll-driven animation (`animation-timeline: view()` or a `scroll()`-driven transform). Falls back to existing GSAP path on browsers without the API (Safari < 18). | M | HIGH — kills the heaviest pin on the page (400vh) and removes one ScrollTrigger from the global recalc graph. | Medium. CSS scroll-driven animations are still patchy in Safari; need progressive enhancement. |
| B′ | Cheaper variant of B: keep the GSAP path but reduce `length` from `4` to `2.5–3` so the track moves faster. 6 milestones × 60vw ≈ 360vw of horizontal travel; current `length={4}` over-scrolls. | XS | LOW–MEDIUM — fewer wasted vh, no behavioural change. | Low. |
| C | Shorten Hero pin on mobile to `+=140%` (a media query inside `useScrollImageSequence` or a prop). Desktop stays `+=220%`. | XS | MEDIUM on mobile — gets users to content ~35% faster, reduces total mobile scroll length by ~80vh. | Low. Verify frame indexing still hits 0…45 across the shorter range (it does — index = round(progress × (count−1))). |
| D | Move the per-hook `ScrollTrigger.refresh()` (line 156 of `useScrollImageSequence.ts`) to a single batched refresh in `RouteResetEffects` (already there) — drop the in-hook call. | XS | LOW — TTI shave during home-page mount. | Low. |
| E | Reduce `HammerStrikeIntro` pin length from `2.5` to `2.0`. The progress→opacity windows (0–0.33, 0.2–0.66, 0.55–1.0) and flash trigger (p>0.95) still resolve correctly with less scroll travel. | XS | LOW — saves 50vh. | Low. Tune by feel; brand cinema mandate may say no. |
| F | DO NOT add `will-change: transform` to GSAP pin-spacers. They are created/destroyed by GSAP and adding will-change would leak GPU layers across pin lifecycle. Leave as-is. | — | — | — |

Recommended sequence: **A + D + C** (XS effort, instant wins) → measure →
then evaluate **B′** before doing the larger B refactor.

## GitHub Issue Draft

```
title: perf(home): reduce pin/paint cost on desktop scroll path

body:

Home page composes 4 pinned ScrollTriggers on desktop totalling ~1090vh of
pinned scroll on top of ~1000vh of unpinned content. Combined with Lenis
smoothing this commits a paint per RAF across the entire pinned chain and
is the most likely cause of the "rough scrolling" complaint.

Pin inventory (desktop):
- Hero (image sequence)             — 220vh   src/components/sections/home/Hero.tsx:117
- HammerStrikeIntro (PinnedSection) — 250vh   src/components/sections/home/HammerStrikeIntro.tsx:247
- PlantWalkthrough (image sequence) — 220vh   src/components/sections/home/PlantWalkthrough.tsx:27
- HeritageTimeline (PinnedSection)  — 400vh   src/components/sections/home/HeritageTimeline.tsx:168

Mobile is already reduced to 2 pins (Hero + Plant) via useStaticPins(), but
hero pin length is still +=220% on mobile.

Proposed (in order of effort):

- [ ] Add `contain: layout style paint` to each pinned section wrapper.
- [ ] Add `content-visibility: auto` to offscreen non-pinned sections
      (StatsCounter, Location, ClosingCta) to defer their paint.
- [ ] Drop the per-hook `ScrollTrigger.refresh()` inside useScrollImageSequence
      — `RouteResetEffects` already refreshes after mount.
      File: src/components/motion/useScrollImageSequence.ts:156
- [ ] Shorten Hero pin on mobile only: +=140% on `(max-width: 767px)`,
      keep +=220% on desktop.
- [ ] Trim HeritageTimeline `length` from 4 → 2.5 (track measured at
      scrollWidth − innerWidth so milestone alignment is unaffected).
- [ ] Evaluate converting HeritageTimeline desktop variant to
      `position: sticky` + CSS-only `transform` driven by scroll, removing
      one ScrollTrigger from the page entirely.

Acceptance: home page total document height drops by ≥ 500vh and DevTools
Performance shows a flat (single composited layer) main-thread track over
the pinned chain on a slow scroll-flick.

References:
- docs/audit/04-pin-count.md
```
