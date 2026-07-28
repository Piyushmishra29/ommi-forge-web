'use client';

import { type RefObject } from 'react';
import type * as THREE from 'three';
import { ForgeStage as ShowroomStage } from '@/components/three/ForgeStage';

/**
 * The home page's stage: material states (§3.2) and the light rig (§3.3).
 *
 * CANVAS-SIDE MODULE — it imports `three3/scene` and therefore three.js.
 * Only import it from a scene body that is itself behind `dynamicScene()`.
 * Importing it from `HeatAct.tsx` or `page.tsx` would put the renderer in
 * the first-paint chunk and undo the engine's laziness.
 *
 * Why this file exists at all, given the engine ships `<ForgedSteelMaterial>`
 * and `<ForgeLights>`
 * ------------------------------------------------------------------------
 * Two of the direction's numbers cannot be expressed through those:
 *
 *  1. `ForgedSteelMaterial` ramps `emissiveIntensity` to `heat² × 2.2`.
 *     §3.4 caps emissive at **0.35** — "above that the material stops being
 *     metal and becomes a lamp" — so the shared ramp is 6× over the ceiling
 *     for this page. The heat here is carried by the core point light
 *     instead, which is what makes the glow pool in the part's own hollows
 *     rather than wash it flat.
 *  2. `SHIPPED` needs `clearcoat` (a part really does ship under a rust
 *     preventive film), and clearcoat only exists on `MeshPhysicalMaterial`.
 *     The shared material is a `meshStandardMaterial`.
 *
 * The *rig* is not re-derived here: `<ForgeStage>` from
 * `@/components/three/ForgeStage` is the site-wide corrected environment +
 * §3.3 light table, shared with `/renders` and with the offline poster
 * renderer. Mounting the same one is what makes a part look identical
 * whichever page the visitor met it on — and it is what lets the home
 * posters in `public/assets/posters/` be the same picture as the canvas
 * (§3.6, §5.9). This file adds only the one thing that rig deliberately
 * lacks: the core heat light, which exists on this page and nowhere else.
 */

/* -------------------------------------------------------------------------- */
/*  §3.2 — Materials, three named states                                      */
/* -------------------------------------------------------------------------- */

/**
 * The materials are NOT defined here.
 *
 * `AS_FORGED` / `SHIPPED` come from `three3/scene` — three lanes each
 * spreading a private object is exactly how `roughness` drifted to 0.24 in
 * one place and 0.42 in another, and this file was one of the offenders (it
 * carried its own `#767C82` at `metalness: 0.9`, chosen to stop the part
 * rendering as a black silhouette). The shared `AS_FORGED` now fixes that
 * centrally and more correctly, at `metalness: 0.75` — mill scale is an
 * oxide, which is a dielectric, so it genuinely has a diffuse term.
 *
 * What this file still owns is the one thing that is home-only: **heat**.
 */

/**
 * Ceiling for `emissiveIntensity`. §3.4 says "never exceeds 0.35"; this sits
 * under it, and the measurement is why.
 *
 * This is also why the scene drives the emissive by hand instead of using
 * `<ForgedSteelMaterial heat={…}>`: that prop ramps to `heat² × 2.2`, eleven
 * times §3.4's ceiling, and it ramps toward saffron rather than forge orange.
 * Driving it from `useScenePose` also keeps heat off the React render path —
 * a `heat` prop would reconcile the R3F tree on every scroll frame.
 *
 * §3.2 sets `emissive` to mesh (`#FF5533`) and §3.4 caps the intensity at
 * 0.35. Those two numbers together do not describe hot steel — they describe
 * a lamp. `#FF5533` at 0.35 is a *uniform additive* (0.35, 0.030, 0.012) in
 * linear light, about +127 R−B on every pixel of the part before any light
 * touches it. Sampled on the exported build at beat 1: mean R−B **+91.3**
 * with **95.8%** of the part's pixels visibly orange, i.e. no steel left in
 * it at all — §7.7 failing about twice as hard as the bronze-default bug.
 *
 * So the emissive floor comes down and, more importantly, its COLOUR now
 * ramps (see `HEAT_RAMP`). Heat is still two signals in lockstep and it still
 * only ever falls; it just stops painting the part orange.
 *
 * Re-measured after the shared `AS_FORGED` landed: `metalness: 0.75` on a
 * `#43474B` base is a *darker* part than the one this was first tuned
 * against (luma 51 vs 68), so the same emissive floor was a larger share of
 * each pixel and beat 1 went back up to +41.0 R−B. The floor came down again
 * and the core light went up to compensate — which is the better trade
 * anyway: a uniform emissive paints every pixel equally, while the core light
 * pools in the webs and undercuts, and pooling is what §3.4 actually asks for.
 */
export const MAX_EMISSIVE = 0.1;

/**
 * Ceiling for the core heat light. Under §3.4's 2.2 on a `metalness: 1`
 * surface this was one broad specular lobe rather than pooled heat, because a
 * full metal has no diffuse term for it to land in. The shared `AS_FORGED` is
 * now `metalness: 0.75`, so there IS a diffuse term — the light finally does
 * the job §3.4 describes, lighting the hollows and the web from inside — and
 * it can carry more of the heat while the flat emissive floor carries less.
 */
export const MAX_CORE_LIGHT = 1.6;

/**
 * The colour of the heat itself, ramped.
 *
 * Steel does not go from cold to forge-orange; it goes dull oxide red, then
 * cherry, then orange, and it loses them in reverse as it cools. Ramping the
 * emissive colour rather than only its intensity is what makes the low end of
 * the curve read as *warm steel* instead of as dim orange paint — and it is
 * what the engine's own shared material does, for the same reason.
 *
 * `#8A2814` is `--color-oxide`, the darkest step of the brand's warm ramp;
 * `#FF7A2B` is §3.3's forge-mouth colour.
 */
export const HEAT_RAMP = { cold: '#8A2814', hot: '#FF7A2B' } as const;

/* -------------------------------------------------------------------------- */
/*  §3.3 — Light rig                                                          */
/* -------------------------------------------------------------------------- */

export type ForgeStageProps = {
  /**
   * Receives the core heat light so the scene can drive its intensity from
   * the same per-frame callback that drives the material. Omit on a cold
   * stage and no point light is mounted at all — one fewer light in every
   * shader on pages that have no heat.
   */
  coreRef?: RefObject<THREE.PointLight | null>;
  /** Master multiplier on the analytic rig. Cheapest exposure control. */
  intensity?: number;
};

/**
 * Environment + analytic lights, per §3.3's table.
 *
 * Division of labour: the environment map is the metal's surface (two long
 * strip reflections read as brushed steel); these four lights add the things
 * an env map cannot — a directional key with a stated direction, a cool fill
 * that can be dialled independently, and a warm rim that separates a dark
 * part from a dark stage.
 *
 * The env's warm/cool are re-pointed to §3.3's temperatures (~4800K key,
 * ~7000K fill) rather than the engine defaults, so reflection and analytic
 * light agree instead of reading as two different rooms.
 *
 * L4, the "forge mouth", is folded into the rim light rather than mounted
 * separately: both sit behind and to the left, both exist to make saffron
 * read as *temperature* rather than as a UI accent painted on the metal, and
 * a second back-left warm source at unit scale is a shader cost with no
 * visible difference.
 *
 * No shadows: `SceneCanvas` constructs the renderer without `shadows`, so
 * `castShadow` here would be a silent no-op, and a `<ContactShadows>` plane
 * under a part that is not resting on anything invents a floor the
 * composition does not have.
 */
export function ForgeStage({ coreRef, intensity = 1 }: ForgeStageProps) {
  return (
    <>
      {/* The site's rig, not a second one. `<ForgeEnvironment>`'s own
          defaults tint the steel bronze — `warmColor` is brand peach and is
          applied to both the raking strip and the side fill, and at
          `metalness: 1` a part is almost entirely reflection, so it renders
          orange-brown in direct violation of §6.5. The shared stage passes
          §3.3's roof-light white instead, repurposes the rear panel as the
          forge mouth, and lifts the shell off near-black so flat faces
          reflect the page rather than a void. It also declares §3.3's four
          lights inline, because `<ForgeLights>` has the fill and rim
          temperatures the wrong way round. */}
      <ShowroomStage intensity={intensity} />

      {/* Core heat — the one addition. Mounted at the part's origin so it
          lights the webs, hollows and undercuts from the inside: heat pools
          where a real part holds heat, which no emissive map could do and
          this geometry could not sample anyway (there are no UVs — §3.0).
          Omitted entirely on cold stages, so those compile one light fewer. */}
      {coreRef ? (
        <pointLight
          ref={coreRef}
          position={[0, 0, 0]}
          intensity={0}
          color="#FF7A2B"
          distance={2.5}
          decay={2}
        />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  §3.4 — Heat, as a function of scroll                                      */
/* -------------------------------------------------------------------------- */

/**
 * Beat boundaries of the home act, in act progress (0–1). §5.1's table.
 *
 * `contact` is frame 53 of the 108-frame hammer sequence — the second of
 * the clip's four spark-burst impacts, and the one the strike beat is cut
 * around (see MEDIA_MANIFEST: impacts land at 28, 53, 76, 100).
 */
export const BEATS = {
  /** Cold open holds until the visitor has actually committed to scrolling. */
  heatIn: 0.06,
  /** Furnace is at temperature; end of beat 1. */
  heatFull: 0.33,
  /** Footage covers the canvas. */
  strikeIn: 0.34,
  /** The hammer lands. Heat is re-applied here, instantly. */
  contact: 0.49,
  /** Footage uncovers the canvas; beat 3 begins. */
  strikeOut: 0.64,
  /** Beat 3 proper — the INDEX turn. */
  forgeIn: 0.66,
} as const;

/**
 * Heat as a 0–1 ramp over act progress. Multiply by `MAX_EMISSIVE` for the
 * material and by `MAX_CORE_LIGHT` for the core light — the two signals are
 * always in step, which is what stops the glow reading as a UI colour.
 *
 * Shape, and why it is this shape (§3.4):
 *   0 → heatIn      cold. The part is grey steel in a dark shop.
 *   heatIn → full   the ONE place on the site heat rises. It is a furnace;
 *                   that is the exception that proves the rule.
 *   full → contact  held. The bar is in the fire and the ram is falling.
 *   contact → 1     **falls, and only falls.** Cubic rather than linear
 *                   because cooling steel does not ease linearly — this is
 *                   the scrub-domain equivalent of `power3.out` over 2200ms.
 *
 * It never pulses, never breathes, never loops. A pulsing glow is the
 * single clearest tell of an AI-default 3D scene.
 */
export function heatCurve(p: number): number {
  if (p <= BEATS.heatIn) return 0;
  if (p < BEATS.heatFull) {
    const t = (p - BEATS.heatIn) / (BEATS.heatFull - BEATS.heatIn);
    // smoothstep: the furnace comes up without a visible corner at either end.
    return t * t * (3 - 2 * t);
  }
  if (p < BEATS.contact) return 1;
  // Reaches zero at p = 0.95, so the part is demonstrably cold before the
  // pin releases — the concept's whole argument is that heat only falls.
  const t = Math.min((p - BEATS.contact) / (0.95 - BEATS.contact), 1);
  const fall = 1 - t;
  return fall * fall * fall;
}
