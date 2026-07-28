# `three3` — the v3 3D engine

One WebGL context per route. Sections rent rectangles of it.

This directory is the substrate the scene work is built on. It owns the canvas,
the frame loop, model loading, adaptive quality, the degradation paths, and the
default look. Scenes own composition, camera moves and art direction.

---

## The 60-second version

```tsx
// app/page.tsx  — a client component
'use client';
import {
  Scene3DProvider, SceneSlot, dynamicScene,
  MODELS, MODEL_PRIORITY, preloadModel,
} from '@/components/three3';

// The scene body lives in its own module and is loaded on approach.
const HeroScene = dynamicScene(() => import('@/components/sections/home/HeroScene'));

export default function Page() {
  return (
    <Scene3DProvider>
      <main id="main">
        <SceneSlot
          accessibleName="Forged connecting rod turning under a hard key light"
          description="A closed-die forged connecting rod rotates slowly, showing its
            I-beam web, big-end bore and the parting line left by the press."
          className="h-[80vh] w-full"
          fallback={<HeroStill />}       // real content — images + text
          onApproach={() => preloadModel(MODELS.i.url, MODEL_PRIORITY.hero)}
        >
          <HeroScene />
        </SceneSlot>
      </main>
    </Scene3DProvider>
  );
}
```

```tsx
// components/sections/home/HeroScene.tsx — the 3D half
'use client';
import { ForgeEnvironment, ForgeLights, ForgedPart, MODELS } from '@/components/three3/scene';

export default function HeroScene() {
  return (
    <>
      <ForgeEnvironment />
      <ForgeLights preset="hero" />
      <ForgedPart url={MODELS.i.url} shading="creased" />
    </>
  );
}
```

---

## Two entry points, and why it matters

| Import from | Contains | Cost |
| --- | --- | --- |
| `@/components/three3` | provider, slot, `dynamicScene`, preloading, progress, budget, maths | **no three.js** |
| `@/components/three3/scene` | materials, lights, environment, frame hooks, `ForgedPart` | pulls three.js |

`three3` is imported by page components, so it must stay free of three.js —
otherwise the renderer lands in the first-paint chunk and the entire lazy design
is decorative. `three3/scene` is imported only by scene bodies, which are always
behind `dynamicScene()`.

### Required pattern

**A scene body must live in its own module, loaded with `dynamicScene()`.**

`<SceneSlot>` already defers the canvas and drei. But if the page writes
`<SceneSlot><ForgeLights/>…</SceneSlot>` inline, the page statically imports
`three3/scene`, and three.js is in the page chunk regardless. Putting the scene
body behind `dynamicScene()` is what makes "nothing 3D on first paint" true.

Measured: a page mounting the provider and one slot costs **+13.3 KB raw /
+5.1 KB gzip** over the same page with no 3D at all. three.js (≈1.2 MB across
three async chunks) arrives only when a slot enters its approach margin.

---

## Lifecycle of a slot

1. **Server / first paint** — renders `fallback`. Zero three.js bytes. This is
   what a crawler indexes and what a no-JS or no-WebGL visitor keeps.
2. **Within `approachMargin`** (default `600px 0px`) — arms the provider (the
   `<Canvas>` is created), fetches the 3D chunk, fires `onApproach`.
3. **Intersecting the viewport** — reports visible; the frame driver starts
   advancing and this slot's box is scissored and drawn each frame.
4. **Scrolled away** — reports invisible. The scene stays mounted, but nothing
   in it draws, and if it was the last visible slot the renderer stops entirely.

---

## API

### `<Scene3DProvider>`

One per route, mounted as high as possible. Renders `children` plus a single
fixed, pointer-events-none canvas layer.

| Prop | Default | Notes |
| --- | --- | --- |
| `zIndex` | `1` | Above the page's opaque background, far below the header's `z-[1000]`. |

Constraints:

- Never inside an ancestor with `transform`, `filter` or `perspective` — any of
  those make the fixed canvas position against that ancestor, not the viewport.
- DOM that must read **on top of** the 3D needs `relative z-10`.

`useScene3D()` gives `{ store, webgl, motion, reducedMotion }` anywhere in the
DOM tree below it. It is **not** available inside slot children (see *Context
does not cross the tunnel*).

### `<SceneSlot>`

A rectangle of the shared canvas tied to a box in normal document flow.

| Prop | Required | Notes |
| --- | --- | --- |
| `accessibleName` | ✅ | Announced as the region's name. A `<canvas>` exposes nothing to assistive tech; the type system refuses a scene without one. |
| `description` | ✅ | Full text equivalent, rendered visually hidden, wired with `aria-describedby`. |
| `fallback` | ✅ | Real content — a static render with real `alt`, or the same information as prose. Not a spinner. |
| `children` | ✅ | R3F elements only. DOM here will not render. |
| `className` / `style` | | The layout box. `relative` is added for you. |
| `index` | `1` | Paint order among overlapping slots. Must be ≥ 1. |
| `approachMargin` | `'600px 0px'` | How far ahead the slot arms. |
| `onApproach` | | Fires once, on entering the approach margin. The place to `preloadModel`. |
| `as` | `'div'` | `div` \| `section` \| `figure`. |

A slot rendered outside a provider degrades to its `fallback` and logs a dev
error — it does not throw. Under `output: 'export'` a throw would abort
`next build` for the whole site.

### Frame hooks — `useSceneFrame` vs `useScenePose`

This distinction is the reduced-motion contract. Get it right and reduced-motion
users see a complete page; get it wrong and they see a frozen one.

```ts
useSceneFrame(cb)   // ANIMATION. Skipped under prefers-reduced-motion.
useScenePose(cb)    // POSING.    Always runs while the slot is visible.
```

> **Rule of thumb:** if freezing the callback would make the section *wrong or
> empty*, it is a pose. If freezing it would just make the section *calmer*, it
> is animation.

Both are gated on the slot actually being on screen, and both clamp `delta` to
`MAX_FRAME_DELTA` so a scene returning from a background tab lags a beat rather
than teleporting.

Also: `useSceneMotion(): boolean`, `useSceneQuality(): 'high' | 'medium' | 'low'`.

### `useScrollProgress(ref, { start, end })`

Scroll progress of a DOM element as a **ref**, not state. A `setState` in a
ScrollTrigger `onUpdate` re-reconciles the whole R3F tree on every scroll frame
at 120 Hz. Call it in the DOM tree, pass the ref into the slot's children as a
prop (refs cross the tunnel fine), read `.current` inside `useScenePose`.

```tsx
const sectionRef = useRef<HTMLDivElement>(null);
const progress = useScrollProgress(sectionRef, { start: 'top center' });
// …
useScenePose((_, delta) => {
  const target = mapRange(progress.current, 0, 1, 0, Math.PI);
  group.current.rotation.y = motion ? damp(group.current.rotation.y, target, 5, delta) : target;
});
```

### Models

```ts
MODELS.a … MODELS.i, MODELS.trunnion, MODELS.tvs1200   // { url, bytes }
MODEL_PRIORITY.hero | approaching | intent | idle       // queue tiers — use these, not bare numbers
```

| API | Where | Purpose |
| --- | --- | --- |
| `preloadModel(url, priority)` | DOM or scene | Fire-and-forget warm-up. Use on *intent*. |
| `usePreloadModels(urls, { when })` | DOM | Same, as a hook. |
| `useModelProgress(urls)` | DOM | `{ active, progress, error }`, byte-weighted, determinate from the first chunk. |
| `useModelGeometry(url, opts)` | scene | `{ geometry, status, progress, error }`. |
| `<ForgedPart url … />` | scene | The whole thing, with the house material on it. |

Guarantees: a URL is fetched and parsed **once** per page load however many
scenes ask for it; at most 2 loads run at a time, highest priority first; a
queued model's priority can be *raised* by a later request.

**Ownership:** geometry belongs to the cache. Never `.dispose()` it, and put
`dispose={null}` on any `<mesh geometry={…}>` that consumes it — several slots
may share the exact instance. `<ForgedPart>` already does this.

**Residency is bounded and reference-counted.** The geometry cache is
module-global and survives SPA navigation, so it evicts least-recently-used
entries above `PERF_BUDGET.maxCachedTriangles`. Eviction can never free a
buffer a mounted mesh is drawing from:

- `useModelGeometry` retains on mount and releases on unmount, and it is the
  only acquisition path any scene uses.
- An entry becomes a candidate only at **zero references** *and* after
  `PERF_BUDGET.geometryEvictionGraceMs` (5 s) at zero — so holding the
  outgoing geometry in a ref for a few frames across a part handoff is safe.
- If nothing is evictable the cache simply runs over budget. Corrupting a
  live scene to hit a number would be the worse failure.
- Calling `prepareGeometry` directly gives you an entry at zero references;
  if you hold it past the grace window, call `retainGeometry(prepared.key)`
  yourself. No scene does this — use the hook.

`getGeometryResidency()` returns `{ entries, referenced, triangles, cap }`.

> **Deliberate deviation from V3-DIRECTION §3.5.** §3.5 asks for "3 loaded
> GLBs live at any moment". The cap here is a triangle budget of 1.5M
> (≈ six typical parts), not a hard count of 3, because `/solutions` alone
> holds four parts (263k triangles measured) and a cap of 3 would dispose and
> re-parse a 1 MB GLB every time a visitor scrolled back up a section —
> trading a memory problem nobody has for a main-thread hitch everybody would
> feel. Lower the one constant in `budget.ts` if a real device runs short.

`shading: 'creased'` splits sharp edges so they catch light like machined steel.
It de-indexes the geometry (~3× the GPU buffer), so it is right for a hero part
and wasteful for eight thumbnails.

### Look

```tsx
<ForgeEnvironment />        // procedural IBL, 0 bytes downloaded — §3.3 by default
<ForgeLights />             // §3.3's four lights, verbatim, by default
<ForgedSteelMaterial state="as-forged" />   // §3.2's three named states
```

**Material states (§3.2).** `state="as-forged" | "machined" | "shipped"`,
defaulting to `machined`. Use the state rather than spreading a local object —
per-lane copies are exactly how `roughness` drifted to 0.24 in one place and
0.42 in another. Explicit props still win over the state.

| State | Where | Notes |
| --- | --- | --- |
| `as-forged` | hero beat 1, `/solutions`, `/renders` hub | `metalness: 0.75`, **amended from §3.2's 1.0** — mill scale is an oxide layer, substantially dielectric. At 1.0 there is no diffuse term, so `#43474B` can only tint reflections and never reaches the screen. |
| `machined` | `/about` scrub end, `/renders` detail | `roughness: 0.42`, not §3.2's 0.24 (see table below). |
| `shipped` | home closing CTA, **once** | The only state on `meshPhysicalMaterial` — `MeshStandardMaterial` has no clearcoat. Costs one extra shader program, so it is scoped to that single usage. |

Measured for the amendment, against the shipped rig defaults (part-d, mean R−B
over non-background pixels / % above +30): metalness `1.00` → +4.1, 5.8%;
`0.70`/`0.75`/`0.80` → +4.3, 5.0%. The 0.7–0.8 range is visually
indistinguishable, so 0.75 is the midpoint rather than a fitted value.

> **The copper cast was real, and it was an environment bug, not a material
> one.** I first reported it as non-reproducible — that was wrong, and the
> error was my sample: part-d in as-forged is one of the cases that doesn't
> show it. The driver is a **warm rear wall**, which stains broad faces angled
> toward it, and `machined`'s roughness 0.42 keeps that reflection sharp where
> `as-forged`'s 0.58 blurs it. On the shipped defaults, machined: part-f
> +16.5 / 29.7%, part-i +19.3 / 25.0%. Fixed by making the rear panel cool
> (`coolColor: '#8FA6BC'`) → part-f −5.5 / 0.4%, part-i −3.9 / 2.0%. Found by
> v3-showroom. **Never set `coolColor` warm.**

**All three are correct with no arguments.** They did not used to be — the
environment defaulted to a peach warm colour applied to the panels a
`metalness: 1` surface mostly reflects, which rendered the steel bronze
(violating §6.5, failing §7.7), and `ForgeLights` had §3.3's fill and rim
temperatures inverted, losing the saffron rim that draws a dark part's
outline on a dark ground. Defaults now match V3-DIRECTION §3.3 / §3.2 and
v3-showroom's on-screen-verified `stage-rig.ts`, so passing those values
explicitly is a no-op rather than a correction.

Non-obvious values, all deliberate:

| | Value | Why |
| --- | --- | --- |
| `ForgeEnvironment` `roomIntensity` | `1.0` | Below ~0.6 the enclosing shell goes near-black, faces reflect a void, and the part reads as a black cutout with chrome edges. |
| `ForgeEnvironment` `warmColor` | `#FFF4E8` | Roof lights + rake. **Never make this orange** — §6.5. |
| `ForgeEnvironment` `coolColor` | `#FF7A2B` | Historical name. It drives the *rear* panel, i.e. §3.3's forge mouth. |
| `ForgeLights` fill | cool `#8FA6BC` | The cool side. |
| `ForgeLights` rim | saffron `#FF9933` | "Non-negotiable on a dark site" — §3.3. |
| `FORGED_STEEL.roughness` | `0.42` | Not §3.2's 0.24: that assumes twin roof softboxes we don't ship, and 0.24 under our rig is mirror chrome (§6.11 floor is 0.22). |

`ForgeLights` presets differ in *levels only* — colours and positions are
§3.3 for all three, so there is one rig on this site, not three. Need one
light nudged? `ambientLevel` / `keyLevel` / `fillLevel` / `rimLevel` multiply
on top, so you can stay on the shared rig instead of declaring four lights
inline and drifting.

`<ForgeEnvironment>` builds a small emissive-quad "shop" — overhead key, a
narrow raking strip, a cool back rim, dark walls — and runs it through three's
`PMREMGenerator`. **There is no HDRI in this repo and there must not be one**:
a real `.hdr` is 1–4 MB (v2 deleted a 1.6 MB one), and drei's
`<Environment preset>` *downloads* its HDRI from the pmndrs CDN at runtime.
Cost here: one 256px cube render of ~6 quads plus the PMREM mip chain, once per
renderer, cached and shared by every slot.

Metal is almost entirely reflection: **`<ForgedSteelMaterial>` requires a
`<ForgeEnvironment>` in the same slot.** Without one it renders near-black.

`ForgeLights` is deliberately restrained because the environment does most of
the work. Shadows are off by default — a shadow map re-renders for every slot
that draws; for a part on a surface, drei's `<ContactShadows>` is cheaper,
better looking, and matchable by the offline poster renderer. The shared
canvas does enable `shadowMap`, so `<ForgeLights shadows>` genuinely works;
with no casting light it costs nothing.

---

## Performance

`PERF_BUDGET` (`src/lib/three/budget.ts`) is the contract. Ceilings, not targets:

| Key | Value |
| --- | --- |
| `maxRouteTransferBytes` | 12 MB |
| `maxModelsOnFirstPaint` | 0 |
| `maxConcurrentModelLoads` | 2 |
| `dpr` | `[1, 2]` |
| `maxTrianglesPerFrame` | 900,000 |
| `maxDrawCallsPerFrame` | 120 |
| `maxVisibleSlots` | 4 |
| `maxPrograms` | 24 |

**Dev overlay:** append `?stats=1` to any URL (or set
`NEXT_PUBLIC_SCENE_STATS=1`). Shows fps, triangles, draw calls, programs,
visible slots, DPR, quality tier, model bytes — turning saffron when a budget is
crossed. Off by default everywhere; check your own section against it.

**Adaptive DPR** walks resolution down when the rolling frame time exceeds
`targetFrameMs` and back up when it recovers, quantised to 0.25 so a borderline
machine doesn't thrash the resize path.

**Nothing renders while nothing is visible.** The frame driver runs on GSAP's
ticker (the same one Lenis uses, so scroll and scene share a frame and the
scissor rects never trail the page by one frame) and simply does not call
`advance()` when no slot is on screen or the tab is hidden. Under reduced motion
it becomes demand-driven — it advances on scroll, resize and model completion
only.

---

## Degradation

| Situation | Behaviour |
| --- | --- |
| Server / pre-hydration | `fallback`. The exported HTML ships real content. |
| No WebGL | Probed **before** any canvas mounts, so there is no flash of empty stage. `fallback` forever. |
| Context lost | Canvas stays mounted (so `webglcontextrestored` can fire), slots show `fallback`. |
| Context restored | Canvas remounts fresh; every geometry re-uploads. |
| Renderer constructor throws | `CanvasErrorBoundary` (v2's, reused) catches it and flips the provider to `unsupported`. |
| SPA nav away from a 3D route | `THREE.WebGLRenderer: Context Lost.` is logged once. **Expected, not a defect** — R3F's `unmountComponentAtNode` calls `forceContextLoss()` on dispose. The guard's listener is already removed by then, so nothing flips to `lost`. |
| `prefers-reduced-motion` | 3D still renders — content is never lost. `useSceneFrame` stops; `useScenePose` keeps running; the driver goes demand-based. |

---

## Gotchas worth ten minutes of your time

**Context does not cross the tunnel.** Slot children are portalled into the
canvas by drei's `<View>`, and React resolves context where an element
*renders*, not where it was written. A provider wrapped around `<SceneSlot>`
will not reach its children. Pass refs and plain values as props instead; the
slot re-establishes its own context on the inside for `useSceneFrame` &co.

**Frame ordering** is fixed by `FRAME_PRIORITY`: prologue (-1000) clears the
frame and resets `gl.info`; scene callbacks run at 0; each slot draws at its
`index` (≥ 1); the stats epilogue reads back at 1000. Any `useFrame` priority
> 0 flips R3F into manual-render mode, which is exactly what `<View>` depends
on — do not move these numbers casually.

**Never spread possibly-`undefined` props over defaults.** `{ ...DEFAULTS,
...props }` overwrites a default with an explicit `undefined`, and a component
that destructures optional props hands you exactly that. This cost real hours
here: it turned every environment panel colour into `NaN`, which turned the
cube map into `NaN`, which made *every* `meshStandardMaterial` on the page
render pure black — lights and all, because one NaN sample poisons the whole
fragment. Resolve keys with `??`.

**`dispose={null}`** on meshes using cached geometry. See *Ownership* above.

---

## Files

```
src/components/three3/
  Scene3DProvider.tsx     provider, WebGL probe, context-loss state, canvas mount latch
  SceneCanvas.tsx         the single <Canvas>: frame driver, prologue, adaptive DPR, stats
  SceneSlot.tsx           DOM box + a11y contract + approach/visibility observers
  SlotView.tsx            drei <View> wrapper — the only dynamically-imported three.js door
  SlotContext.tsx         what a scene can see about its slot
  useSceneFrame.ts        useSceneFrame / useScenePose / useSceneMotion / useSceneQuality
  useModel.ts             useModelGeometry (scene side)
  useModelProgress.ts     useModelProgress / usePreloadModels (DOM side, three-free)
  useScrollProgress.ts    ScrollTrigger → ref bridge
  ForgeEnvironment.tsx    procedural PMREM environment
  ForgeLights.tsx         analytic rig, three presets
  ForgedSteelMaterial.tsx the house metal, with a heat ramp
  ForgedPart.tsx          load + frame + material, composed
  SceneStats.tsx          dev overlay (must stay three-free)
  dynamicScene.ts         the lazy-scene wrapper
  index.ts / scene.ts     the two entry points

src/lib/three/
  budget.ts          PERF_BUDGET + assertSceneBudget
  framePriority.ts   FRAME_PRIORITY + MAX_FRAME_DELTA
  math.ts            damp / damp3 / lerp / clamp / mapRange / smoothstep / rad
  modelManifest.ts   MODELS (with exact byte sizes) + MODEL_PRIORITY
  modelCache.ts      priority queue, dedupe, determinate progress
  geometryCache.ts   dequantize → centre → rescale → normals, shared
  sceneStore.ts      slot registry, visibility, quality tier
  webgl.ts           capability probe
```

`src/components/three/*` (v2's `StlViewer`, `StlPreview`, `glb.ts`) is untouched
and still in use on `/renders`. `glb.ts`'s `dequantize()` is imported and reused
here — every model on the site depends on it.
