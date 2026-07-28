/**
 * V3-DIRECTION §3.2's three material states, as plain data.
 *
 * Why this is a separate, three-free module
 * -----------------------------------------
 * These values are needed in three places that cannot all import three.js:
 *
 *   1. `<ForgedSteelMaterial>`, which renders them (imports three);
 *   2. DOM-side modules and rig files that only need the numbers;
 *   3. `scripts/posters/` — the offline poster driver, which mirrors them
 *      into a browser module by hand.
 *
 * When the values lived inside `ForgedSteelMaterial.tsx` (which imports
 * `THREE.Color` for the heat ramp), (2) and (3) had no way to reach them
 * without dragging the renderer in, so they kept their own copies. That is
 * exactly how `roughness` drifted to 0.24 in one place and 0.42 in another.
 * Keeping the numbers here, with no imports at all, means there is one
 * authoritative definition that anything can read.
 *
 * If you find yourself writing a second copy of these values, import this
 * file instead.
 */

/**
 * **A — AS_FORGED.** Mill scale, straight off the hammer. §3.2's default
 * state: hero beat 1, `/solutions`, the `/renders` hub.
 *
 * `metalness: 0.75` is an **amendment to §3.2**, which specified 1.0. At 1.0
 * a surface has no diffuse term at all — it is pure reflection, and the base
 * colour survives only as a tint on what it reflects, so `#43474B` could
 * never reach the screen. **Mill scale is an oxide layer, substantially
 * dielectric, not bare metal**; 1.0 was modelling the wrong class of
 * substance. At 0.75 the diffuse term returns and the colour reads as the
 * dark blue-grey scale §3.2 asks for.
 *
 * Chosen at the midpoint of the approved 0.7–0.8 range because rendering
 * showed the range visually indistinguishable (mean R−B +4.3 / 5.0% orange
 * at all three, against +4.1 / 5.8% at 1.0) — picking an edge would have
 * been fitting to noise.
 */
export const AS_FORGED = {
  color: '#43474B',
  metalness: 0.75,
  roughness: 0.58,
  envMapIntensity: 1.0,
} as const;

/**
 * **B — MACHINED.** The finished faces: bright, directional. The end of
 * `/about`'s heritage scrub, and `/renders` detail views where the part is
 * the subject.
 *
 * `roughness: 0.42` is **not §3.2's 0.24.** That number assumes §3.3's twin
 * large roof softboxes; the environment we actually ship has one broad roof
 * panel and one narrow raking strip against a dark shell, and under it a 0.24
 * surface renders as mirror-polished chrome — exactly what §6.11 exists to
 * prevent. 0.42 restores the machined read and stays clear of the 0.22 floor.
 * Verified on screen by v3-showroom, not reasoned about.
 *
 * This is also the state most sensitive to a warm rear wall: at 0.42 the
 * reflection of the back panel stays sharp enough to stain a broad face. See
 * `ForgeEnvironment`'s `coolColor` — that is why it is cool.
 */
export const MACHINED = {
  color: '#8D9298',
  metalness: 1.0,
  roughness: 0.42,
  envMapIntensity: 1.15,
} as const;

/**
 * **C — SHIPPED.** Machined and oiled for transit. Used **once**, at the home
 * page closing CTA, as the bookend.
 *
 * The clearcoat is motivated rather than decorative — parts really do ship
 * under a rust-preventive film — and it is the only state needing
 * `MeshPhysicalMaterial`, since `MeshStandardMaterial` has no clearcoat. That
 * costs one extra shader program, which is why it is scoped to a single
 * usage rather than offered as a general option.
 */
export const SHIPPED = {
  color: '#8D9298',
  metalness: 1.0,
  roughness: 0.3,
  envMapIntensity: 1.0,
  clearcoat: 0.35,
  clearcoatRoughness: 0.12,
} as const;

export type ForgedSteelState = 'as-forged' | 'machined' | 'shipped';

export const MATERIAL_STATES = {
  'as-forged': AS_FORGED,
  machined: MACHINED,
  shipped: SHIPPED,
} as const;
