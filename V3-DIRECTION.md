# Ommi Forge v3 — Art Direction & Motion Spec

**Status:** locked. Four build agents resolve against this document.
**Scope:** this file defines *what it looks like and how it moves*. It does not assign files.
**Rule for readers:** if this document gives a number, use that number. If it doesn't, you decide — but
check §6 first, because §6 is a list of decisions that are already made in the negative.

---

## 1. The concept

**The site is one heat.**

A forging heat is a single billet's trip down the line: it comes in cold, goes into the furnace, gets struck,
gets rolled or upset or die-formed, cools, is inspected, ships. It happens once, in order, and it cannot be
paused. That is the site.

Scroll is the line. The page you are on is a station. The part on screen is *the same part*, further along —
it heats, it takes its shape, it cools, and by the closing CTA it is a finished, oiled component sitting cold
in grey light. Heat is not decoration; it is a position on a timeline, and it only ever falls.

Everything resolves against this:
- Dark, because a shop floor is dark and heat is the only light that matters.
- Saffron is temperature, never a UI accent on a 3D surface.
- Motion has mass: 4000 tonnes do not bounce, overshoot, or spring.
- Pages with no part to look at get no 3D. Spectacle is earned by having something to show.

The tagline that already exists in `src/data/home.ts` — *"For all your forging needs"* — is not the concept.
`HAMMER_INTRO_WORDS = ['Heat', 'Strike', 'Forge']` **is**, and it is already in the data. Use it as the spine.

---

## 2. Visual system

### 2.1 Mode: dark-first

v3 inverts v2. The page ground is **graphite `#1F2124`** — already a brand token, already the v2
header/footer colour, so the site reads as "the header ate the page", not as a new brand.

Why dark is correct here and not just fashionable:
1. `metalness: 1.0` steel on a light ground renders as a pale smear. On dark, the specular highlights are the
   form, which is what a forged part actually looks like under shop lighting.
2. Saffron `#FF9933` measures **2.04:1 on paper** — it is nearly invisible as heat on the v2 ground. On
   graphite it is **7.57:1**. Dark is what makes the brand's own colour finally do its job.
3. It resolves the canvas-seam problem for free: the WebGL clear colour is the page colour (§3.6).

**Two light surfaces survive, deliberately** (§2.3 "the datasheet rule"). This is not a compromise — the QC
lab is lit differently from the forge floor, and the site should say so.

### 2.2 Token roles on dark

Existing tokens, re-roled. **No existing token is redefined.** All ratios below are measured, not estimated.

| Token | Hex | Role in v3 | Ratio on graphite | Verdict |
|---|---|---|---|---|
| `graphite` | `#1F2124` | **page ground**, canvas clear colour | — | base |
| `slag` **(NEW)** | `#2A2D31` | raised panel / inset surface | 1.17:1 | decorative separation only |
| `snow` | `#FFFFFF` | primary text, headlines | 16.14:1 | AAA |
| `paper` | `#FAFAFA` | primary text alt, display headlines | 15.46:1 | AAA |
| `swarf` **(NEW)** | `#9BA1A8` | **body + secondary text on dark** | 6.19:1 | AA/AAA-large |
| `saffron` | `#FF9933` | eyebrows, heat, links, focus ring | 7.57:1 | AAA-large, AA normal |
| `mesh` | `#FF5533` | hover state on saffron, active tab | 5.07:1 | AA normal |
| `peach` | `#FFBC7D` | warm hairline, heat-adjacent numerals | 9.79:1 | AAA |
| `cinder` | `#6B6B6B` | structural hairlines **on graphite only** | 3.03:1 | clears 1.4.11 on graphite; **2.60:1 on slag — fails there** |
| `ash` | `#7A7A7A` | structural hairlines **on slag**; decorative hairline anywhere on dark | 3.76:1 | 3.22:1 on slag — the only grey that clears 1.4.11 on *both* dark surfaces |
| `steel` | `#54595F` | 3D-adjacent chrome, disabled states | 2.28:1 | **never text, never a state boundary** |
| `ember` | `#C2381C` | — | 2.98:1 | **forbidden on dark. Light surfaces only.** |
| `oxide` | `#8A2814` | — | 1.99:1 | **forbidden on dark.** |
| `render-bg` | `#D9D9D9` | — | — | retired from v3; it was the light-mode 3D stage |

**Two new tokens. That is the entire palette addition.**

```css
/* Add to @theme in globals.css — do not touch any existing declaration. */

/* The AA-safe body grey on the dark ground. Every existing grey fails here:
   steel 2.28:1, cinder 3.03:1, ash 3.76:1 — all under AA 4.5:1 for normal
   text on graphite. This is the exact mirror of the ash → cinder relationship
   the light palette already documents, one step further up the ramp.
   Measured 6.19:1 on graphite, 5.31:1 on slag, 4.13:1 on the 3D floor tone
   (#3A3E44 — so never put swarf text over the canvas floor band). */
--color-swarf: #9BA1A8;

/* Raised surface on graphite: cards, inset panels, sticky rails. At 1.17:1
   it is a *decorative* lift, not a boundary — any panel whose edge carries
   meaning (a selected state, a form field, a focusable card) also gets a
   1px hairline. Use `ash` (3.22:1 on slag), NOT cinder: cinder clears
   1.4.11 on graphite at 3.03:1 but drops to 2.60:1 against slag, and a
   slag panel's own edge is the commonest place that hairline lands. */
--color-slag: #2A2D31;
```

Mirror both into `src/lib/brand.ts` (`BRAND_HEX`) — the three.js side needs literal hex.

**Hard contrast rules on dark:**
- Body copy is `swarf`. Emphasis and headings are `snow`/`paper`. Never `steel`, `cinder`, `ash`, `ember`, or `oxide` for words on dark.
- **Hairlines: `ash` on slag, `cinder` or `ash` on graphite, `steel` never.** The short version: if the edge
  carries meaning, `ash` is the one grey that clears 3:1 on both dark surfaces — default to it and stop
  thinking about which ground you're on. `steel` (2.28:1 graphite / 1.96:1 slag) is decorative ink only.
- `mesh` on `slag` is 4.35:1 — passes for normal text, but only just. Prefer `saffron` (6.49:1) on slag.
- The v2 two-tone focus ring in `globals.css` (`2px saffron outline` + `4px graphite box-shadow`) is
  **unchanged and untouchable**. It still works: on graphite the saffron half carries it at 7.57:1; on a
  saffron button the graphite half carries it at 7.57:1; on a paper datasheet card the graphite half carries
  it at 15.46:1. Do not add a local ring, do not add `outline-none`.
- `::selection` stays saffron-on-graphite. It already reads correctly on the dark ground.
- `:root { color-scheme: light only }` becomes `dark`. `html`/`body` background becomes graphite.

### 2.3 The datasheet rule (the only light surfaces)

A **paper card** is a `snow` or `paper` block sitting on the dark ground. It is used for exactly one thing:
**cold technical information** — grade tables, the contact form, the location block, spec lists.

- Minimum width 480px (below that it becomes a full-bleed light band, never a small white chip).
- No rounded corners > 2px. No drop shadow. It is a printed sheet, not a floating card.
- **Inside a paper card, the entire v2 light-mode contrast system applies verbatim**: graphite text, `ember`
  for small warm accents, `cinder` for tertiary grey, `ash` for hairlines. This is how the v2 a11y work is
  preserved rather than re-derived — the light rules didn't go away, they moved inside a boundary.
- One optional 4px saffron rule along the card's top edge. Nothing else warm.

**Implemented — use it, don't rebuild it.** `src/components/ui/PaperCard.tsx` (props `tone="snow"|"paper"`,
`topRule`, `as`) or the bare `.paper-card` class. Geometry (min-width 480px, 2px corners, no shadow,
full-bleed break below 520px) is enforced in CSS, so you cannot accidentally violate the rules above.

The light/dark flip runs on **six semantic tokens** that re-point inside a card — `text-ink`, `text-ink-body`,
`text-ink-muted`, `text-ink-accent`, `border-rule`, `bg-surface`. Reach for these instead of naming a palette
token directly whenever a component might appear on both grounds: the same `<Eyebrow>` renders saffron on
graphite and ember inside a card with no prop and no branch. Name a raw token only when the element lives on
exactly one ground forever.

`/materials` and `/contact` are built almost entirely from paper cards. That is the point (§5).

### 2.4 Typography

Three families already load via `next/font` in `src/app/layout.tsx`: **Manrope** (display, 300/400/500/700),
**Work Sans** (eyebrow, 600/800), **Roboto** (body, 400/600). No new families. No new weights.

| Role | Size | Line-height | Tracking | Family / weight |
|---|---|---|---|---|
| `display-xl` — home h1 only | `clamp(52px, 9.5vw, 132px)` | `0.94` | `-0.035em` | Manrope 300 |
| `display-l` — page h1, section h2 | `clamp(36px, 5.2vw, 72px)` | `1.0` | `-0.03em` | Manrope 300 |
| `display-m` — h3 | `clamp(26px, 2.6vw, 40px)` | `1.10` | `-0.02em` | Manrope 400 |
| `display-s` — h4, card title | `clamp(19px, 1.5vw, 23px)` | `1.25` | `-0.01em` | Manrope 500 |
| `lede` | `clamp(18px, 1.5vw, 22px)` | `1.50` | `-0.005em` | Roboto 400, `swarf` |
| `body` | `16px` | `1.65` | `0` | Roboto 400, `swarf` |
| `small` | `14px` | `1.55` | `0` | Roboto 400, `swarf` |
| `meta` | `12px` | `1.40` | `0.02em` | Roboto 400, `swarf` |
| `eyebrow` | `11px` / `12px` ≥1024 | `1.0` | `0.26em` | Work Sans 600, uppercase, `saffron` |
| `data` — stats, tonnage, years | `clamp(40px, 6vw, 88px)` | `0.90` | `-0.02em` | Work Sans 800, `tabular-nums` |
| `spec` — grade codes, dimensions | `14px` | `1.5` | `0.01em` | Roboto 600, `tabular-nums` |

**What changes from v2, and why:**
1. **Line-height.** `globals.css` sets `line-height: 1.15` on every heading. At `clamp(56px,11vw,124px)` (the
   v2 hero) that is a visible gap between the two hero lines. v3 goes per-role: `0.94` at display-xl,
   `1.0` at display-l, back to `1.25` by h4. Big type gets tight, small type gets air. Override per-role;
   don't change the global. **This now works:** v2's globals were unlayered, so the element rule beat every
   `leading-*` utility on a heading. Element defaults moved to `@layer base` and the type roles to
   `@layer components`, so utilities finally win. Expect headings to render at different leading than v2 —
   that is the fix landing, not a regression.
2. **Tracking.** v2 is a flat `-0.01em` on all headings. Manrope at 130px needs `-0.035em` or it reads loose;
   at 26px `-0.035em` closes the counters. Scale it with size, per the table.
3. **Body colour** goes graphite → `swarf`. Every body-copy class needs revisiting; this is the single
   largest mechanical diff from v2.
4. **NEW — the halation floor.** Light-on-dark text optically gains weight. Manrope 300 below 24px on
   graphite blooms and loses its stems. **Never render Manrope below 300 weight on dark, and never render
   Manrope 300 below 24px on dark — use 400.** Same reason: never set `snow` (`#FFFFFF`) on graphite below
   15px; use `swarf` at 14px and under, which is dimmer and therefore sharper.
5. **`data` gains `font-variant-numeric: tabular-nums`.** `NumberCounter` currently reflows on every tick as
   glyph widths change. Tabular figures fix it and cost nothing.
6. Eyebrows keep Work Sans 600 / 0.26em (v2 uses 0.20–0.30em inconsistently — standardise on `0.26em`) and
   go `saffron` on dark, `ember` inside paper cards.

**Shipped as classes — use these, never a per-component clamp.** The table above exists as
`.type-display-xl` (home h1 only) · `.type-display-l` (page h1 / section h2) · `.type-display-m` ·
`.type-display-s` · `.type-lede` · `.type-body` · `.type-small` · `.type-meta` · `.type-eyebrow` ·
`.type-data` · `.type-spec`. Every existing arbitrary value (`text-[clamp(56px,11vw,124px)]` and friends)
gets replaced by one of these. A new `text-[clamp(...)]` anywhere in a section component is a drift bug —
if no role fits, say so rather than inventing a twelfth size.

### 2.5 Grid & space

- **Container:** `max-w-page` (1140px, from `--container-page`). Never `max-w-[1140px]`. Unchanged from v2.
- **Gutters:** 20px < 768 · 32px ≥ 768 · 48px ≥ 1280 — shipped as `.page-x`.
- **Grid:** 12 columns, 24px gutter ≥ 1024, 16px below. Editorial defaults: full-width copy blocks max
  `68ch`; two-column splits are 7/5, never 6/6 (6/6 reads as a template).
- **Baseline:** 8px. Every vertical value is a multiple of 8 except type line-boxes.
- **Section rhythm** (vertical padding, top and bottom) — shipped as `.section-y-sm` / `.section-y` /
  `.section-y-lg`:
  - `section-sm` `clamp(64px, 8vw, 96px)` — between two related blocks
  - `section` `clamp(96px, 11vw, 144px)` — default
  - `section-lg` `clamp(128px, 15vw, 200px)` — before/after a 3D act or a page break
- **3D stages break the container.** A canvas act is full-bleed `100svh` (not `100vh` — mobile URL-bar
  resize retriggers `ScrollTrigger.refresh()` and jumps the pin). Copy overlaying a stage stays inside
  `max-w-page`.
- **Scroll distance for pinned acts:** `end: '+=140%'` for a single-beat act, `'+=200%'` for the home hero
  act (3 beats). More than that and it reads as a stuck page.
- **Tap targets stay 44×44.** The v2 `::before { -inset-1 }` hit-area pattern in `StlViewer` is the house
  pattern — reuse it, don't invent a second one.

---

## 3. Material & lighting direction for the 3D

### 3.0 Read this before writing a single line of three.js

`src/components/three/glb.ts` `extractGeometry()` returns **one `BufferGeometry` with `position` and `index`
only.** `dequantize()` deliberately drops everything else; the caller runs `computeVertexNormals()`.

Consequences, all of which are traps:
- **There are no UVs.** Any UV-sampled map — `roughnessMap`, `normalMap`, `aoMap`, `metalnessMap`,
  `anisotropyMap` — samples `uv = (0,0)` and renders as a flat constant. It will look like it "worked".
  **Do not use UV-sampled maps.** Surface interest comes from the environment (§3.3), not from textures.
- **There are no tangents.** `MeshPhysicalMaterial.anisotropy` needs them. **Do not use `anisotropy`.** The
  brushed-metal read comes from the twin roof Lightformers in §3.3, which is how it works in a real shop
  anyway — two long strip lights, two long highlights.
- **There is one geometry, so one material per part.** You cannot give the machined faces a different
  roughness from the as-forged faces. Pick one material state per beat and change it over time instead (§3.4).
- Do not touch `dequantize()`. Every model on the site depends on it.

### 3.1 Renderer

```
gl: { antialias: true, powerPreference: 'high-performance', alpha: false }
toneMapping: THREE.ACESFilmicToneMapping
toneMappingExposure: 1.05
outputColorSpace: sRGB   // r3f default, leave it
shadows: 'soft'          // PCFSoftShadowMap
```
`alpha: false` matters: the canvas clears to graphite, opaque, and the page shows nothing through it (§3.6).

### 3.2 Materials — `MeshPhysicalMaterial`, three named states

The part is in exactly one of these at any scroll position. Transitions between them are `lerp`ed on the
material uniforms over the scrub, never cross-faded between two meshes.

**A. `AS_FORGED`** — mill scale, straight off the hammer. The default. Used for hero beat 1, `/solutions`,
`/renders` hub.
```js
color:            '#43474B'   // dark blue-grey scale, not "silver"
metalness:        0.75        // AMENDED from 1.0 — mill scale is an oxide layer,
                              // substantially dielectric, not bare metal. At 1.0
                              // there is no diffuse term, so '#43474B' can only
                              // tint reflections and never reaches the screen;
                              // 0.75 restores it. MACHINED and SHIPPED stay at
                              // 1.0 — those faces really are bare metal.
roughness:        0.58
clearcoat:        0.0         // there is no lacquer on a raw forging
envMapIntensity:  1.0
emissive:         '#FF5533'   // mesh
emissiveIntensity: 0.0        // §3.4 drives this
flatShading:      false
```

> **Amendment note (3d-core).** AS_FORGED's `metalness` is 0.75, not the 1.0 originally specified. Mill scale
> is an oxide layer, substantially dielectric, not bare metal; at 1.0 there is no diffuse term, so `#43474B`
> can only tint reflections and never reaches the screen. Measured against the shipped rig (part-d): 1.0 →
> mean R−B +4.1, 5.8% orange; 0.70/0.75/0.80 → +4.3, 5.0%. The 0.7–0.8 range is visually indistinguishable,
> so 0.75 is the midpoint rather than a fitted value.
>
> **Correction (supersedes an earlier note).** I first reported that the copper cast "does not reproduce".
> That was wrong, and the error was my sample: part-d in AS_FORGED is one of the cases that does not show it.
> v3-showroom found the real driver — a **warm rear wall in the environment**, which stains broad faces
> angled toward it, and MACHINED's `roughness: 0.42` keeps that reflection sharp where AS_FORGED's 0.58 blurs
> it. Re-measured on the shipped defaults, machined: part-f (Crank) **+16.5 / 29.7%**, part-i (Connecting Rod)
> **+19.3 / 25.0%** — a copper stripe down the crank's shank. Fixed by making `ForgeEnvironment`'s rear panel
> cool (`coolColor: '#8FA6BC'`): part-f → −5.5 / 0.4%, part-i → −3.9 / 2.0%, as-forged → +1.7 / 0.6%.
> §3.3's forge heat is not lost — it lives on the **rim light** at full saffron strength, where §3.3 puts it
> and where it separates the silhouette instead of staining the surface. Dimming the warm wall was not enough
> (still 12.3% at quarter brightness); it had to stop being orange.
>
> `MACHINED`'s `roughness` also ships at **0.42**, not the 0.24 below: 0.24 assumes twin roof softboxes that
> the shipped environment does not have, and renders as mirror chrome (§6.11's floor is 0.22).
>
> All three states live in `src/lib/three/materialStates.ts` as plain data with **no three.js import**, and
> are rendered by `<ForgedSteelMaterial state="as-forged" />`. Import the values from there (or from
> `three3`/`three3/scene`) rather than keeping a local copy — per-lane copies are how the 0.24-vs-0.42 drift
> happened in the first place.

**B. `MACHINED`** — the finished faces, bright and directional. Used at the end of `/about`'s heritage
scrub, and for `/renders` detail views where the part is the subject.
```js
color:            '#8D9298'
metalness:        1.0
roughness:        0.24
clearcoat:        0.0
envMapIntensity:  1.15
```

**C. `SHIPPED`** — machined and oiled for transit. Used **once**, at the home page closing CTA, as the
bookend. The clearcoat is motivated: parts really do ship under a rust-preventive film.
```js
color:            '#8D9298'
metalness:        1.0
roughness:        0.30
clearcoat:        0.35
clearcoatRoughness: 0.12
envMapIntensity:  1.0
emissiveIntensity: 0.0        // hard zero. The part is cold. This is the whole point.
```

Optional polish, not required for v1: world-space triplanar noise on `roughness` via `onBeforeCompile`,
modulating `AS_FORGED` between 0.42 and 0.78 at a frequency of ~4 cycles per part-radius. It kills the last
of the CG uniformity. **Costs zero bytes** — no map, no UVs needed. If it isn't clean in an afternoon, ship
without it; the environment carries the surface.

### 3.3 Lighting rig — no HDRI, procedural environment

**Decision: analytic lights + a procedurally generated environment, baked once.** Not a drei `preset`
(those fetch from the pmndrs CDN — an external multi-hundred-KB download and an offline failure mode) and
not an HDRI file (the brief forbids it, correctly).

`metalness: 1.0` with no environment renders **black**. The environment is not optional lighting polish; it
is the material. drei 10.7 ships `Environment` + `Lightformer` (confirmed present in
`node_modules/@react-three/drei/core/`).

```jsx
<Environment resolution={128} frames={1}>
  {/* frames={1} bakes the cubemap on the first frame and never re-renders it.
      128px is plenty — this is reflection data for a rough metal, not a backdrop. */}

  {/* L1 + L2 — the two roof strip lights. This pair IS the brushed-metal read:
      two long specular streaks running the length of the part. Do not merge
      them into one; a single streak reads as a studio softbox, i.e. a product
      render, not a shop floor. */}
  <Lightformer form="rect" intensity={2.0} color="#FFF4E8"
               position={[0, 5, -1]}  scale={[10, 1, 1]}   target={[0,0,0]} />
  <Lightformer form="rect" intensity={1.2} color="#FFF4E8"
               position={[0, 5, 2]}   scale={[10, 0.6, 1]} target={[0,0,0]} />

  {/* L3 — floor bounce. Keeps the underside from going pure black. */}
  <Lightformer form="rect" intensity={0.35} color="#3A3E44"
               position={[0, -4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />

  {/* L4 — the forge mouth. The ONLY saturated source in the scene, behind and
      to the left. This is what makes saffron read as heat rather than as a UI
      accent painted on the metal. */}
  <Lightformer form="circle" intensity={1.4} color="#FF7A2B"
               position={[-4, 0.5, -4]} scale={3} target={[0,0,0]} />
</Environment>
```

Analytic lights on top. **Units are a normalised rig: the part is fit to bounding-sphere radius 1.0**, camera
at `z = 4.2`, `fov = 32`. (The existing `StlViewer` fits to radius 50 with the camera at 200 / fov 35 — same
framing, 50× scale. Keep `StlViewer` as is; new components use the normalised rig. Don't mix them in one
scene.)

| Light | Type | Position | Intensity | Colour | Note |
|---|---|---|---|---|---|
| Key | `directionalLight` | `[2.6, 3.4, 2.2]` | `2.4` | `#FFF4E8` (~4800K) | the only shadow caster |
| Fill | `directionalLight` | `[-3.0, 0.6, 1.4]` | `0.55` | `#8FA6BC` (~7000K) | cool bounce off sheet-metal walls; keeps the shadow side from dying |
| Rim / forge | `directionalLight` | `[-1.2, 1.0, -3.2]` | `1.6` | `#FF9933` saffron | separates the silhouette from the graphite ground. Non-negotiable on a dark site. |
| Ambient | `ambientLight` | — | `0.12` | `#2A2D31` slag | lifts black to near-black. Any higher and the form flattens. |
| Core heat | `pointLight` | part origin | `0 → 2.2` | `#FF7A2B` | **§3.4 only.** `distance: 2.5`, `decay: 2` |

Shadows:
```
key: castShadow, shadow-mapSize [1024, 1024], shadow-bias -0.0005, shadow-normalBias 0.02
<ContactShadows position={[0, -1.05, 0]} opacity={0.55} scale={5} blur={2.2} far={2} color="#000000" />
```
On a dark ground the contact shadow must be **darker than the floor**, hence pure black at 0.55 — the v2
light-mode values (`opacity 0.6` grey on `#D9D9D9`) will read as a grey smear on graphite.

### 3.4 Heat — how it is expressed, and the restraint rules

Heat is **three simultaneous signals**, never one:
1. `emissiveIntensity` on the material — a **low uniform floor**, `0 → 0.35` max.
2. The **core `pointLight`** at the part's origin, `0 → 2.2`, `distance 2.5`, `decay 2`. This is what makes
   the glow non-uniform: it lights the part's own hollows, webs and undercuts from inside, so the heat
   pools where a real part holds heat. Without maps or UVs, this is the only way to get directional
   emission — and it's better than a map would be.
3. The forge-mouth Lightformer (L4) and the saffron rim, which are always on at their base intensity.

**Restraint rules — these are what stop it becoming a sci-fi UI:**
- **Heat only ever falls.** It is applied instantly on a strike beat and decays. It never fades *in*, never
  pulses, never loops, never breathes. A pulsing glow is the single clearest tell of an AI-default 3D scene.
- **Decay is exponential, not linear.** `gsap.to(mat, { emissiveIntensity: 0, duration: 2.2, ease: 'power3.out' })`.
  Cooling steel does not ease linearly.
- **`emissiveIntensity` never exceeds 0.35.** Above that the material stops being metal and becomes a lamp.
- **No bloom, no `EffectComposer`, no post-processing of any kind.** It is a full-screen pass, it costs a
  framerate you do not have inside a 12MB budget, and unmotivated bloom is the most generic look available.
  If the heat doesn't read without bloom, the rig is wrong — fix the rig.
- **Heat appears at most twice on the whole site**: the home hero strike beat, and nowhere else on `/` until
  the closing CTA where it is explicitly at zero. `/solutions` gets a *single* brief heat pulse on the Closed
  Die panel only, because that panel is literally about striking hot metal. Every other 3D moment on the
  site is cold metal.
- **Saffron never touches the mesh as a base colour.** The part is never orange. It is grey steel that is
  being lit by something orange. If someone screenshots a frame and the part looks orange, it's wrong.

### 3.5 Performance envelope

- **One `<Canvas>` per route.** Two canvases = two WebGL contexts = the browser's 8–16 context cap gets hit
  after a few SPA navigations and everything goes blank. This is the failure mode, not a theoretical risk.
- `dpr={[1, 2]}` with `<PerformanceMonitor onDecline={...}>` stepping down to `[1, 1.25]`, plus
  `<AdaptiveDpr pixelated={false} />`.
- `frameloop="demand"` by default; flip to `"always"` only while a scrub act is pinned **and**
  intersecting. Nothing renders off-screen or on a hidden tab.
- Models load per-beat via `<Suspense>`, never eagerly, never all at once. Cache cap: **3 loaded GLBs live at
  any moment**; dispose the rest (`geometry.dispose()` — the existing `StlViewer` unmount pattern is correct,
  copy it).
- Every canvas is wrapped in the existing `CanvasErrorBoundary`.

### 3.6 The canvas must not look like a canvas

- **Clear colour is `graphite` exactly** — `<color attach="background" args={['#1F2124']} />`. Identical to
  the page. No visible rectangle.
- **No border, no border-radius, no `overflow-hidden` rounded corner on a 3D stage.** A rounded-corner
  WebGL viewport is the "3D widget embedded in a website" look. We want "the website is 3D".
- Depth comes from a **CSS radial vignette overlaid on the canvas**, not from a different clear colour:
  `radial-gradient(ellipse at 50% 45%, transparent 40%, #1F2124CC 100%)`, `pointer-events: none`.
- The LCP element is a **static poster image**, not the canvas. Poster loads immediately, canvas fades in
  over it in 400ms once the first frame is drawn (§5.9).

---

## 4. Motion language

### 4.1 Easing curves — named, and there are five

| Name | cubic-bezier | GSAP equivalent | Used for |
|---|---|---|---|
| `press` | `cubic-bezier(0.16, 1, 0.30, 1)` | `expo.out` | anything that **arrives**: reveals, entrances, text |
| `mass` | `cubic-bezier(0.65, 0, 0.35, 1)` | `power2.inOut` | anything moving **under its own weight**: camera, section handoff, part travel |
| `strike` | `cubic-bezier(0.90, 0, 0.10, 1)` | `power4.inOut` | the hammer beat. **One use on the entire site.** |
| `cool` | `cubic-bezier(0.22, 1, 0.36, 1)` | `power3.out` | heat decay, and only heat decay |
| `tick` | `cubic-bezier(0.40, 0, 0.20, 1)` | `power1.out` | hover, focus, toggles, the small stuff |

**Banned outright: `back`, `elastic`, `bounce`, and any `overshoot` parameter.** A 4000-tonne press does not
overshoot. This single rule does more to make the site read as "heavy industry" than any texture will. It
explicitly overrides GSAP preset #8's `back.out(1.4)` and preset #3's `elastic.out(1, 0.4)`.

### 4.2 Duration bands

| Band | Range | Ease | Examples |
|---|---|---|---|
| micro | 140–220ms | `tick` | hover lift, focus ring, button press, toolbar toggle |
| component | 420–620ms | `press` | scroll reveal, card entrance, image fade |
| macro | 800–1400ms | `mass` | section handoff, camera dolly, part swap, pin enter/exit |
| strike | 180ms down | `strike` | the hammer contact frame — the only sub-200ms macro move |
| cool | 2200ms | `cool` | emissive decay after a strike |
| scrub | tied to scroll | none | `scrub: 0.8` default, `scrub: 1.2` for the home hero act |

**Stagger:** 40ms per item, capped at 8 items — item 9 onward gets stagger 0 (a 14-tile marquee at 40ms
takes 560ms to finish entering, which reads as broken). GSAP preset #7 (subtle stagger list) at our numbers.

**`scrub: true` is banned.** Instant tracking is weightless. Always a number.

### 4.3 The scroll model

**Scroll is the conveyor.** There are exactly **three scroll verbs**. If a motion isn't one of these, it
doesn't ship.

1. **DOLLY** — the camera translates along its view axis toward or away from the part. *"You are walking up
   to the part."* Max once per page. Range: `z` from 4.2 → 2.6 over the pinned distance.
2. **INDEX** — the part rotates about **one** principal axis, scroll-mapped, like a part on an inspection
   turntable. Max **220°** over a section (a full 360° reads as an idle spinner). One axis at a time — never
   two.
3. **HANDOFF** — one part exits the frame along a travel axis and the next enters along the same axis, in the
   same canvas. This is the section-to-section verb and it is the literal conveyor. **Never a crossfade** —
   two parts must never occupy the same space at 50% opacity. Ghosting is the tell of a fake transition.

**Banned scroll behaviours:** free orbit driven by scroll; tumbling on two axes simultaneously; parallax
layers travelling in opposite directions; scroll-jacked snapping; any camera roll (`z` rotation) at all.

Auto-rotate: allowed **only** in the `/renders/[slug]` inspection viewer, where the user's job is to look at
the part from all sides, and only at `autoRotateSpeed: 1.2` (existing v2 value). It is an inspection tool
there, not decoration. Everywhere else, motion is scroll-driven.

### 4.4 GSAP presets — specified and rejected

Queried via `search.py --domain gsap`; the set has 16 entries. Specified:

- **#6 Scroll Reveal / Complex (pin + scrub)** — the home hero act and the `/solutions` four-panel act. Its
  own guidance says *"don't pin more than 1–2 sections per page"*; we honour that (`/` has one pinned act,
  `/solutions` has one). `scrub: 0.8`. Its note about `ScrollTrigger.refresh()` after fonts/images load is
  live for us — plus the repo's own landmine: **lazy-mounted pins must debounce `ScrollTrigger.sort()` +
  `refresh()`**, and **pins must tear down in `useLayoutEffect`**.
- **#4 Scroll Reveal / Subtle** (`power1.out`, 300–400ms, `y: 12`, `start: 'top 90%'`,
  `toggleActions: 'play none none reverse'`) — the **site-wide default**. Most things on this site should do
  this and nothing more. Retune to our `press`/`component` band: 480ms, `y: 16`.
- **#5 Scroll Reveal / Standard** — section headers with their eyebrow + rule.
- **#9 Stagger List / Complex (split text)** — **h1 only, and only on `/` and `/about`.** The repo has its
  own `SplitText.tsx` (no GSAP Club licence needed) emitting `[data-char]`; use it. Preset #9's `rotateX: -40`
  is rejected — flat `y: 28` + opacity, `expo.out`, stagger 0.015. Its own warning applies: never split a
  paragraph, ≤8 words.
- **#7 Stagger List / Subtle** — grids: renders hub, materials families, values 3-up.
- **#13 / #14 Parallax Scroll** — the vignette and the eyebrow rail only, `yPercent` ±8 max. One direction.
- **#1 Hover / Subtle** (150–200ms, `power1.out`) — every hover on the site. Preset #2's card tilt and #3's
  3D-tilt magnetic hover are rejected (see §6).
- **#15 Loading / Subtle** — the model-loading state. The existing `LoadProgress` percentage readout is
  better than a shimmer; keep it, retone to dark (`bg-graphite/70`, `text-saffron` — 7.57:1).
- **#10 Page Transition / Subtle** (fade, 200–300ms, `power1.inOut`) — **mandatory choice, not preference.**
  `PageTransition` is fade-in only because AnimatePresence never unmounts pages on framer-motion 12 + React
  19. Presets #11 (overlay wipe) and #12 (shared-element morph) are therefore **impossible**, not merely
  unwanted. Do not attempt a hero morph across routes.
- **#16 Loading / Standard (spinner)** — rejected; see §6.

`MagneticCursor` survives from v2 but retunes from elastic to `press` at the micro band, and its ring goes
`saffron` on dark. It stays gated on `hover: hover` + reduced-motion, as it already is.

### 4.5 Reduced motion and no-WebGL are designed states, not fallbacks

The v2 pass shipped two bugs where reduced-motion users **lost content** (a clipped marquee, and 3 of 4
pinned panels never appearing). The cause both times was freezing an animation instead of rendering a
different tree. **Render a different tree.**

**`prefers-reduced-motion: reduce` — the specified experience:**
- Lenis is disabled; native scroll.
- Every pinned/scrubbed act renders as **stacked static sections**, in document order, all beats present.
  The canvas is replaced by that beat's poster image (§5.9) at the same aspect ratio, with the same caption.
  Nothing is clipped, nothing is `opacity: 0`, nothing depends on a ScrollTrigger having fired.
- `SplitText` renders plain text nodes (no per-char wrappers — also better for screen readers).
- `NumberCounter` renders its final value immediately.
- `ProductsMarquee` becomes a static 2-row grid, all 14 `PRODUCT_IMAGES` visible and reachable.
- Frame sequences (`hammer`, `plant`) render **one** representative frame, not 108.
- Emissive is fixed at 0 everywhere. No heat, ever — heat is animation.
- Reveals become instant; the layout is identical, only the transition is gone.

**No WebGL (context creation fails, GPU blocked, context limit hit):**
- `CanvasErrorBoundary` swaps in the same poster images plus the real copy. The page loses nothing but the
  live render.
- The `/renders` detail viewer keeps its **Download `.glb`** affordance — it works without WebGL, and v2
  already handles this correctly (`canvasFailed` hides rotate/reset/fullscreen, keeps download). Copy that.
- Every canvas has a text equivalent. `role="group"` + `aria-label` + `aria-describedby` pointing at the
  part's `blurb` from `src/data/renders.ts` — v2's `StlViewer` already does exactly this; it is the pattern.

**Both degraded paths must render the same information as the full path.** If a fact only exists inside a
scroll beat, it does not exist.

---

## 5. Page-by-page shot list

Model budget, for reference (meshopt GLB, on disk):
`part-g` 247K · `part-f` 334K · `part-e` 420K · `part-h` 422K · `part-b` 508K · `trunnion-85000103` 532K ·
`tvs-1200` 591K · `part-a` 616K · `part-c` 731K · `part-d` 1019K · `part-i` 1.1M

### 5.1 `/` — Home. One canvas, one pinned act, one part.

**The budget argument that makes this possible:** v2's hero is a 115-frame WebP sequence —
`public/assets/frames/hero/1280` is **6.4 MB**. v3 replaces it with a 247 KB GLB plus the shared three.js
chunk. **The 3D hero is a net payload reduction**, and that is how re-introducing three.js is earned.
A single frame from that sequence survives as the hero poster / LCP image (~56 KB).

The hero part is **`part-g.glb` (247K) — the Forged Sprocket** (`RENDERS[6]`, *"A toothed sprocket forged to
handle high torque and tension in chain-drive systems"*). Chosen because: it is the smallest file on the
site; its toothed silhouette reads as "forged part" to a layperson in one glance; it is radially symmetric,
so the INDEX verb reads cleanly on one axis; and `src/data/solutions.ts` already names it as the sample for
Method 01, Closed Die Forging. It is the site's protagonist.

| Beat | Scroll | 3D | Content | Notes |
|---|---|---|---|---|
| **0 — Cold open** | page load, no scroll | `part-g` in `AS_FORGED`, `emissiveIntensity: 0`, near-silhouette. Camera `z 4.2`. | `HERO_COPY`: eyebrow `EST. 1975 · BANGALORE`, h1 *"Forged in India"* / *"since nineteen seventy-five."* at `display-xl`, subhead, two CTAs. | Poster image is LCP; canvas fades in over it. h1 uses SplitText (preset #9). The part is barely lit — it's cold steel in a dark shop. |
| **1 — Heat** | 0–33% of pinned act | Core pointLight `0 → 2.2`, emissive `0 → 0.35`. Camera DOLLY `4.2 → 3.4`. | `HAMMER_INTRO_WORDS[0]` — **Heat** — at `display-l`, entering on `press`. | The one place on the site heat rises. It is a furnace; that's the exception that proves §3.4. |
| **2 — Strike** | 33–66% | **Not 3D.** Cross to the existing `frames/hammer` WebP sequence (108 frames, 1.3 MB @640 / 2.3 MB @960) via `useScrollImageSequence`. | `HAMMER_INTRO_WORDS[1]` — **Strike**. | Deliberate: real footage of a real hammer beats a render, and it costs nothing new. `strike` ease, 180ms contact. On the contact frame, the 3D layer's emissive is set to 0.35 instantly and then decays on `cool` over 2200ms as we return to the canvas. |
| **3 — Forge** | 66–100% | Back to canvas. `part-g` INDEX 0 → 200° on its ring axis, emissive continuing its decay. Camera holds at `z 3.4`. | `HAMMER_INTRO_WORDS[2]` — **Forge**. | Pin releases here. `end: '+=200%'`, `scrub: 1.2`. |
| **4 — The line** | unpinned, normal scroll | HANDOFF: `part-g` exits left, **`part-h.glb` (Hub, 422K)** enters right, then **`trunnion-85000103.glb` (532K)**. All cold, `AS_FORGED`, emissive 0. | Products marquee copy + `PRODUCT_IMAGES`. | +954 KB, loaded here, not at first paint. Three parts on a conveyor. Cache cap of 3 is exactly met — dispose `part-g` after it exits, reload it for beat 9 (cached). |
| **5 — Materials** | — | **None.** | `MATERIALS_INTRO` + the four families from `src/data/materials.ts` as **paper cards** (§2.3). | The cold inspection bench. The absence of 3D here is the design. |
| **6 — Plant** | — | `frames/plant` sequence (108 frames, 2.0 MB @640 / 3.9 MB @960). | Plant walkthrough copy. | Photographic, as v2. |
| **7 — Heritage** | — | **None.** | `MILESTONES` from `src/data/home.ts` — 1975 / 1985 / 2000 / 2015 / 2022 / 2026. The 2026 entry has `inProgress: true`; give it a saffron dashed rule where the others get solid cinder. | |
| **8 — Stats** | — | **None.** | `STATS`: 8 Power Hammers · 1000+ Metric tons/year · 100+ Parts developed · 1 Day quote-to-part. `data` type role, `tabular-nums`, `NumberCounter`. | |
| **9 — Closing** | — | `part-g` returns in **`SHIPPED`** — machined, oiled, clearcoat 0.35, **emissive hard 0**. Slow INDEX, 40° total. | `CLOSING_CTA`: *"Let's forge something."* / *"Quote-to-part in as little as a day."* | The bookend, and the concept's payoff: same part, one heat later, finished and cold. Zero extra bytes — `part-g` is cached. |

### 5.2 `/about` — heritage as a material state change

One canvas, sticky, right column. Part: **`trunnion-85000103.glb` (532K)** — a real named part number, which
is the point: this page is about a company that has been making numbered things for 51 years.

The four `HERITAGE_CHAPTERS` (1975 Vishweshwarya / 1985 Closed-die / 2000 Malur / Today) scrub past. Across
them the part does **one** INDEX of 180° total, and the **material lerps `AS_FORGED` → `MACHINED`**:
`roughness 0.72 → 0.24`, `color #43474B → #8D9298`. Surface finish is time. Emissive stays 0 throughout —
there is no heat on this page.

Then `VALUES` 3-up and `Sustainability` on the dark ground, `PhotoBreak` full-bleed. No further 3D.

### 5.3 `/products` — the catalogue, and the anti-pattern

`src/data/products.ts` mixes `kind: 'stl'` and `kind: 'image'` items across `featured` (3-up) and
`catalogue` (masonry).

**Zero live canvases in the grid.** A grid of `<Canvas>` tiles is N WebGL contexts and it is the exact
regression this project already shipped once. Tiles are static poster images. The `featured` 3-up gets a
`mass`-eased scale-to-1.02 on hover (preset #1, micro band) and nothing more.

Opening a tile mounts **one** `StlViewer` in the existing overlay — that is the page's 3D moment, on demand,
one context, one model at a time.

### 5.4 `/solutions` — four methods, four camera moves

The strongest page after home. One canvas, pinned left column; `MethodsPinned` already exists.
Each of the four `FORGING_METHODS` HANDOFFs its `sampleSlug` part into the same canvas:

| Method | Part | Size | Camera move — *the motion is the method* |
|---|---|---|---|
| 01 Closed Die (`sampleSlug: 'g'`, Forged Sprocket) | `part-g.glb` | 247K | Camera pushes **straight down the die axis**, `y 2.4 → 0.3`. The one permitted heat pulse on this page: emissive spikes to 0.35 at the bottom of the push, then `cool` over 2200ms. |
| 02 Open Die (`'d'`, Steam Manifold) | `part-d.glb` | 1019K | Camera **arcs 90° around the long axis** — the shop's answer to *"shafts up to 2000 mm"*. Cold. |
| 03 Ring Rolling (`'h'`, Hub) | `part-h.glb` | 422K | Camera holds; the part **INDEXes 220° about its ring axis**. The only place a near-full revolution is correct, because rolling is literally rotation. Cold. |
| 04 Upset (`'i'`, Connecting Rod) | `part-i.glb` | 1.1M | Camera **DOLLYs end-on along the shaft axis**, `z 4.2 → 2.4` — you look down the barrel of the upset end. Cold. |

2.8 MB total, one model at a time, previous disposed on handoff. `scrub: 0.8`, `end: '+=140%'` per panel.

**Reduced motion / no WebGL:** four full-width stacked panels, each with poster + `number`, `title`, `spec`,
`body`, `sampleName`, no pin. **All four present.** This is the exact section that broke in v2 — verify it
by actually toggling the media query, not by reading the code.

### 5.5 `/materials` — the cold bench. No 3D at all.

The four `MATERIALS` families and their `GradeFamily` tables (`C10, C15, C20, EN-2A, EN-3A`, …) rendered as
**paper cards** on the dark ground — the biggest concentration of light surface on the site. `spec` type
role, `tabular-nums`, `ash` hairlines between rows, `ember` for the family number.

Deliberately, emphatically canvas-free. This is the metallurgist's lab: fluorescent light, printed sheets,
no fire. The contrast with `/solutions` is the argument.

`Certifications` sits below on dark.

### 5.6 `/renders` — the hub. One canvas, nine parts, hover-driven.

The catalogue of all 9 `RENDERS`. **Not nine canvases** — nine contexts is instant context loss.

One persistent canvas sits *behind* the grid as a large, softly vignetted stage. The grid tiles are static
posters. On **hover-intent (150ms dwell)** or keyboard focus, the hovered part HANDOFFs into the background
stage, `MACHINED`, slow INDEX. Its `productName` and `blurb` fade in beside it on `press`.

Loading discipline: fetch on dwell, not on hover-start (kills the drag-across-the-grid stampede); **cache cap
3, LRU**, dispose beyond that. Default state (nothing hovered) shows `part-g`, the protagonist.

**Touch:** no hover, so the stage shows the first item and the grid is just a grid. Do not fake hover on tap.

### 5.7 `/renders/[slug]` — inspection

The existing `StlViewer` is correct in structure — keep the tap-to-activate gate, the toolbar, the download,
the `aria-describedby` blurb, the `LoadProgress` readout, the `canvasFailed` handling. Retone to dark:
stage background becomes the graphite + vignette (§3.6), the `bg-snow/70` chips become `bg-graphite/70` with
`text-saffron`, the `AnvilWireframe` placeholder goes `saffron`.

Material: `MACHINED`. This is the one place the user is *inspecting*, so give them the bright, legible state.
`autoRotate` permitted here (§4.3). This is the only route where OrbitControls exists.

### 5.8 `/careers` and `/contact` — no part, no 3D

**`/careers`:** `CAREER_LISTINGS` is an empty array by editorial decision — there is no jobs board. The page
is `CAREERS_CTA` (*"Send us your CV."*) plus `WHAT_WE_LOOK_FOR` 3-up on graphite, one full-bleed photo. The
page with the least content gets the least spectacle. That restraint is a design decision, not a gap.

**`/contact`:** `ContactForm` and the `LOCATION` block are **paper cards** (§2.3) — a form is a document.
Inside them, v2's light-mode rules apply exactly, which means the existing form a11y survives untouched. The
Google Maps embed sits on dark with a cinder hairline. No 3D.

### 5.9 Poster images — new assets, must be produced

Every 3D beat needs a still. These do not exist in the repo yet and **someone has to render them**.

- One per home beat (0, 1, 3, 4, 9), one per `/solutions` panel (4), one per `/renders` item (9), one for
  `/about`. **19 posters.**
- WebP, q72, 1200×900 for stages / 800×800 for grid tiles, target ≤ 70 KB each, hard cap 90 KB.
- Rendered offline from the same rig (§3.3) so poster and live canvas are visually identical — that is what
  makes the canvas fade-in invisible.
- They are **not** dead weight: the home hero poster is the LCP image on every visit, and the grid posters
  are what `/renders` and `/products` show by default. Only the degraded paths load *all* of them.

### 5.10 First-visit budget for `/` (the 12 MB line)

| | |
|---|---|
| JS: framework + gsap + lenis + framer | ~260 KB gz |
| JS: three + r3f + drei (lazy chunk, shared across routes) | ~250 KB gz |
| Fonts: Manrope + Work Sans + Roboto, latin subset | ~90 KB |
| Hero poster (LCP) | ~56 KB |
| `part-g.glb` | 247 KB |
| **First paint / above the fold** | **≈ 0.9 MB** |
| + `frames/hammer` @960 (beat 2) | 2.3 MB |
| + `part-h` + `trunnion` (beat 4) | 954 KB |
| + `frames/plant` @960 (beat 6) | 3.9 MB |
| + marquee + section imagery | ~1.5 MB |
| **Full scroll of `/`** | **≈ 9.6 MB** |

Under 12 MB with ~2.4 MB of headroom, and it only gets there because the 6.4 MB hero frame sequence is gone.
**Measure it. Do not estimate it.** If the number comes in over, the first thing to cut is `frames/plant`
down to the 640 tier (−1.9 MB), not the 3D.

---

## 6. Anti-slop rules

These are the decisions already made in the negative. They exist so four agents working in parallel don't
each independently reach for the same defaults.

**Colour & surface**
1. **No purple, no blue-violet, no cyan.** Not in a gradient, not in a glow, not in a chart. The palette is
   warm-on-graphite and it has no cool accent. The fill light is `#8FA6BC` and that is the coolest thing on
   the site.
2. **No glassmorphism.** No `backdrop-blur` on a semi-transparent card with a 1px white inner border. The
   existing `bg-snow/70 backdrop-blur` chips in `StlViewer` are the *only* blur on the site and they become
   `bg-graphite/70` — a legibility scrim over a canvas, which is what blur is actually for.
3. **No neon.** No colour at full saturation on a dark ground as a *fill*. Saffron is a light source or a
   hairline; it is not a background.
4. **No gradient text.** No gradient buttons. One 4px saffron rule on a paper card is the entire "accent" vocabulary.
5. **Never tint the metal orange.** See §3.4 — the part is grey steel lit by something orange. If a screenshot shows an orange part, it's wrong.

**3D**
6. **No floating particles.** No dust motes, no sparks, no embers drifting upward. Sparks are the single most
   common AI-default addition to a "forge" scene and they instantly read as a stock After Effects overlay.
7. **No rotating cube, torus knot, sphere, or abstract blob** anywhere, in any state, including loading. We
   have eleven real forged parts. Use them. (The existing `AnvilWireframe` torus placeholder is grandfathered
   — it is a deliberate anvil abstraction inside a loading state, not a hero object.)
8. **No bloom, no DOF, no chromatic aberration, no film grain, no `EffectComposer`.** §3.4.
9. **No wireframe-mesh aesthetic**, no exploded-view "tech" overlays with animated measurement callouts, no
   HUD-style corner brackets or scanline reticles. This is a steel forge, not a mech cockpit.
10. **No rounded-corner canvas, no bordered 3D viewport, no drop shadow on a canvas.** §3.6.
11. **No mirror-polished chrome.** `roughness` never goes below 0.22. Forged parts are not chrome bumpers.
12. **No infinite auto-rotate** outside `/renders/[slug]`. §4.3.
13. **No UV-sampled maps and no `anisotropy`.** They will silently render flat. §3.0.

**Motion**
14. **No `back`, `elastic`, or `bounce` easing anywhere.** §4.1.
15. **No 3D card tilt on hover.** No mouse-parallax layers on the hero. No cursor-following blob.
16. **No spinner.** GSAP preset #16 is rejected: we have real byte progress via `useProgress` and a
    percentage is more honest and more on-brand than a rotating arc.
17. **No text that types itself out**, no scrambling/glitch character effects, no counters on decorative
    numbers (only `STATS`, which are real figures).
18. **No horizontal-scroll section.** The marquee is a marquee; it is not a hijacked scroll axis.
19. **No scroll-snap, no scroll-jacking beyond the two specified pins.** Lenis smoothing is the only
    global scroll intervention.
20. **No crossfade between two 3D parts.** HANDOFF or nothing. §4.3.
21. **No motion that loops forever** except the marquee. Everything else has a start and an end.

**Layout & copy**
22. **No 6/6 splits, no centred-everything pages, no three-icon-feature-row with generic line icons.**
23. **No em-dash-heavy AI copy and no invented facts.** Every number, name, grade, and address on this site
    comes from `src/data/*`. There are 8 power hammers, not "10+". The plant is at Plot 300–302, Malur.
24. **No stock-photo abstractions.** Every image is either a real Ommi photo from `public/assets/images/` or
    a render of a real Ommi part.
25. **No "Innovation / Excellence / Quality" three-up of empty values** — `src/data/about.ts` `VALUES` has
    real copy; use it verbatim.

---

## 7. Acceptance checks

Before any agent calls their lane done:

1. `pnpm typecheck` → 0 errors. `pnpm lint` → 0 errors. `pnpm build` → succeeds.
2. Toggle `prefers-reduced-motion: reduce` in devtools and **read every page top to bottom.** Count the
   `/solutions` panels — there must be four. Count the marquee tiles — there must be 14. Nothing clipped,
   nothing invisible.
3. Disable WebGL (`chrome://flags` or `about:config`) and load `/`, `/solutions`, `/renders`,
   `/renders/a`. Every page still communicates its full content; `/renders/a` still offers the download.
4. Tab through every page. The two-tone focus ring is visible on graphite, on saffron, and on paper cards.
5. Navigate `/ → /renders → /renders/a → /solutions → /` five times in a row without reload. No blank
   canvas, no context-loss warning in the console, no `removeChild` crash from a pin.
6. Measure the transfer for a full scroll of `/` in the Network panel. Under 12 MB, or cut per §5.10.
7. **The part is grey.** Do not screenshot and squint — this is measured, and
   `scripts/build-posters.py` enforces it on every bake, exiting non-zero if a
   part fails. Method, which took three lanes and two wrong diagnoses to
   arrive at:

   - **Measure the BODY, not the whole part.** Mask the part against the
     graphite ground, then *erode the mask by ~6px*. §3.3 requires a saffron
     rim and calls it non-negotiable; a metric that counts rim pixels punishes
     the thing the direction mandates and pushes the site toward flat grey.
     What must stay neutral is the faces.
   - **Report two numbers**: mean `R − B` over the body, and the share of body
     pixels with `R − B > 30`. The mean catches an all-over stain; the share
     catches one copper face on an otherwise grey part. Ceilings: **+10** and
     **8%**.
   - **Report body luminance alongside them.** Without it a "fix" that just
     brightens the scene scores well while shipping a section hotter than
     §3.3 intends — which is exactly how an unnecessary exposure compensation
     nearly shipped.
   - **Sample several framings, and both material states.** The cast is
     camera-dependent: it appears when a broad face sits in the mirror
     direction of a warm source and vanishes at three-quarter. Sample the ends
     of any INDEX sweep, not just the resting pose. A single-framing check on
     `/renders` read −2.7 / 0.7% while a part was at **+21.2 / 29.7%** at the
     end of its own sweep.
   - **Machined is the sensitive state, not as-forged.** At roughness 0.42 the
     reflection of a wall stays sharp enough to stain a face; as-forged's 0.58
     blurs it. Sampling as-forged alone hides the problem.

8. **INDEX sweeps rotate about world Y**, on a group that is the PARENT of the
   framing pose. Folding the sweep into the pose's own Euler
   (`rotation.set(x, y + index, z)`) composes as Rx·Ry·Rz, so the part turns
   about its own tilted axis and swells and flattens as it goes — measured at
   ~46px of presented-height variation per part versus ~7px when the spin is
   the parent, and on a flat part a wide sweep can swing it edge-on and
   invisible with nothing thrown. Verify by sampling the silhouette bounding
   box early and late in each sweep.
8. **Grep your lane for `bg-paper` and `text-graphite` page grounds.** ~16 section components still carry
   v2's light-mode grounds and will render as light islands on the dark site until converted. They are not
   paper cards (§2.3) — a paper card is an opt-in boundary around cold technical content, not a leftover.
   Converting them is per-lane work; nobody is doing it centrally.
