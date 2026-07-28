'use client';

import { BRAND_HEX } from '@/lib/brand';

/**
 * Analytic light rig — V3-DIRECTION §3.3's table, verbatim, as the default.
 *
 * Division of labour, which is the thing to understand before changing any
 * number here: `<ForgeEnvironment>` does almost all the work on metal
 * (reflection is what metal *is*), and these lights exist for the parts it
 * cannot do — a directional key with a defined shadow direction, a cool
 * bounce that keeps the shadow side alive, and a saffron rim that separates
 * the silhouette from the graphite ground. Used without an environment the
 * numbers below will look flat and grey; used with one they are deliberately
 * restrained.
 *
 * TEMPERATURE ASSIGNMENT IS NOT A TASTE CALL. The fill is cool (`#8FA6BC`,
 * a ~7000K bounce off sheet-metal walls) and the rim is **saffron**. This
 * component shipped with those two inverted — warm fill, cool rim — which
 * §3.3 calls out specifically: the saffron rim is "non-negotiable on a dark
 * site", because it is the only thing drawing the outline of a dark part on
 * a dark ground. v3-showroom abandoned this component over it and declared
 * §3.3's four lights inline instead. Fixed here so nobody has to do that
 * again.
 *
 * All positions are in the unit-scale space that `geometryCache` normalises
 * parts into (bounding radius 1), so "3 units away" means "three part-widths
 * away" regardless of how big the original CAD model was.
 *
 * Register check: hard key, saffron rim, dark surround. Heavy industry under
 * shop lighting — not a neon product launch.
 */

export type ForgeLightPreset =
  /** §3.3 verbatim. Dramatic, high-contrast; one part large on a dark stage. */
  | 'hero'
  /** §3.3 levels lifted and flattened, so a grid of parts reads consistently. */
  | 'showroom'
  /** §3.3 levels pulled down except the rim: near-silhouette. */
  | 'dark';

export type ForgeLightsProps = {
  preset?: ForgeLightPreset;
  /** Master multiplier over the whole rig. Cheapest exposure control. */
  intensity?: number;
  /**
   * Enable shadow casting from the key light — §3.3's "the only shadow
   * caster". OFF by default and worth keeping that way: a shadow map is
   * re-rendered for every slot that draws, so turning it on in four sections
   * costs four shadow passes per frame. For a part sitting on a surface,
   * drei's `<ContactShadows>` is cheaper, better looking, and matchable by
   * the offline poster renderer.
   */
  shadows?: boolean;
  /** Override the key light position, in part-radii. */
  keyPosition?: [number, number, number];

  /**
   * Per-light level overrides, multiplied on top of the preset and the
   * master `intensity`. These exist so a scene that needs one light nudged
   * can stay on the shared rig instead of declaring four lights inline and
   * quietly drifting from §3.3.
   */
  ambientLevel?: number;
  keyLevel?: number;
  fillLevel?: number;
  rimLevel?: number;
};

/**
 * §3.3's table. Colours and positions are fixed across every preset — only
 * levels vary — so there is exactly one rig on this site, not three.
 */
const RIG = {
  /** Lifts black to near-black. Any higher and the form flattens. */
  ambient: { color: BRAND_HEX.slag, intensity: 0.12 },
  /** ~4800K shop light, upper front-right. The only shadow caster. */
  key: {
    color: '#FFF4E8',
    intensity: 2.4,
    position: [2.6, 3.4, 2.2] as [number, number, number],
  },
  /** ~7000K bounce off sheet-metal walls; keeps the shadow side alive. */
  fill: {
    color: '#8FA6BC',
    intensity: 0.55,
    position: [-3.0, 0.6, 1.4] as [number, number, number],
  },
  /** The forge, behind and to the left. Draws the silhouette. */
  rim: {
    color: BRAND_HEX.saffron,
    intensity: 1.6,
    position: [-1.2, 1.0, -3.2] as [number, number, number],
  },
} as const;

type Levels = { ambient: number; key: number; fill: number; rim: number };

const PRESETS: Record<ForgeLightPreset, Levels> = {
  hero: { ambient: 1, key: 1, fill: 1, rim: 1 },
  showroom: { ambient: 2.2, key: 0.85, fill: 1.3, rim: 0.7 },
  dark: { ambient: 0.5, key: 0.7, fill: 0.5, rim: 1.25 },
};

/**
 * @example
 * <ForgeEnvironment />
 * <ForgeLights />            // §3.3 exactly — correct with no arguments
 *
 * @example
 * // Slightly hotter overall, rim pushed for a darker section.
 * <ForgeLights intensity={1.15} rimLevel={1.2} />
 */
export function ForgeLights({
  preset = 'hero',
  intensity = 1,
  shadows = false,
  keyPosition,
  ambientLevel = 1,
  keyLevel = 1,
  fillLevel = 1,
  rimLevel = 1,
}: ForgeLightsProps) {
  const levels = PRESETS[preset];
  const key = keyPosition ?? RIG.key.position;

  return (
    <>
      <ambientLight
        color={RIG.ambient.color}
        intensity={
          RIG.ambient.intensity * levels.ambient * ambientLevel * intensity
        }
      />

      {/* Key — upper front-right, the same direction the roof light and the
          rake in ForgeEnvironment come from, so highlight and shadow agree. */}
      <directionalLight
        position={key}
        color={RIG.key.color}
        intensity={RIG.key.intensity * levels.key * keyLevel * intensity}
        castShadow={shadows}
        // Framed to a unit part with a little headroom; a default shadow
        // camera (±5) would waste most of the map's resolution on empty space
        // and give visibly blocky edges.
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        // §3.3's values. The normal bias is what stops a dense CAD surface
        // acne-ing against its own curvature at this map resolution.
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Cool fill from the opposite side. Cool, not warm: the two sides of
          the part must differ in temperature, and the warm one is the rim. */}
      <directionalLight
        position={RIG.fill.position}
        color={RIG.fill.color}
        intensity={RIG.fill.intensity * levels.fill * fillLevel * intensity}
      />

      {/* Saffron rim from behind — the forge. The one light that must survive
          being turned down: without it a dark part on a dark stage loses its
          outline entirely. */}
      <directionalLight
        position={RIG.rim.position}
        color={RIG.rim.color}
        intensity={RIG.rim.intensity * levels.rim * rimLevel * intensity}
      />
    </>
  );
}

export default ForgeLights;
