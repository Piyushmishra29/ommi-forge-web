/**
 * Global `useFrame` ordering for the shared canvas.
 *
 * R3F sorts frame callbacks by ascending priority and — critically — any
 * subscriber with a priority **greater than zero** switches the renderer into
 * manual mode, which is what drei's `<View>` relies on to issue its own
 * scissored draws. These four numbers are the whole contract:
 *
 *   prologue (-1000)  clear the frame, reset the stats counters
 *   scene    (0)      scene animation / posing — runs before anything draws,
 *                     and 0 does NOT flip manual mode, so a page with no
 *                     slots still behaves like an ordinary R3F canvas
 *   slot     (>= 1)   one scissored `gl.render()` per visible slot, in
 *                     `index` order (higher index paints later, on top)
 *   epilogue (1000)   read the accumulated `gl.info` back out
 *
 * Lives in `lib` rather than next to the canvas so that a scene importing
 * `useSceneFrame` does not drag the entire canvas module — and three.js with
 * it — into its chunk.
 */
export const FRAME_PRIORITY = {
  prologue: -1000,
  scene: 0,
  slot: 1,
  epilogue: 1000,
} as const;

/**
 * Largest `delta` (seconds) ever handed to a scene callback.
 *
 * Returning from a background tab, or a long main-thread stall, produces a
 * multi-second delta. Fed straight into `position += velocity * delta` that
 * teleports the scene; fed into a damping term it overshoots. Clamping to
 * ~3 frames means the worst case is a scene that lags for a beat and catches
 * up, instead of one that jumps.
 */
export const MAX_FRAME_DELTA = 1 / 20;
