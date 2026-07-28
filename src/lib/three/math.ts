/**
 * Frame-rate-independent motion helpers shared by every v3 scene.
 *
 * Why this file exists
 * --------------------
 * The single most common bug in scroll-driven three.js work is
 * `value += (target - value) * 0.1` inside `useFrame`. That reads fine at
 * 60 Hz and moves *twice as fast* on a 120 Hz laptop — which is exactly the
 * class of "feels laggy / feels twitchy depending on the machine" report
 * this project already got once. Everything here takes `delta` and behaves
 * identically at 30, 60, 120 and 144 Hz.
 *
 * Deliberately tiny and dependency-free: `three` ships `MathUtils.damp`,
 * but importing the whole `MathUtils` namespace for one function pulls more
 * than it saves, and the scenes need `mapRange`/`smoothstep` anyway.
 */

/** Clamp `v` into `[min, max]`. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Clamp `v` into `[0, 1]`. */
export function saturate(v: number): number {
  return clamp(v, 0, 1);
}

/** Plain linear interpolation. `t` is not clamped — callers usually want that. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Exponential smoothing toward `target`, independent of frame rate.
 *
 * `lambda` is a *rate*, in "e-folds per second": roughly, the value closes
 * ~63% of the remaining gap every `1 / lambda` seconds. Useful range for
 * scroll-follow motion on this site is 3 (heavy, machined inertia — the
 * register the brief asks for) to 12 (snappy, for cursor parallax).
 *
 * @example
 * useSceneFrame((_, delta) => {
 *   group.current.rotation.y = damp(group.current.rotation.y, targetY, 4, delta);
 * });
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  delta: number,
): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

/**
 * `damp` for anything with x/y/z — mutates `out` in place and returns it, so
 * it can be applied straight to `object.position` / `object.rotation` inside
 * a frame callback without allocating a Vector3 per frame.
 */
export function damp3<T extends { x: number; y: number; z: number }>(
  out: T,
  targetX: number,
  targetY: number,
  targetZ: number,
  lambda: number,
  delta: number,
): T {
  out.x = damp(out.x, targetX, lambda, delta);
  out.y = damp(out.y, targetY, lambda, delta);
  out.z = damp(out.z, targetZ, lambda, delta);
  return out;
}

/**
 * Remap `v` from `[inMin, inMax]` onto `[outMin, outMax]`, clamped at both
 * ends. The workhorse for turning a 0–1 scroll progress into a camera
 * position over a sub-range of a pinned section.
 *
 * @example
 * // Model only tilts during the middle 40% of the pin.
 * const tilt = mapRange(progress, 0.3, 0.7, 0, Math.PI / 6);
 */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = saturate((v - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * t;
}

/**
 * Hermite ease between two edges — `mapRange` with the corners rounded off.
 * Prefer this over `mapRange` whenever the output drives something the eye
 * tracks continuously (opacity, camera position); the C1 continuity is the
 * difference between "machined" and "stepped".
 */
export function smoothstep(edge0: number, edge1: number, v: number): number {
  if (edge0 === edge1) return v < edge0 ? 0 : 1;
  const t = saturate((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Degrees → radians. three.js takes radians everywhere; art direction is
 * always written in degrees. Spelling the conversion out beats `* 0.0174533`
 * scattered through four scene files.
 */
export function rad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
