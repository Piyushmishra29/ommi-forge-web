# 07 — CSS Paint Cost Audit

> Read-only audit. No code edits applied.
> Angle: per-frame repaint cost during scroll — `backdrop-filter`, large
> blurred `box-shadow`, big `text-shadow`, `mix-blend-mode`, `filter`,
> stacked gradient overlays, over-applied `will-change`.

## Severity

**Severity: HIGH on Home + Header, MEDIUM on About, LOW elsewhere.**

The reported "rough scrolling" is almost certainly dominated by **two
backdrop-blurs that sit on top of pinned, continuously-redrawing
canvases**, plus **`mix-blend-difference` on the magnetic cursor**, which
together force the compositor to re-rasterise large overlapping regions
on every scroll frame.

The image-sequence scroll-scrub itself is doing what it should
(canvas draw + GSAP ScrollTrigger). What's expensive is *what is layered
on top of* the canvas while it's pinned and being redrawn.

---

## Inventory — heavy effects (location → effect → estimated cost)

Cost legend, per-frame during scroll (relative, not measured):
- **HIGH** — backdrop-filter on big region over animated content, or
  `mix-blend-difference` over the full viewport.
- **MED** — large blurred `box-shadow` / display-size `text-shadow` over
  animated content, stacked semi-opaque gradient overlays on hero.
- **LOW** — colour transitions, hover-only shadows, gradients on static
  sections.

| # | File | Line | Effect | Context | Cost |
|---|---|---|---|---|---|
| 1 | `src/components/sections/home/PlantWalkthrough.tsx` | 54 | `bg-graphite/55 backdrop-blur-md` on overlay card | Sits **on top of the pinned image-sequence canvas** that redraws every scroll frame for ~220% of viewport height. Backdrop must be re-blurred each frame. | **HIGH** |
| 2 | `src/components/motion/MagneticCursor.tsx` | 213 | `mix-blend-difference` on ring `motion.div` | `fixed`, `z-[9999]`, moves on every `mousemove` + spring tick. Forces the compositor to repaint a circle-sized region in a different blend mode against whatever is below (hero canvas, plant canvas, gradients). | **HIGH** |
| 3 | `src/components/ui/Header.tsx` | 243 | `bg-graphite/40 backdrop-blur-sm` mobile menu backdrop | Full-viewport blur over potentially-animating content while menu is open. Only active when the sheet is open, so not a scroll bottleneck — but expensive while open. | MED (situational) |
| 4 | `src/components/sections/home/Hero.tsx` | 244 | `bg-graphite/20 backdrop-blur-sm` on secondary CTA | Small region, but sits over the hero canvas which redraws every frame. The blur is over animated pixels for the whole hero scrub. | MED |
| 5 | `src/components/sections/home/Hero.tsx` | 200 | `[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]` applied to the whole foreground container — including the 124px `clamp` headline. | Display-size text-shadow with 24px blur radius. The shadow has to be re-rasterised when the canvas underneath updates. Inherited down to every text node in the column. | MED |
| 6 | `src/components/sections/home/Hero.tsx` | 236 | `shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]` on primary CTA | 32px blur radius, large surface. Over the hero canvas. | MED |
| 7 | `src/components/sections/home/Hero.tsx` | 195 | `bg-gradient-to-b from-graphite/55 via-graphite/40 to-graphite/75` over canvas | Static gradient is cheap, but it's the layer that establishes a semi-opaque region the backdrop-blur (#4) has to read through. | LOW (compounds #4) |
| 8 | `src/components/sections/home/Hero.tsx` | 260 | `animate-pulse` on scroll cue bar | Tailwind's `animate-pulse` runs at 2s ease-in-out forever. Tiny element, but always animating opacity → always invalidates. | LOW |
| 9 | `src/components/sections/about/AboutHero.tsx` | 139–143 | `bg-cover` parallax bg + inline `willChange: 'transform'` + opacity 40% + a `bg-gradient-to-br from-graphite/95 via-graphite/55 to-graphite/95` overlay on top | A scroll-listener mutates the transform on `bgRef` every frame. `will-change: transform` here is fine. Gradient on top is static. | LOW |
| 10 | `src/components/sections/about/HeritageEssay.tsx` | 139 | `shadow-[0_0_0_4px_rgba(255,153,51,0.18)]` on a 7px dot | Spread-only shadow, no blur — cheap. | NEGLIGIBLE |
| 11 | `src/components/sections/home/Location.tsx` | 86 | `shadow-[0_24px_60px_-32px_rgba(31,33,36,0.35)]` | Off-hero, static, only paints once. | LOW |
| 12 | `src/components/sections/contact/ContactDetails.tsx` | 114 | `shadow-[0_24px_60px_-30px_rgba(31,33,36,0.35)]` | Same — static. | LOW |
| 13 | `src/components/sections/products/ProductsGallery.tsx` | 396 | `bg-graphite/85 backdrop-blur-sm` modal overlay | Only paints when the product overlay is open and Framer Motion animates `bg-graphite/85` opacity. Brief. | MED (situational) |
| 14 | `src/components/three/StlViewer.tsx` | 304, 316, 339, 351, 385 | `backdrop-blur` / `backdrop-blur-md` on viewer chrome | Sits over a continuously-redrawing R3F canvas (autoRotate). Constant blur cost while viewer is mounted. | HIGH (when viewer open) |
| 15 | `src/components/sections/products/ProductsGallery.tsx` | 147, 162 | `bg-gradient-to-t from-graphite/90 via-graphite/55 to-transparent` with `transition-all duration-500 group-hover` | Cheap. Hover-only. | NEGLIGIBLE |
| 16 | `src/components/ui/Header.tsx` | 133–134 | `shadow-[0_2px_24px_-12px_rgba(0,0,0,0.4)]` + `[text-shadow:0_1px_8px_rgba(0,0,0,0.35)]` on header | Header is `position: fixed` and toggles based on `scrolled` boolean. The text-shadow stays applied on the transparent-header state across the whole hero. Tiny region (logo + nav), still — paints over animated canvas. | LOW–MED |
| 17 | `src/app/globals.css` | 171 | `will-change: transform, opacity` on every `[data-split-text] [data-char]` | SplitText splits the H1 into ~30+ characters. Each gets a permanent compositor layer. The user's [docs/audit hint](#) flagged this pattern: **over-applied `will-change` wastes GPU memory** and on mobile (Pi-served VPS users on phones) can push the page over the texture budget. | MED |
| 18 | `src/components/three/HammerStrikeHero.tsx` / `lazy.tsx` / `StlViewer.tsx` | radial-gradient bg | Cheap, painted once into the canvas backdrop. | NEGLIGIBLE |

### Compositor layer audit

`will-change` is used in exactly two places:

1. `globals.css:171` — `[data-split-text] [data-char]` → **every split character**. Permanent.
2. `AboutHero.tsx:142` — parallax bg div. Justified.

No `transform: translateZ(0)` / `transform-gpu` anywhere. The hero/plant
canvases are not explicitly layer-promoted (they will be promoted by the
browser because of the redraws, but explicit promotion is cleaner).

No `contain: paint` / `contain: layout` is used **anywhere** in the
codebase. Adding it to non-pinned sections would let the browser skip
paint work outside their boxes during scroll.

---

## Suspect-by-suspect findings

### 1. Plant overlay `backdrop-blur-md` (HIGH — user's #1 suspect)

Confirmed: `src/components/sections/home/PlantWalkthrough.tsx:54`. The
card sits inside a pinned 100dvh section while the underlying canvas
redraws on every scroll frame (`onUpdate: draw(...)` in
`useScrollImageSequence.ts:152`). Every redrawn canvas pixel inside the
card's box → re-blur. On a 4K display, the card is ~400 × 240 = 96 000
pixels being Gaussian-blurred per frame. On lower-end hardware that
single overlay is plausibly worth 4–8 ms of paint per frame.

**Replacement candidate (A): solid `bg-graphite/75` panel, no blur.**
Visually almost identical because the underlying frame is already
heavily darkened by the `bg-graphite/30` scrim on line 52, and the
overlay sits in the top-right corner over relatively low-frequency
content.

### 2. Hero `[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]` (MED — user's #2 suspect)

Confirmed: `src/components/sections/home/Hero.tsx:200`. The shadow is on
the parent foreground column, so it inherits to:
- `Eyebrow`
- `SplitText` H1 at `clamp(56px, 11vw, 124px)`
- `SplitText` italic span at `clamp(28px, 5vw, 52px)`
- subhead `<p>`

`text-shadow` of large blur radius on display text is genuinely
expensive — Blink rasterises it into the text layer. Combined with
`SplitText` chopping the headline into per-character spans, the
text-shadow may be computed per glyph.

**Replacement candidate (B): drop the text-shadow, add an absolutely-
positioned radial backdrop behind the foreground column.** E.g. a div
with `background: radial-gradient(ellipse 60% 40% at center,
rgba(0,0,0,0.55), transparent 70%)` — painted *once* into the gradient
overlay layer, no per-glyph cost.

### 3. Hero CTA `shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]` (MED — user's #3 suspect)

Confirmed: `src/components/sections/home/Hero.tsx:236`. Single small
element, but sits in front of redrawing canvas. The 32px blur radius is
the expensive part.

**Replacement candidate:** trim to `shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)]`
(half the blur radius is roughly a quarter of the cost), or drop
shadow entirely and rely on the saffron's chroma contrast against the
darkened hero.

### 4. Magnetic cursor `mix-blend-difference` (HIGH — user's #4 suspect, escalated)

Confirmed: `src/components/motion/MagneticCursor.tsx:213`. **This is
probably the single worst paint offender on the page.** `mix-blend-
difference` is the most expensive blend mode and forces the compositor
to fall back to software compositing for the affected region in some
configurations. The cursor follows mouse motion with a Framer Motion
spring, so it's invalidating ~60 times a second whenever the mouse
moves, on top of whatever the page is doing.

There are no `filter:` or `blur(...)` rules on the cursor itself, so
the suspect list's "filter/blur effects" is **not** the issue — but the
blend mode alone is enough to be the worst single offender.

**Replacement candidate:** swap to a solid `bg-saffron` or
`bg-paper mix-blend-normal` ring with `opacity: 0.7`. Lose the auto-
invert effect, gain a static colour layer that the GPU can composite
without re-reading the layer below.

### 5. Hero gradient stack (LOW — user's #5 suspect, confirmed)

`bg-gradient-to-b from-graphite/55 via-graphite/40 to-graphite/75` on
its own is cheap (single static gradient image cached by the GPU). The
compound cost only materialises because the **secondary CTA's
`backdrop-blur-sm` (#4 in the table) has to read through this gradient
plus the canvas underneath**. Killing the secondary CTA blur removes the
compound cost; the gradient itself can stay.

---

## Recommended fixes (prioritised)

### P0 — do these first

1. **Drop `mix-blend-difference` from the magnetic cursor.** Replace
   with a solid `bg-saffron` ring (or `bg-paper`) and a small `opacity`.
   This is the single biggest win and is one-line.
   _Touch: `src/components/motion/MagneticCursor.tsx:213`._

2. **Replace `backdrop-blur-md` on the plant walkthrough overlay with
   solid `bg-graphite/75`.** Removes the per-frame blur over the
   scrubbing canvas.
   _Touch: `src/components/sections/home/PlantWalkthrough.tsx:54`._

3. **Drop the secondary CTA's `backdrop-blur-sm`.** Bump bg opacity to
   `bg-graphite/45` and keep the paper border for the outlined look.
   _Touch: `src/components/sections/home/Hero.tsx:244`._

### P1 — do these next

4. **Move the hero headline `text-shadow` off the text and onto a
   radial-gradient panel behind it.** Hidden cost: SplitText puts ~30+
   spans inside the column, each inheriting the shadow.
   _Touch: `src/components/sections/home/Hero.tsx:200`._

5. **Halve the hero CTA shadow blur radius** to
   `shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)]`. Cheap, visually similar.
   _Touch: `src/components/sections/home/Hero.tsx:236`._

6. **Add `contain: paint` to top-level static sections** (Location,
   ClosingCta, MaterialsGrid, ContactDetails). One declaration each,
   bounds the paint region and lets the browser skip them while
   scrolling past pinned siblings.

### P2 — nice-to-haves

7. **Stop applying `will-change: transform, opacity` to every
   `[data-split-text] [data-char]`.** Add it only while the SplitText
   timeline is actively running, then drop it on completion. This is a
   classic "always-on will-change" GPU memory leak.
   _Touch: `src/app/globals.css:171`. Likely also adjust SplitText
   timelines so they set/unset will-change imperatively._

8. **Explicitly layer-promote the hero + plant canvases** with
   `transform: translateZ(0)` (or `will-change: transform`). The browser
   already does this implicitly because of the per-frame draw, but
   explicit promotion stops it from being re-decided each frame and
   isolates the canvas from neighbouring layers.

9. **StlViewer chrome `backdrop-blur` (multiple).** When the STL viewer
   is mounted with `autoRotate`, the R3F canvas is redrawing constantly
   and all five `backdrop-blur` overlays re-blur. Replace with solid
   panels at higher opacity. Lower priority because the viewer is
   modal/secondary, not on the hero.
   _Touch: `src/components/three/StlViewer.tsx:304, 316, 339, 351, 385`._

10. **Header `[text-shadow:0_1px_8px_rgba(0,0,0,0.35)]` over hero**.
    Small, but applies to logo + nav while scrolling over canvas. Could
    be replaced by a faint linear-gradient under the header. Optional.

### P3 — keep as-is

- Mobile menu `backdrop-blur-sm` and ProductsGallery overlay
  `backdrop-blur-sm` — only active when those panes are open and the
  page isn't scrolling. Keep.
- Static box-shadows on Location/Contact cards. Cheap.
- All gradient overlays (they're static images to the compositor).

---

## GitHub issue draft

```
Title: perf(home): CSS paint hotspots in hero + plant walkthrough cause rough scroll

Summary
-------
Scrolling through the home page feels rough on mid-tier hardware. Audit
(/docs/audit/07-css-paint.md) traces the cost to three per-frame paint
offenders layered on top of the pinned image-sequence canvases:

1. `mix-blend-difference` on the MagneticCursor ring — most expensive
   blend mode, invalidates a circular region every spring tick while the
   page is redrawing the hero/plant canvas behind it.
2. `backdrop-blur-md` on the plant walkthrough overlay card — re-blurs
   the scrubbing canvas every scroll frame for ~220% of viewport.
3. `backdrop-blur-sm` on the hero secondary CTA + `text-shadow` on the
   124px display headline — blur + per-glyph shadow over animated pixels.

Scope (files)
-------------
- src/components/motion/MagneticCursor.tsx:213
- src/components/sections/home/PlantWalkthrough.tsx:54
- src/components/sections/home/Hero.tsx:200,236,244
- src/app/globals.css:171  (over-applied will-change on SplitText chars)
- src/components/three/StlViewer.tsx (multiple backdrop-blur, secondary)

Proposed changes
----------------
P0 (one-line, high impact):
- [ ] MagneticCursor: drop `mix-blend-difference`, use solid bg-saffron
      ring at opacity 0.7.
- [ ] PlantWalkthrough overlay: replace `backdrop-blur-md` with
      solid `bg-graphite/75` panel.
- [ ] Hero secondary CTA: drop `backdrop-blur-sm`, bump bg to
      `bg-graphite/45`.

P1:
- [ ] Hero headline: drop `[text-shadow:...]`, add a radial-gradient
      panel behind the foreground column instead.
- [ ] Hero primary CTA: halve shadow blur radius
      (`0_8px_32px_-12px` → `0_4px_16px_-8px`).
- [ ] Add `contain: paint` to Location, ClosingCta, MaterialsGrid,
      ContactDetails.

P2:
- [ ] SplitText: move `will-change` to a timeline-scoped attribute (set
      on start, drop on complete) instead of permanent CSS.
- [ ] Add explicit `transform: translateZ(0)` to the hero + plant canvas
      elements.
- [ ] StlViewer chrome: replace `backdrop-blur` overlays with solid
      panels while a redrawing canvas is behind them.

Acceptance
----------
- Chrome DevTools Performance panel: scroll the home page top-to-bottom.
  Average frame time during the hero + plant pin should drop below
  16 ms on a mid-tier laptop / iPhone 12-class device.
- "Paint flashing" in Rendering panel: no full-card-sized blur regions
  re-painting on every scroll tick.
- Visual diff on hero + plant overlay: ≤ perceptual delta 5 (the user
  should not notice the blur was removed because the underlying frame is
  already darkened by existing scrims).

Out of scope
------------
- Image-sequence decode strategy (different audit).
- Lenis tuning (different audit).
- Mobile menu / ProductsGallery overlay blurs — kept as-is, only active
  when scrolling is paused.
```

---

## Notes for the implementer

- Tailwind v4 is in use (`@import "tailwindcss"` in `globals.css`), so
  utility class names match v4 conventions. `backdrop-blur-*`,
  `shadow-[...]`, `bg-graphite/55` etc. all resolve normally.
- `prefers-reduced-motion` is already wired (`globals.css:194`). Any new
  per-frame effects should respect it.
- The codebase uses GSAP ScrollTrigger via a Lenis bridge
  (`LenisProvider.tsx:51`). Don't introduce `scroll`-tied JS without
  reusing the existing rAF loop.
- AGENTS.md note in repo root warns: "This is NOT the Next.js you know …
  read `node_modules/next/dist/docs/`." Anything touching the build /
  layout boundary should be sanity-checked against the in-tree docs.
