'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { BRAND_HEX } from '@/lib/brand';
import {
  MACHINED,
  MATERIAL_STATES,
  type ForgedSteelState,
} from '@/lib/three/materialStates';

/**
 * The one material every forged part on this site should use, in the three
 * named states V3-DIRECTION §3.2 defines.
 *
 * Why it is shared
 * ----------------
 * Two reasons, one visual and one measurable. Visually, four scene authors
 * each picking their own `metalness`/`roughness` gives four different metals
 * on one page, which is the single most common way a 3D site stops looking
 * art-directed — and it already happened here: `roughness` drifted to 0.24 in
 * one place and 0.42 in another because each lane spread its own object.
 * Measurably, every distinct material configuration compiles its own
 * `WebGLProgram`, and shader compilation is a multi-millisecond main-thread
 * stall (`PERF_BUDGET.maxPrograms` is 24 for that reason).
 *
 * Pick a state, override a prop if you must, but do not hand-roll a second
 * material.
 *
 * Requires `<ForgeEnvironment>` in the same slot. These are metals: without an
 * environment map there is almost nothing to reflect and they render near-black.
 */

/* -------------------------------------------------------------------------- */
/*  The three states (§3.2)                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Re-exported from `@/lib/three/materialStates`, which holds the numbers with
 * **no three.js import at all**. That split is deliberate: the poster driver
 * and DOM-side rig files need these values too, and when they lived in this
 * file (which imports `THREE.Color` for the heat ramp) they could not reach
 * them without pulling the renderer — so they kept private copies, which is
 * how `roughness` drifted 0.24-vs-0.42. Import from either place; they are
 * the same objects.
 */
export {
  AS_FORGED,
  MACHINED,
  SHIPPED,
  MATERIAL_STATES,
  type ForgedSteelState,
} from '@/lib/three/materialStates';

/**
 * @deprecated Use `MACHINED`, or the `state` prop. Kept as an alias so an
 * existing `{...FORGED_STEEL}` spread keeps working.
 */
export const FORGED_STEEL = MACHINED;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type SharedMaterialProps = Omit<
  ThreeElements['meshPhysicalMaterial'],
  'ref' | 'emissive' | 'emissiveIntensity'
>;

export type ForgedSteelMaterialProps = SharedMaterialProps & {
  /**
   * Which §3.2 state to render. Defaults to `'machined'` — the state every
   * current consumer uses — not to §3.2's stated default of AS_FORGED, so
   * that existing spreads keep behaving.
   *
   * Explicit props still win over the state, so `state="as-forged"` with
   * `roughness={0.5}` does what it looks like.
   */
  state?: ForgedSteelState;

  /**
   * 0 = cold steel. 1 = just out of the furnace.
   *
   * Drives an emissive ramp from a deep oxide red into forge orange, so a
   * scene can narrate a press stroke by animating one number. Purely
   * additive — it never touches base colour, so a heated part still reflects
   * its environment correctly.
   *
   * Values above ~0.6 read as genuinely hot; keep the resting state at 0 and
   * treat heat as an event, not a look. On a site about 4000-tonne presses,
   * a permanently glowing part is the difference between "controlled heat"
   * and "sci-fi". §3.4 allows it in exactly two places on the whole site.
   */
  heat?: number;
};

/**
 * @example
 * // §3.2's default state, on the raw forging.
 * <mesh geometry={geometry.geometry} dispose={null}>
 *   <ForgedSteelMaterial state="as-forged" />
 * </mesh>
 *
 * @example
 * // Heat pulsing with a scroll-driven press stroke.
 * <ForgedSteelMaterial state="as-forged" heat={heat} />
 */
export function ForgedSteelMaterial({
  state = 'machined',
  heat = 0,
  ...overrides
}: ForgedSteelMaterialProps) {
  const preset = MATERIAL_STATES[state];
  const clampedHeat = heat < 0 ? 0 : heat > 1 ? 1 : heat;

  // Memoised because a new THREE.Color per render would re-upload the
  // uniform every frame a scene animates `heat`.
  // `#8A2814` is `--color-oxide` from globals.css — the darkest step of the
  // warm ramp. It is not in `BRAND_HEX` yet (that file is another lane's),
  // hence the literal.
  const emissive = useMemo(
    () =>
      new THREE.Color('#8A2814').lerp(
        new THREE.Color(BRAND_HEX.saffron),
        clampedHeat,
      ),
    [clampedHeat],
  );

  const common = {
    ...preset,
    emissive,
    // Squared so the glow stays out of the way at low heat and only takes
    // over once the scene really means it.
    emissiveIntensity: clampedHeat * clampedHeat * 2.2,
    ...overrides,
  };

  // Only SHIPPED needs the physical shader. Everything else stays on
  // `meshStandardMaterial` so the site does not pay for a clearcoat-capable
  // program it never uses.
  if (state === 'shipped') {
    return <meshPhysicalMaterial {...common} />;
  }
  return <meshStandardMaterial {...common} />;
}

export default ForgedSteelMaterial;
