# 08 — React Render Cost Audit

**Date:** 2026-06-01
**Scope:** React reconciliation cost during scroll/pointer paths. Hook stability, `'use client'` boundaries, state-vs-ref decisions.
**Verdict:** **Severity — LOW-MEDIUM.** The hot scroll path is genuinely ref-backed (PinnedSection + R3F + image sequences). The big historical foot-gun ("`useState` driving every ScrollTrigger tick") has already been retired and is documented in `PinnedSection.tsx:18-41`. What remains is a small set of **medium-impact** issues — one per-scroll React state update in `Header`, a per-render array re-build in `ProductsMarquee`, an inline ref-callback that re-runs on every render in `HammerStrikeIntro`, and a couple of micro-optimisations on leaf cards.

No single fire to put out. This is "polish the cold edges" tier — worth doing, but the site is not slow because of React renders.

---

## 1 · Hot-path component inventory

Components live-mounted on the home page (top → bottom of scroll), with their per-frame React-state cost noted:

| Component | File | Per-frame React state? | Notes |
|---|---|---|---|
| `MagneticCursor` (root layout) | `src/components/motion/MagneticCursor.tsx` | **No** — uses `useMotionValue` + `useSpring`; only `setLabel` on hover transition (event-rate, not frame-rate). | Clean. |
| `Header` (root layout) | `src/components/ui/Header.tsx` | **YES — `setProgress` on every scroll event.** | See finding F-01. |
| `PageTransition` (root layout) | `src/components/motion/PageTransition.tsx` | No — only on pathname change. | Clean. |
| `LenisProvider` (root layout) | `src/components/providers/LenisProvider.tsx` | No — singleton effect, no state. | Clean. |
| `RouteResetEffects` (root layout) | `src/components/providers/RouteResetEffects.tsx` | No — pathname-keyed effect. | Clean. |
| `Hero` | `src/components/sections/home/Hero.tsx` | No — image-sequence scrub on canvas via hook. | `AudioPulseBars` runs a RAF loop that writes SVG attrs imperatively — no React state. Clean. |
| `HammerStrikeIntro` → `HammerInner` | `src/components/sections/home/HammerStrikeIntro.tsx` | No — `useScrollSubscribe` writes directly to `wordRefs.current[i].style`. | Refs forwarded into R3F → no React reconciliation per frame. See F-02 (cold-render inline `ref={(node) => …}`). |
| `HammerStrikeIntro` → `GatedHammerHero` | same file | No — once-only `setInView(true)` on intersection. | Clean. |
| `MaterialsGrid` → `FlipCard` (×4) | `src/components/sections/home/MaterialsGrid.tsx` | Only on hover/focus/click — event-rate. | Clean. See F-04 for a minor refinement. |
| `PlantWalkthrough` | `src/components/sections/home/PlantWalkthrough.tsx` | No — image-sequence on canvas. | Clean. |
| `StatsCounter` → `NumberCounter` (×4) | `src/components/ui/NumberCounter.tsx` | No — `useMotionValue` + `useTransform`; text node updated outside React. | Clean. |
| `ProductsMarquee` → `MarqueeRow` (×2) | `src/components/sections/home/ProductsMarquee.tsx` | No — GSAP tween on a ref. | See F-03 (per-render `buildTiles()` + 28 doubled `<ProductTile>`s carry per-instance `useState`). |
| `HeritageTimeline` → `TimelineTrack` | `src/components/sections/home/HeritageTimeline.tsx` | No — `gsap.quickSetter` from `useScrollSubscribe`. | Clean. |
| `Location` | `src/components/sections/home/Location.tsx` | N/A — pure server component. | Clean. |
| `ClosingCta` | `src/components/sections/home/ClosingCta.tsx` | No — GSAP `scrollTrigger.once: true`. | Clean. |

**Headline:** the scroll-driven render path has already been hardened. The only component that re-renders on every scroll tick is `Header`, and it only re-renders **itself** (no children depend on its state).

---

## 2 · Findings

### F-01 — `Header` runs a `setState` on every scroll event (per-tick re-render of the header)
**File:** `src/components/ui/Header.tsx:31-67`
**Severity:** MEDIUM
**Impact:** Each Lenis scroll event (≤60 Hz) calls `setScrolled(...)` + `setProgress(...)`. Because Lenis drives `ScrollTrigger.update`, the same RAF tick that updates the scrubbed hero/plant canvases also triggers a header re-render. The header's render itself is cheap (a handful of `<Link>`s + an `AnimatePresence` that is closed 99% of the time), but it's the **only** component on the page that still has React state on the scroll hot path.

Concretely:

```ts
// src/components/ui/Header.tsx:55-67
useEffect(() => {
  …
  const onScroll = () => {
    …
    setScrolled(scrollTop > 100);                 // boolean — flips at most twice per session
    setProgress(max > 0 ? Math.min(1, …) : 0);    // number — changes EVERY tick
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}, []);
```

`progress` then drives an inline `style={{ transform: \`scaleX(${progress})\` }}` on the hairline (`Header.tsx:222-227`). React reconciles the whole `<header>` subtree to write one transform string into a 2px-tall `<div>`.

**Fix:** Hold `progress` in a `useRef` and write `scaleX` directly to the hairline DOM node from inside `onScroll`. Keep `scrolled` as state — it's a boolean that genuinely needs to drive the bg-graphite class swap.

```ts
const progressBarRef = useRef<HTMLDivElement | null>(null);
…
const onScroll = () => {
  const scrollTop = window.scrollY || doc.scrollTop;
  const max = doc.scrollHeight - doc.clientHeight;
  setScrolled(scrollTop > 100); // still state — class swap
  const p = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
  const bar = progressBarRef.current;
  if (bar) bar.style.transform = `scaleX(${p})`;
};
```

**Effort:** 5 min. **Impact:** removes ~60 header renders per scroll-second.

---

### F-02 — `HammerStrikeIntro`: inline `ref` callback re-runs every render on the cross-fading word spans
**File:** `src/components/sections/home/HammerStrikeIntro.tsx:188-207`
**Severity:** LOW
**Impact:** This is a cold-path issue (the parent only re-renders on prop/context changes, not per scroll tick), but it's worth noting:

```tsx
{HAMMER_INTRO_WORDS.map((word, i) => (
  <span
    key={word}
    aria-hidden
    ref={(node) => {                          // ← new function every render
      wordRefs.current[i] = node;
    }}
    …
  />
))}
```

React 18+ treats a changing ref callback as "unmount-and-remount the ref" — it calls the old one with `null` and the new one with the node. For 3 spans this is harmless but stylistically incorrect (`wordRefs.current` is briefly nulled on every parent render, which would matter the moment the parent ever did re-render mid-scroll).

**Fix:** Use a stable curried setter:
```ts
const setWordRef = useCallback(
  (i: number) => (node: HTMLSpanElement | null) => { wordRefs.current[i] = node; },
  [],
);
// then: ref={setWordRef(i)}
```
…or accept that the parent only renders once and leave it.

**Effort:** 2 min. **Impact:** Negligible today; future-proofing.

---

### F-03 — `ProductsMarquee` rebuilds the tiles array + remounts 28 `<ProductTile>`s on every parent render
**File:** `src/components/sections/home/ProductsMarquee.tsx:142-145, 79`
**Severity:** LOW-MEDIUM
**Impact:** Two issues stacked:

```ts
// src/components/sections/home/ProductsMarquee.tsx:142-145
export default function ProductsMarquee() {
  const reduced = useReducedMotion() ?? false;
  const { top, bottom } = buildTiles();          // ← rebuilt every render
  …
}
```
and inside `MarqueeRow`:
```tsx
const items = [...tiles, ...tiles];              // line 79 — new array every render
…
{items.map((tile, i) => (
  <ProductTile key={`${tile.name}-${i}`} tile={tile} />
))}
```

`<ProductTile>` carries its own `useState(imageOk)`. If the marquee ever re-renders (e.g. `useReducedMotion` flipping after hydration), the keys are stable so React reuses the DOM, but the `tile` prop is a fresh object every time — so any future `React.memo(ProductTile)` would be defeated by the new object identity. More importantly, the doubled `[...tiles, ...tiles]` ships 28 React components on a page that only needs 14 unique tiles' worth of state.

**Fix:**
1. Memoise `buildTiles()` at module scope (it has no inputs):
   ```ts
   const TILES = buildTiles();
   ```
2. Memoise the doubled array inside `MarqueeRow`:
   ```ts
   const items = useMemo(() => [...tiles, ...tiles], [tiles]);
   ```
3. Wrap `ProductTile` in `React.memo` (it's a pure function of `tile.src` + `tile.name`).

**Effort:** 5 min. **Impact:** Removes 28 component instances' worth of reconciliation noise on the first hydration tick and any future state-driven re-render.

---

### F-04 — `MaterialsGrid` `BackFace` re-computes `flatGrades(m)` on every render
**File:** `src/components/sections/home/MaterialsGrid.tsx:57-90`
**Severity:** LOW
**Impact:** Every time a card flips (hover/focus/click → `setFlipped`), both `<FrontFace>` and `<BackFace>` re-render (they're children of the animating `<motion.div>`). `flatGrades` walks the families, splits CSVs, dedupes via `Set`. Trivial cost but it runs on every hover transition — multiply by 4 cards × however many hover events.

**Fix:** Either:
- Hoist `flatGrades(m)` to module scope and pre-compute a Map `{ slug → grades[] }` at import time, OR
- `useMemo(() => flatGrades(m), [m])` inside `BackFace`.

The first is strictly better since `MATERIALS` is a static import.

**Effort:** 3 min. **Impact:** Removes 4 array-build + dedupe passes per card flip.

---

### F-05 — `Hero` does NOT pass `reduced` as a stable identity to `<AudioPulseBars>`
**File:** `src/components/sections/home/Hero.tsx:54, 257`
**Severity:** TRIVIAL
**Impact:** `<AudioPulseBars reduced={reduced} />` — `reduced` is a boolean (primitive), so React's bailout works fine. No actual issue. Listed here only because the audit prompt asked to check for inline props defeating memoization, and the answer is: this prop is fine.

---

### F-06 — `MotionConfig` `value` prop stability (root layout)
**File:** `src/app/layout.tsx:140-144`
**Severity:** NIL (passes the smell test).
**Impact:** `<MotionConfig reducedMotion={…ternary…}>` — the ternary returns a string literal `'always'` or `'user'`, so the prop is a stable primitive across renders. Framer-Motion's `MotionConfig` already wraps its context in a memo. No action needed.

---

### F-07 — Provider context value stability spot-check
- `PinnedSection` — `contextValue` is `useMemo(() => …, [])` (`PinnedSection.tsx:193-198`). **Stable.**
- No other custom React contexts in the tree.

**No action needed.**

---

### F-08 — `'use client'` boundary inventory
Every component flagged in the prompt is `'use client'`. That's correct given they all touch DOM / hooks. The audit didn't surface any leaf component that's `'use client'` but doesn't need to be. The server components (`Footer.tsx`, `Location.tsx`, `page.tsx`, root `layout.tsx`) stay on the server, which is the right split.

**No action needed.**

---

## 3 · Anti-patterns the audit looked for — results

| Anti-pattern | Found? | Where |
|---|---|---|
| `useState` updated inside per-frame callback | **Yes, once** | `Header.tsx:55-67` — `setProgress` per scroll tick. See F-01. |
| Inline object prop defeating memoization | No | `MaterialsGrid` builds `style={{ perspective: '1200px' }}` on the flip button but the child is unmemoised anyway; not a real defeat. |
| `useEffect` with no dep array | No | All effects audited carry explicit deps. |
| Provider with non-memoised `value` | No | `PinnedSection.contextValue` is `useMemo`'d; `MotionConfig` carries a primitive. |
| `React.memo` missing where it would help | Marginal | `ProductTile`, `BackFace`/`FrontFace` — see F-03, F-04. |

---

## 4 · Fixes — effort vs. impact

| # | Fix | Effort | Impact |
|---|---|---|---|
| F-01 | Header `progress` → ref + direct DOM write | 5 min | **MED** — removes 60 renders/scroll-second of the header tree. |
| F-03 | Memoise `buildTiles()` at module scope + `useMemo` doubled tile array + `React.memo(ProductTile)` | 5 min | **LOW-MED** — drops 28 reconciliations on hydration + any future re-render. |
| F-04 | Hoist `flatGrades(m)` to a module-scope precomputed map | 3 min | LOW — removes redundant work per card flip. |
| F-02 | Stable ref-callback in `HammerStrikeIntro` word loop | 2 min | TRIVIAL today, future-proofing. |

**Total:** ~15 minutes of focused work for all four. No architectural change.

---

## 5 · What's already good (worth not breaking)

- `PinnedSection` uses a ref-backed store + manual subscriber Set. The hot path mutates `store.progress` and walks `listeners` — zero React state involved. This is documented at length in the file header (`PinnedSection.tsx:18-41`).
- `HammerStrikeIntro` forwards a `progressRef` into the R3F scene; `HammerStrikeHero.tsx:45-74` reads `progress.current` inside `useFrame`. The whole scroll-to-3D pipeline never touches React.
- `MagneticCursor` rides motion values for pointer position; `setLabel` only fires on hover transitions, not per mouse-move.
- `NumberCounter` uses `useMotionValue` + `useTransform` — the count text node updates outside React state.
- Image-sequence scrub (`useScrollImageSequence`) draws to canvas via direct ctx calls; no React state ever.
- `lazy.tsx` declares `dynamic(...)` at module scope (not inside a render), so the lazy components are stable references.

---

## 6 · GitHub issue draft

> **Title:** Trim residual React render cost on the scroll path (Header + ProductsMarquee + MaterialsGrid)
>
> **Body:**
>
> Audit `docs/audit/08-react-renders.md` flagged four cheap wins. None of them are root-cause for "the site feels slow" (the scroll-driven path is already ref-backed via `PinnedSection`), but they remove residual reconciliation noise that's easy to drop.
>
> **Scope:**
>
> 1. **`Header.tsx`** — `setProgress(...)` runs on every scroll event and forces a header re-render only to update a `scaleX(...)` transform on a 2px hairline. Replace with a ref to the hairline `<div>` and write `style.transform` directly inside `onScroll`. Keep `scrolled` as state — it actually flips classes.
> 2. **`ProductsMarquee.tsx`** — hoist `buildTiles()` to module scope (zero inputs); `useMemo` the doubled `[...tiles, ...tiles]` array inside `MarqueeRow`; wrap `ProductTile` in `React.memo`.
> 3. **`MaterialsGrid.tsx`** — pre-compute a `{ slug → grades[] }` map at module scope so `BackFace` doesn't re-derive grades on every flip transition.
> 4. **`HammerStrikeIntro.tsx`** *(optional)* — stabilise the ref-callback in the three-word loop with `useCallback`.
>
> **Acceptance:**
> - React DevTools Profiler shows Header re-renders only on `scrolled` toggle (not per scroll tick).
> - `ProductTile` shows "did not render" on `MarqueeRow` parent re-render.
> - No visual regressions on the home page; magnetic cursor + scroll progress bar still feel right.
>
> **Out of scope:** PinnedSection, NumberCounter, MagneticCursor — already correct, do not touch.

---

## 7 · Recommended order of operations

1. F-01 (Header) — biggest single win, lowest risk.
2. F-03 (ProductsMarquee) — touch 3 lines, three small wins.
3. F-04 (MaterialsGrid grades map) — purely a hoist.
4. F-02 (HammerStrikeIntro ref callback) — only if other touches force a re-render path that matters.

Don't optimise anything else from this audit before profiling — the rest is genuinely fine.
