'use client';

import { useSyncExternalStore } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { FRAME_PRIORITY, MAX_FRAME_DELTA } from '@/lib/three/framePriority';
import type { QualityTier } from '@/lib/three/sceneStore';
import { useSlot } from './SlotContext';

export type SceneFrameCallback = (state: RootState, delta: number) => void;

export type SceneFrameOptions = {
  /**
   * `useFrame` priority. Leave it alone unless you know why you are moving
   * it — see `FRAME_PRIORITY`. Anything >= 1 will paint *after* some slot's
   * scissored draw and therefore be a frame late.
   */
  priority?: number;
};

/**
 * Per-frame **animation**, gated on two conditions the scene should not have
 * to remember:
 *
 *   1. the slot's box is actually on screen, and
 *   2. the visitor has not asked for reduced motion.
 *
 * Use this for anything that moves on its own: idle rotation, drifting
 * lights, a shimmer. Under `prefers-reduced-motion: reduce` it simply does
 * not run — which is correct precisely *because* it is only used for
 * autonomous motion. Anything the scene needs in order to be complete and
 * legible belongs in `useScenePose` instead, so a reduced-motion visitor
 * still gets the whole picture.
 *
 * `delta` is clamped to `MAX_FRAME_DELTA`; a scene returning from a
 * background tab lags a beat rather than teleporting.
 *
 * @example
 * useSceneFrame((_, delta) => {
 *   group.current.rotation.y += delta * 0.25;
 * });
 */
export function useSceneFrame(
  callback: SceneFrameCallback,
  options: SceneFrameOptions = {},
): void {
  const slot = useSlot();
  useFrame((state, delta) => {
    if (!slot.visibleRef.current) return;
    if (!slot.motion) return;
    callback(state, Math.min(delta, MAX_FRAME_DELTA));
  }, options.priority ?? FRAME_PRIORITY.scene);
}

/**
 * Per-frame **posing** — "put everything where it belongs for the current
 * state", as opposed to "advance it a bit".
 *
 * Runs whenever the slot is on screen, *including* under reduced motion, and
 * that is the whole point: a scroll-driven scene that only updated inside
 * `useSceneFrame` would freeze at its initial pose for a reduced-motion
 * visitor and silently lose content — the exact bug class the v2 pass found
 * twice. Because the frame driver is demand-based in reduced-motion mode,
 * this still costs nothing while the page is idle: it is called on the
 * frames that scroll, resize or a finished model actually ask for.
 *
 * Rule of thumb: if freezing this callback would make the section wrong or
 * empty, it is a pose. If freezing it would just make the section calmer, it
 * is animation.
 *
 * @example
 * // progressRef is fed by ScrollTrigger; see useScrollProgress.
 * useScenePose((_, delta) => {
 *   const target = mapRange(progressRef.current, 0, 1, 0, Math.PI);
 *   // Damp under motion, snap when the visitor asked for no motion.
 *   group.current.rotation.y = motion
 *     ? damp(group.current.rotation.y, target, 5, delta)
 *     : target;
 * });
 */
export function useScenePose(
  callback: SceneFrameCallback,
  options: SceneFrameOptions = {},
): void {
  const slot = useSlot();
  useFrame((state, delta) => {
    if (!slot.visibleRef.current) return;
    callback(state, Math.min(delta, MAX_FRAME_DELTA));
  }, options.priority ?? FRAME_PRIORITY.scene);
}

/**
 * `true` when this slot is allowed to animate. Branch on it for anything
 * that is not a per-frame callback — choosing a static camera angle,
 * skipping a particle system, picking `targetRadius` for a part.
 */
export function useSceneMotion(): boolean {
  return useSlot().motion;
}

/**
 * Ask the engine to repaint.
 *
 * A no-op while motion is enabled — every frame renders anyway. Under
 * reduced motion the loop is demand-driven, so **any change a scene makes
 * outside a frame callback has to say so**: swapping a mesh, toggling a
 * light, reacting to a click. Forgetting is how a reduced-motion visitor
 * ends up looking at a stale picture.
 *
 * @example
 * const requestRender = useRequestRender();
 * const onSelect = (part: string) => { setPart(part); requestRender(); };
 */
export function useRequestRender(): (frames?: number) => void {
  const { store } = useSlot();
  return store.requestRender;
}

/**
 * Current adaptive quality tier, driven by the performance monitor.
 *
 * Scenes should treat this as a hint to shed *their own* cost — fewer
 * instances, a cheaper material, no contact shadows — on machines that have
 * already been measured as struggling. The engine handles resolution itself;
 * this is for everything it cannot decide for you.
 */
export function useSceneQuality(): QualityTier {
  const { store } = useSlot();
  return useSyncExternalStore(
    store.subscribe,
    store.getQuality,
    () => 'high' as const,
  );
}
