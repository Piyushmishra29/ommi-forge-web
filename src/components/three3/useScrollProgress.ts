'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

export type ScrollProgressOptions = {
  /** ScrollTrigger `start`. Default `'top bottom'`. */
  start?: string;
  /** ScrollTrigger `end`. Default `'bottom top'`. */
  end?: string;
  /** Optional side effect on every update, e.g. driving a DOM readout. */
  onUpdate?: (progress: number) => void;
};

/**
 * Scroll progress of a DOM element as a **ref**, not as state.
 *
 * Why a ref
 * ---------
 * This is the bridge between the page's scroll and the scene's frame loop,
 * and it is the single easiest place to destroy the site's performance.
 * `const [p, setP] = useState()` inside a ScrollTrigger `onUpdate` re-renders
 * the React subtree — and therefore reconciles the whole R3F scene graph —
 * on every scroll frame, at 120 Hz on a good laptop. Writing to a ref costs
 * one property assignment, and the scene reads `progressRef.current` inside
 * `useScenePose`, where it was going to run anyway.
 *
 * Call this in the DOM tree (where the element ref lives) and pass the
 * returned ref down into the `<SceneSlot>` children as a prop. Refs are
 * plain objects, so they cross the tunnel into the canvas without any of the
 * context caveats.
 *
 * Reduced motion: this keeps working. The progress is produced by the
 * visitor's own scrolling, not by an autonomous animation, and a scene that
 * poses from it in `useScenePose` stays correct and complete for a
 * reduced-motion visitor — which is exactly the outcome the v2 pass failed
 * to get twice.
 *
 * @example
 * const sectionRef = useRef<HTMLDivElement>(null);
 * const progress = useScrollProgress(sectionRef, { start: 'top center' });
 *
 * return (
 *   <div ref={sectionRef}>
 *     <SceneSlot …>
 *       <HeroPart progress={progress} />
 *     </SceneSlot>
 *   </div>
 * );
 *
 * // inside HeroPart:
 * useScenePose(() => {
 *   group.current.rotation.y = mapRange(progress.current, 0, 1, 0, Math.PI);
 * });
 */
export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  { start = 'top bottom', end = 'bottom top', onUpdate }: ScrollProgressOptions = {},
): RefObject<number> {
  const progress = useRef(0);

  // Latched so changing the callback does not tear down and rebuild the
  // trigger — rebuilding forces a ScrollTrigger refresh, which on a page
  // with pins is a full remeasure.
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        progress.current = self.progress;
        onUpdateRef.current?.(self.progress);
      },
      // A refresh (resize, font load, a lazy section changing the page
      // height) can move the element without a scroll event; re-seed from
      // the recomputed position so the scene never poses from a stale value.
      onRefresh: (self) => {
        progress.current = self.progress;
      },
    });

    // Seed immediately: a slot that mounts already part-way through its
    // range must pose correctly on its very first frame, not on the first
    // scroll after it.
    progress.current = trigger.progress;

    return () => trigger.kill();
  }, [target, start, end]);

  return progress;
}
