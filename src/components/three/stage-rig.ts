/**
 * The showroom rig — one set of numbers for every place this lane puts a
 * forged part on screen: the `/renders` hub stage, the `/renders/[slug]`
 * inspection viewer, and the offline poster renderer.
 *
 * WHY IT IS A MODULE AND NOT FOUR SETS OF PROPS
 * V3-DIRECTION §5.9 requires the poster and the live canvas to be visually
 * identical — that identity is what makes the canvas fade-in invisible
 * rather than a visible pop. Identity is only maintainable if there is one
 * place to change. `scripts/posters/poster.html` mirrors this file by hand
 * (a browser module cannot import TSX); its constants are annotated to say
 * so, and changing a number here means changing it there and re-running
 * `scripts/build-posters.py`.
 *
 * Pure data — no three.js import, so a DOM-side component may read it.
 */


/* -------------------------------------------------------------------------- */
/*  Environment                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Options handed to `<ForgeEnvironment>`. Three departures from what §3.3
 * reads like on paper, all of them forced by measurement rather than taste.
 *
 * `warmColor` — this colours the roof lights AND the raking strip, which
 *   together are most of what a `metalness: 1` surface reflects. At the
 *   original peach default the steel rendered bronze, violating §6.5 ("the
 *   part is grey steel lit by something orange, never orange steel").
 *   `#FFF4E8` is §3.3's ~4800K shop white.
 *
 * `coolColor` — a COOL tone, and this one is counter-intuitive enough to be
 *   worth the paragraph. §3.3 describes a forge mouth: the one saturated
 *   source in the scene, behind and to the left, a `scale 3` circle at
 *   `[-4, 0.5, -4]`. `ForgeEnvironment` has no such circle — it paints this
 *   key as a 7 x 2.4 panel filling the wall *directly* behind the part. A
 *   part with any broad face angled toward that wall mirrors it, and at
 *   MACHINED's roughness 0.42 the mirror is sharp. Measured on the offline
 *   rig, with the wall orange: the Crank's shank read body R−B +16.5 with
 *   29.9% of interior pixels over 30, and the Connecting Rod +21.4 / 25.6% —
 *   §7 check 7 failing outright, on the state this lane actually ships.
 *   Returning the panel to the fill temperature drops those to −5.1 / 0.3%
 *   and −4.1 / 1.8% with no regression anywhere else.
 *
 *   The warmth did not go away, it went where §3.3 always put it: on the RIM
 *   LIGHT (`STAGE_LIGHTS.rim`, saffron at 1.6), which stays at full strength.
 *   A light draws a warm edge; a wall tints whole faces.
 *
 * `roomIntensity` up from 0.12 — at the shipped default the enclosing shell
 *   is near-black, so any face not pointing at a panel reflects a void and
 *   the part reads as a black cutout with chrome edges.
 *
 * Regressions here are caught automatically: `scripts/build-posters.py`
 * measures every baked still and exits non-zero if a part goes orange.
 */
export const STAGE_ENV = {
  keyIntensity: 4.0,
  rakeIntensity: 2.0,
  rimIntensity: 1.4,
  roomIntensity: 1.0,
  warmColor: '#FFF4E8',
  // §2.2: the fill temperature, and "the coolest thing on the site" (§6.1).
  coolColor: '#8FA6BC',
} as const;

/** `scene.environmentIntensity`. The cheapest exposure control there is. */
export const STAGE_ENV_INTENSITY = 1.15;

/* -------------------------------------------------------------------------- */
/*  Analytic lights (§3.3, verbatim)                                          */
/* -------------------------------------------------------------------------- */

/**
 * §3.3's table, as data.
 *
 * `<ForgeStage>` no longer renders these directly — it uses `<ForgeLights>`,
 * which carries the same table as its own default now that its inverted
 * fill/rim temperatures are fixed at source. This export survives as the
 * mirror `scripts/build-posters.py` reads from, since a Python driver cannot
 * import the component, and as the one written-down copy of §3.3's numbers.
 *
 * No `castShadow`: the shared `<Canvas>` in `three3/SceneCanvas` does not
 * enable `shadows`, so a slot cannot cast one even if it asked. Depth comes
 * from the rim and the CSS vignette (§3.6) instead, and — because the
 * offline poster renderer has no shadow either — poster and canvas match.
 */
export const STAGE_LIGHTS = {
  /** Lifts black to near-black. Any higher and the form flattens. */
  ambient: { color: '#2A2D31', intensity: 0.12 },
  /** ~4800K shop light, upper front-right. */
  key: { color: '#FFF4E8', intensity: 2.4, position: [2.6, 3.4, 2.2] },
  /** ~7000K bounce off sheet-metal walls; keeps the shadow side alive. */
  fill: { color: '#8FA6BC', intensity: 0.55, position: [-3.0, 0.6, 1.4] },
  /** The forge, behind and to the left. Draws the silhouette. */
  rim: { color: '#FF9933', intensity: 1.6, position: [-1.2, 1.0, -3.2] },
} as const;

/* -------------------------------------------------------------------------- */
/*  Camera                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The showroom camera, shared by the hub stage, the inspection viewer and the
 * offline poster renderer.
 *
 * `fov: 32` is §3.3's number, and it is now the site's number: `/solutions`
 * and `/about` both mount a per-slot `<PerspectiveCamera makeDefault>` at 32
 * rather than inheriting the shared canvas's 35, so this lane matches them.
 * The hub stage mounts its own too — drei's `<View>` portals its own R3F
 * store, so `makeDefault` scopes to the slot and does not reach across the
 * canvas into another section's viewport.
 *
 * `z: 5.0`, not §3.3's 4.2. At 4.2/32 a radius-1 part fills 83% of the frame
 * height, which is right for a full-bleed act and wrong here: the same square
 * master has to survive a 3:4 catalogue tile, and a part that large loses its
 * corners the moment the frame is not square. At 5.0/32 it sits at ~70%, with
 * margin on every side.
 */
export const STAGE_CAMERA = {
  fov: 32,
  position: [0, 0, 5] as const,
  near: 0.1,
  far: 100,
} as const;

/* -------------------------------------------------------------------------- */
/*  Material                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Materials are NOT defined here.
 *
 * They live in `@/lib/three/materialStates` — a module with **zero imports**,
 * so anything can read it: a DOM-side component, a scene, or the eye of
 * someone maintaining `scripts/build-posters.py`. Use
 * `<ForgedSteelMaterial state="…" />` in a scene, or import `AS_FORGED` /
 * `MACHINED` / `SHIPPED` directly when you need the numbers.
 *
 * This file briefly carried its own copies, because the values were trapped
 * inside `ForgedSteelMaterial.tsx`, which imports `THREE.Color` for the heat
 * ramp — and `stage-rig` is read from the DOM side, where pulling three.js
 * would land the renderer in a first-paint chunk. 3d-core extracted them,
 * which removed the reason for the copies, so they are gone. That same
 * trapping is what produced the `roughness` 0.24-vs-0.42 drift in the first
 * place.
 */

/* -------------------------------------------------------------------------- */
/*  Pose                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Resting orientation per part, in radians.
 *
 * Parts come out of CAD in whatever orientation the customer's drawing used,
 * so each one gets an angle chosen by eye for the most legible silhouette.
 * This is the one thing in this file that is taste rather than physics — and
 * it has to be shared, because the poster is rendered at exactly this pose
 * and the live stage starts from it.
 */
const POSES: Record<string, readonly [number, number, number]> = {
  // 0.75, not 0.55: at the shallower tilt this part's broad flat face lands
  // in the saffron rim's mirror direction at the START of the INDEX sweep and
  // read 29.7% orange there — a framing the hub actually shows. Tilting it
  // forward takes it out of that angle: worst framing 29.7% -> 2.4%. The X
  // tilt is the lever here, not the sweep width or the Y angle.
  'part-a': [0.75, -0.7, 0],
  'part-b': [0.22, -0.7, 0],
  'part-c': [0.3, -0.6, 0],
  'part-d': [0.55, -0.6, 0],
  'part-e': [0.25, -0.65, 0],
  'part-f': [0.22, -0.75, 0],
  'part-g': [0.35, -0.55, 0],
  'part-h': [0.4, -0.5, 0],
  'part-i': [0.2, -0.8, 0],
  'trunnion-85000103': [0.22, -0.7, 0],
  'tvs-1200': [0.28, -0.65, 0],
};

const DEFAULT_POSE = [0.22, -0.7, 0] as const;

/** Resting pose for a GLB url. Falls back to the house three-quarter angle. */
export function poseFor(modelUrl: string): readonly [number, number, number] {
  const stem = (modelUrl.split('/').pop() ?? '').replace(/\.glb$/i, '');
  return POSES[stem] ?? DEFAULT_POSE;
}

/* -------------------------------------------------------------------------- */
/*  Motion                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * §4.1's five named curves, as GSAP ease strings. Named here so a scene
 * cannot quietly reach for `back.out` — §4.1 bans `back`, `elastic` and
 * `bounce` outright, on the grounds that a 4000-tonne press does not
 * overshoot.
 */
export const EASE = {
  /** Anything that arrives: reveals, entrances, text. */
  press: 'expo.out',
  /** Anything moving under its own weight: camera, part travel, handoff. */
  mass: 'power2.inOut',
  /** Hover, focus, toggles. */
  tick: 'power1.out',
} as const;

/**
 * §4.3 INDEX: the part turns about **one** principal axis, scroll-mapped,
 * like a part on an inspection turntable. Scroll-driven rather than a
 * `useFrame` spin because §6.12 bans infinite auto-rotate outside
 * `/renders/[slug]`, and because a turntable the visitor drives reads as
 * inspection where one that turns by itself reads as a screensaver.
 *
 * 96°, not §4.3's 220° ceiling, and the sweep is **centred on the resting
 * pose** — `(progress - 0.5) * SWEEP` — rather than starting from it. The
 * catalogue holds flat parts (the Lever's extents are 1.96 × 1.79 × 0.49),
 * and a sweep that starts at the good angle spends most of the section
 * showing them edge-on, i.e. as a line. Centred and halved, the pose the
 * part was framed for is what the visitor sees for most of the scroll, and
 * the ±48° either side is enough to read the depth of a forging.
 */
export const INDEX_SWEEP_RAD = (96 * Math.PI) / 180;

/**
 * §4.3 HANDOFF: one part leaves the frame along the travel axis and the next
 * enters along the same axis. Never a crossfade — two parts at 50% opacity is
 * the tell of a fake transition (§6.20).
 *
 * 3.4 world units clears the half-width of the widest stage we draw
 * (fov 35 at z 5 is ±1.58 vertically, ±2.4 at a 1.5 aspect), so the outgoing
 * part is genuinely off-frame at the moment its geometry is swapped.
 */
export const HANDOFF_TRAVEL = 3.4;

/** Macro band (§4.2): section handoff / part swap. Out then in, per leg. */
export const HANDOFF_MS = 420;
