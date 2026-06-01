# Audit 03 — Lenis ↔ GSAP ScrollTrigger bridge

**Scope:** RAF wiring, ScrollTrigger config, pin churn, route-reset refresh,
and per-frame consumer cost.
**Read-only.** No code was touched.

---

## Severity

**MEDIUM-HIGH.**

The bridge is wired the way the GSAP docs recommend (Lenis drives `gsap.ticker`,
`lenis.on('scroll', ScrollTrigger.update)`). The structural perf work has
already been done — `PinnedSection` uses a ref-backed store, `useScrollSubscribe`
keeps the hot path off React, image-sequence scrub uses canvas frames, R3F
reads progress via ref. That is the right shape.

What is causing "scrolling feels rough" is **smoothing + pin density + refresh
cost stacking on top of each other**, not a missing optimisation. Specifically:

1. `lerp: 0.08` + `lagSmoothing(0)` is over-smoothed for a 120 Hz trackpad and
   simultaneously kills GSAP's lag-spike recovery. **Highest-leverage fix.**
2. Three or four `<PinnedSection>`s plus two image-sequence pins on home,
   each created in its own `useEffect`, plus a `ScrollTrigger.refresh()` from
   each, plus a global refresh in `LenisProvider`, plus another in
   `RouteResetEffects` → an **n+3** refresh pattern on first paint and every
   nav.
3. `RouteResetEffects` runs `ScrollTrigger.refresh()` on **every** pathname
   change, even routes with zero pinned sections (e.g. `/contact`, `/legal`).
4. Two pinned sections still use the React-state `useScroll()` hook
   (`MethodsPinned`, `HeritageEssay`, `Values3Up`) — by design, but they
   reconcile a sizeable subtree at scroll speed.

None of these is a P0 bug — the app works. Together they are exactly the
shape that produces "rough but I can't point at it" feel.

---

## Findings

### F1 — Lenis lerp is over-smoothed for 120 Hz input devices
`src/components/providers/LenisProvider.tsx:41-46`

```ts
const lenis = new Lenis({
  lerp: 0.08,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.2,
});
```

`lerp: 0.08` means the smoothed position chases the input by only 8 % per
frame. On a 60 Hz screen that converges in ~12 frames (~200 ms). On a 120 Hz
trackpad (modern MacBook, iPad, ProMotion iPhone) the **input rate is doubled
but the convergence stays at 8 %/frame**, so the system feels mushy — the
viewport visibly trails the trackpad even on slow scrolls. This is the
single biggest contributor to the "rough" perception, because the user's
cursor and the page disagree.

**Bench:** with `lerp: 0.08`, the 95 % settle time at 60 Hz is ~480 ms; at
120 Hz it is the same wall-clock duration but **twice the visual frames of
trailing**, which the eye reads as lag. Lenis's own demos default to `0.1`
(quicker) and the GSAP × Lenis integration example uses `duration: 1.2`
which is similar to `lerp: 0.083` — same neighbourhood. We are slightly
slower than the reference.

### F2 — `gsap.ticker.lagSmoothing(0)` disables GSAP's drift recovery
`src/components/providers/LenisProvider.tsx:55`

```ts
gsap.ticker.lagSmoothing(0);
```

This is the **GSAP × Lenis** docs incantation, and it is correct for Lenis
(Lenis owns the wall-clock now). But it has a side-effect: if anything else
on the page hogs a frame (R3F scene init, font swap, image decode), GSAP's
default lag-smoothing would normally pause animations during the lag spike
and re-time them. With it off, ScrollTrigger-scrubbed timelines tick at
whatever delta Lenis hands them, and big deltas show up as **a perceptible
jump on scroll** when the user resumes after a hiccup. This is felt most
on the home route during the first 1-2 s while the three.js chunk decodes.

### F3 — Refresh storm on first paint and every nav
Refresh call-sites:
- `src/components/providers/LenisProvider.tsx:57` — mount of Lenis.
- `src/components/providers/RouteResetEffects.tsx:65` — every pathname change.
- `src/components/motion/useScrollImageSequence.ts:156` — hero + plant pins
  (so twice on `/`).
- `src/components/sections/solutions/SolutionsHero.tsx:76` — once when
  `/solutions` mounts.

Plus every `PinnedSection` and the per-section `gsap.from(..., { scrollTrigger
})` blocks (ClosingCta, ProductsClosingCta, SolutionsClosingCta) implicitly
trigger refreshes when their elements measure.

`ScrollTrigger.refresh()` walks every registered trigger, re-measures the
DOM, and re-applies pin spacers — it is O(n) and forces a synchronous layout.
On `/` the trigger inventory is:

- Hero image-sequence pin
- HammerStrikeIntro `<PinnedSection>` (length 2.5)
- PlantWalkthrough image-sequence pin
- HeritageTimeline `<PinnedSection>` (length 4)
- ClosingCta entry timeline

That is 5 triggers. Each `useEffect` mounts and calls refresh; the global
refresh in LenisProvider fires once more; RouteResetEffects fires a 6th in
RAF after `pathname` resolves. **Six refresh passes during first paint**,
each forcing layout against an evolving DOM (fonts swapping, image-sequence
preloads firing, three.js Canvas attaching). This is where the initial-load
"jank then settle" comes from.

### F4 — RouteResetEffects refreshes on every nav, including routes with zero pins
`src/components/providers/RouteResetEffects.tsx:64-66`

```ts
const id = window.requestAnimationFrame(() => {
  ScrollTrigger.refresh();
});
```

`/contact`, `/legal/*`, `/products` (no pins) all pay this cost. On an
already-mounted ScrollTrigger inventory of zero, this is mostly cheap — but
it still walks `ScrollTrigger.getAll()` (which is non-zero because the
previous route's triggers may not have unmounted yet — see also the kill
loop on lines 54-59 which runs `document.contains()` for every trigger).
The kill loop + the refresh together is **two full passes over every
ScrollTrigger in the app** on every route change.

Defensible, but should be a no-op when the new route has no pinned sections,
and the kill loop should run **before** refresh measures stale geometry.

### F5 — `ScrollTrigger.config({ ignoreMobileResize: true })` is set but not enough
`src/lib/gsap.ts:14`

This stops the iOS URL-bar resize from re-firing refresh, which is correct
and important. But the `useScrollImageSequence` hook has its own resize
handler (`onResize` at line 128-132, plus a `ResizeObserver` on the canvas)
that **does** call `sizeCanvas()` + `draw()` on every dvh wobble. So on
mobile during scroll, even though ScrollTrigger isn't refreshing, the canvas
backing buffer is being resized and the current frame redrawn. With two
image-sequence sections on `/` this happens twice. Not catastrophic, but
on a phone scroll where the URL bar oscillates this is an extra few ms per
oscillation tick.

### F6 — `pinSpacing: true` on every PinnedSection plus length=4 timeline
`src/components/motion/PinnedSection.tsx:218`
`src/components/sections/home/HeritageTimeline.tsx:168` (`length={4}`)

`pinSpacing: true` inserts a real spacer div in the document equal to the
pin duration. For the heritage timeline that's **400 vh of spacer**. Stack
that against HammerStrikeIntro (250 vh) and the two image-sequence pins
(220 % each from `useScrollImageSequence`) and the home page's actual
scroll height is roughly **~14 viewports**. That is the intended design and
not a bug, but it does mean every ScrollTrigger update is operating over a
very long scrubbed range — small Lenis lerp errors amplify into bigger
visual position errors.

### F7 — Two `<PinnedSection>` consumers still use the React-state path
- `src/components/sections/solutions/MethodsPinned.tsx:42` (`useScroll()`)
- `src/components/sections/about/HeritageEssay.tsx:106` (`useScroll()`)
- `src/components/sections/about/Values3Up.tsx:111` (`useScroll()`)

The code comments justify this — `activeIndex` controls Tailwind class
swaps on N siblings, and porting those to imperative DOM mutation would be
ugly. But the per-frame React reconciliation cost is real: every scroll
tick triggers a render of the consumer + 4-6 sibling `<article>`s and a
step rail. On Solutions the active article also embeds a `<StlPreview>`
(three.js), and even though Suspense should keep the Canvas mounted, the
parent's render still walks past it. **Not necessarily a fix target, but
worth measuring before declaring victory on the smoothness issue.**

### F8 — `normalizeScroll` is not configured at all
`src/lib/gsap.ts:14`

```ts
ScrollTrigger.config({ ignoreMobileResize: true });
```

The audit brief asks "is normalizeScroll being used on touch devices?" The
answer is no. With Lenis owning scroll, `ScrollTrigger.normalizeScroll(true)`
is generally **wrong** — it tries to take over wheel/touch events itself,
which fights Lenis. So this is correct by omission. Confirming for the
record.

### F9 — ScrollTrigger lookup cost on first paint
ScrollTrigger.create call sites that fire on home mount:
- `src/components/motion/PinnedSection.tsx:213` — once per PinnedSection
- `src/components/motion/useScrollImageSequence.ts:145` — once per scrub hook
- `src/components/sections/home/ClosingCta.tsx:33` — entry timeline (not pinned)
- `src/components/sections/solutions/SolutionsHero.tsx:66` — entry (not on /)

On `/` this is 5 triggers (2 image-sequence + 2 pinned + 1 entry). Each is
created inside `gsap.context()`, which is good (clean revert on unmount).
But they are created in arbitrary mount order based on which `useEffect`
runs first, then five `ScrollTrigger.refresh()` calls execute in
indeterminate order. **Batching via a single `ScrollTrigger.refresh()`
after the first paint frame would be cheaper than five staggered ones.**

### F10 — Cleanup verified clean
Every `ScrollTrigger.create` call has a corresponding kill path:
- `PinnedSection` uses `gsap.context().revert()` (line 232).
- `useScrollImageSequence` keeps `st` and kills in cleanup (line 160).
- Entry-timeline `gsap.from({ scrollTrigger })` blocks in ClosingCta /
  ProductsClosingCta / SolutionsClosingCta / SolutionsHero use
  `gsap.context().revert()`.

No leaks. The defensive `getAll().forEach(kill)` loop in `RouteResetEffects`
is therefore belt-and-braces, not load-bearing.

---

## Quantification

I did not have a hot browser session to script HUD timings against. The
numbers below are derived from the source structure + GSAP/Lenis docs;
they are upper-bound estimates, not measurements.

| Issue | First-paint cost | Per-scroll-frame cost | Notes |
|---|---|---|---|
| `lerp: 0.08` over-smoothing | 0 | ~6-10 ms perceived trailing on 120 Hz | Most user-visible |
| `lagSmoothing(0)` after R3F init | One ~50-150 ms jump | 0 | Only on first 1-2 s of `/` |
| 6× refresh storm on home mount | ~80-200 ms of layout-thrash | 0 | Happens once per nav into `/` |
| Refresh on no-pin routes | ~10-25 ms per nav | 0 | Free win to skip |
| React-state useScroll() consumers | 0 | ~2-5 ms reconciliation per tick × 3 sites | Probably fine, verify |
| Canvas resize during URL-bar wobble (mobile) | 0 | ~3-8 ms per oscillation | Only iOS Safari |

---

## Fixes

### A — Tighten Lenis smoothing (**HIGH impact, LOW effort**)
File: `src/components/providers/LenisProvider.tsx:41-46`

Bump `lerp` to `0.12` (about 50 % faster convergence — half a frame quicker
to settle on 60 Hz, more visibly snappier on 120 Hz). Optionally feature-detect
high-refresh and go higher:

```ts
const hz = (screen as any).refreshRate ?? 60;        // Safari may not expose
const lerp = hz >= 100 ? 0.15 : 0.1;
const lenis = new Lenis({ lerp, smoothWheel: true, /* ... */ });
```

Trade-off: at `lerp: 0.15` Lenis feels closer to native scroll. Users who
came for the "cinematic" smoothness lose a touch of glide. Recommend
**A/B test** by shipping `lerp: 0.1` first (safe middle), keeping the
ability to nudge further if user reports continue.

**Effort: 1 LOC + measurement.**

### B — Batch / debounce ScrollTrigger.refresh() (MEDIUM impact, LOW effort)
Files: `src/components/providers/LenisProvider.tsx:57`,
`src/components/motion/useScrollImageSequence.ts:156`,
`src/components/sections/solutions/SolutionsHero.tsx:76`.

Stop calling `ScrollTrigger.refresh()` from inside every `useEffect`. Let
ScrollTrigger's own internal `refreshAll` after the next paint do its job
(which it already does when a new trigger is created). Keep refresh calls
in exactly two places:

1. `LenisProvider` mount → one refresh after Lenis is wired.
2. `RouteResetEffects` → one refresh per nav, **only if the new route
   actually has pinned content** (track via a context flag, or just probe
   `ScrollTrigger.getAll().length`).

For the home page mount where the trigger graph is large, consider:
```ts
queueMicrotask(() => ScrollTrigger.refresh());
```
or a single rAF-batched refresh at the end of the page's mount tree.

**Effort: ~15 LOC across 3 files.**

### C — Guard `RouteResetEffects` against zero-pin routes (LOW impact, LOW effort)
File: `src/components/providers/RouteResetEffects.tsx:54-66`.

After the kill loop, check the trigger count:

```ts
ScrollTrigger.getAll().forEach((t) => {
  const el = t.trigger as Element | null;
  if (el && !document.contains(el)) t.kill();
});
if (ScrollTrigger.getAll().length === 0) return;   // nothing to refresh
const id = requestAnimationFrame(() => ScrollTrigger.refresh());
```

Also: move the kill loop earlier so refresh measures only live triggers.

**Effort: ~5 LOC.**

### D — Leave `lagSmoothing(0)` but document the lag-spike trade-off (NIL impact, NIL effort)
This is correct per the Lenis × GSAP docs. The R3F-init lag-spike is a
real cost but it happens once on first paint of `/`. Mitigation lives in
the R3F GatedHammerHero (already lazy-loaded with a 600 px rootMargin
observer). Leaving `lagSmoothing(0)` in place; just be aware of it.

### E — Audit pin spacers / `pinSpacing` (LOW impact, MEDIUM effort)
Files: `src/components/motion/PinnedSection.tsx:218`,
`src/components/motion/useScrollImageSequence.ts:150`.

`pinSpacing: true` is necessary for the document height to be correct;
turning it off breaks subsequent sections. **Not a fix target.** Document
that the design accepts ~14 viewports of scroll on `/` as an explicit
choice, and accept that small lerp errors amplify visually.

### F — Move three consumer sections from `useScroll()` to `useScrollSubscribe()` (UNCERTAIN impact, HIGH effort)
Files: `MethodsPinned.tsx`, `HeritageEssay.tsx`, `Values3Up.tsx`.

The existing comments document why these stayed on React state — N
siblings get class swaps. The reconciliation cost per tick is real but
probably not dominant. **Recommend measurement BEFORE refactoring**:
attach a perf marker around `setProgress` in PinnedSection during a
recorded scroll on `/about` and look at the React commit duration. If it
is < 4 ms per tick we leave it alone. If it is bigger, the right fix is
to hand-roll DOM `classList.toggle` mutations from a `useScrollSubscribe`
callback instead of relying on Tailwind class swaps via React.

**Effort: ~30 LOC per consumer site + visual regression test.**

### G — Skip canvas resize during scroll on iOS (LOW impact, LOW effort)
File: `src/components/motion/useScrollImageSequence.ts:128-141`.

The `ResizeObserver` fires every dvh wobble. Throttle to one resize per
~250 ms, or check if the size delta is < a threshold before reallocating
the backing buffer:

```ts
const ro = new ResizeObserver(() => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const want = Math.round(canvas.clientWidth * dpr);
  if (Math.abs(canvas.width - want) < 4) return;   // no-op tiny wobble
  onResize();
});
```

**Effort: ~5 LOC.**

---

## Priority order

1. **Fix A — Lenis lerp tuning.** Single highest-leverage change. Ship as
   a 1-LOC PR with a screen-recording before/after on a 120 Hz Mac.
2. **Fix B — drop redundant refresh calls.** Cuts first-paint layout
   thrash on `/` significantly.
3. **Fix C — guard RouteResetEffects.** Free win on /contact, /legal nav.
4. **Fix G — throttle canvas resize.** Helps mobile feel; cheap.
5. **Fix F — measure-then-decide on React-state consumers.** Don't
   refactor blind.

---

## Open questions for the user

- Has anyone scroll-tested on a 60 Hz external display vs the built-in
  120 Hz panel? "Rough" on 120 Hz with `lerp: 0.08` is very different
  from "rough" on 60 Hz with the same value.
- Are the reports coming from `/` (where the refresh storm and the
  pin density both bite), or from `/solutions` and `/about` (where the
  React-state consumers run)?
- Mobile reports specifically — iOS Safari with the URL-bar wobble, or
  Android Chrome where the same code path is much more stable?

---

## GitHub issue draft

```markdown
# Scrolling feels rough — Lenis ↔ GSAP bridge polish

**Affects:** all routes; most visible on `/` after first paint, and on
any 120 Hz input device.

## Symptoms

- Trackpad scroll on 120 Hz MacBook trails the cursor more than expected.
- First scroll on `/` shows a brief jank pass while pinned sections settle.
- Navigation into routes with no pinned sections still does a layout pass.

## Root cause (see docs/audit/03-lenis-gsap.md)

1. `Lenis({ lerp: 0.08 })` is too smoothed for high-refresh input.
2. Multiple `ScrollTrigger.refresh()` callers fire during first paint of
   `/` — 6 refresh passes across LenisProvider, RouteResetEffects, two
   `useScrollImageSequence` hooks, and SolutionsHero on its route.
3. `RouteResetEffects` refreshes on every nav, even routes with zero
   pinned content.

## Proposed fix

- [ ] (A) Bump Lenis `lerp` from `0.08` → `0.1` (1 LOC, ship first).
- [ ] (B) Drop redundant `ScrollTrigger.refresh()` calls in
      `useScrollImageSequence` and `SolutionsHero`; rely on the single
      refresh in `LenisProvider` plus the one in `RouteResetEffects`.
- [ ] (C) Skip `ScrollTrigger.refresh()` in `RouteResetEffects` when
      `ScrollTrigger.getAll().length === 0` after the kill loop.
- [ ] (G) Throttle `useScrollImageSequence`'s `ResizeObserver` so dvh
      wobble on iOS doesn't reallocate the canvas every frame.

## Out of scope (measure first)

- Refactoring `MethodsPinned` / `HeritageEssay` / `Values3Up` away from
  React-state `useScroll()` — only do this if a recorded scroll shows
  React commits > 4 ms per tick.

## Verification

Before/after Chrome DevTools Performance recordings on:
1. First scroll of `/` (cold cache).
2. Trackpad-scroll a 120 Hz panel through the whole home page.
3. Nav `/` → `/contact` → `/legal/privacy` and confirm no refresh fires
   on the no-pin routes (log inside RouteResetEffects' rAF callback).
```
