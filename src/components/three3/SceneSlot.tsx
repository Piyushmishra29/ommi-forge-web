'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/cn';
import { useOptionalScene3D } from './Scene3DProvider';
import { SlotContext, type SlotApi } from './SlotContext';
import { createSceneStore } from '@/lib/three/sceneStore';

/**
 * Stand-in store used only when a slot is rendered outside a provider. It is
 * never armed and never read by a renderer, so registering against it is
 * inert — it just keeps the hook order and the observer code identical on
 * both paths.
 */
const NULL_STORE = createSceneStore();

/**
 * Loaded on approach, never on mount — see `SlotView` for why this boundary
 * exists. Declared at module scope so its component identity is stable
 * across renders.
 */
const SlotView = dynamic(() => import('./SlotView').then((m) => m.SlotView), {
  ssr: false,
});

export type SceneSlotProps = {
  /**
   * What this 3D view *is*, in a few words, for someone who cannot see it.
   * Announced as the accessible name of the region.
   *
   * Required, and required for a reason: a `<canvas>` exposes nothing at all
   * to assistive tech. A scene that mounts without a name is a hole in the
   * page for a screen-reader user, so the type system refuses it.
   *
   * @example "Forged connecting rod, rotating slowly against a dark stage"
   */
  accessibleName: string;

  /**
   * The full text equivalent — everything the sighted user learns from
   * watching this scene. Rendered visually hidden and wired up with
   * `aria-describedby`.
   *
   * @example "A closed-die forged connecting rod turns to show its I-beam
   *           web, big-end bore and the parting line left by the press."
   */
  description: string;

  /**
   * Real content shown instead of the 3D view whenever WebGL is
   * unavailable, still probing, or the context has been lost — and in the
   * server-rendered HTML, which is every visitor's first paint.
   *
   * Required, and it must be genuine content: a static render image with
   * real `alt` text, or the same information as prose. Not a spinner, not an
   * empty box. This is the version of the page a crawler indexes and a
   * locked-down browser gets to keep.
   */
  fallback: ReactNode;

  /** The 3D scene. R3F elements only — DOM here will not render. */
  children: ReactNode;

  className?: string;
  style?: CSSProperties;

  /**
   * Paint order among slots on the same page, >= 1. Higher paints later.
   * Only matters when two slots' boxes overlap.
   */
  index?: number;

  /**
   * How far ahead of the viewport this slot arms itself — the moment at
   * which three.js is fetched, the canvas is created and `onApproach` fires.
   * Default `600px 0px`, i.e. roughly half a screen of warning at desktop
   * heights, which is enough to hide a model load behind the scroll.
   */
  approachMargin?: string;

  /**
   * Fired once, when the slot first enters `approachMargin`. The right place
   * to `preloadModel(...)` — preloading on mount would defeat the whole
   * lazy-loading design.
   */
  onApproach?: () => void;

  /** Element rendered for the slot's box. Default `div`. */
  as?: 'div' | 'section' | 'figure';
};

/**
 * A rectangle of the shared canvas, tied to a box in the normal document
 * flow.
 *
 * This is the *only* way scenes get on screen in v3. There is no second
 * `<Canvas>` anywhere, which is what keeps the site to one WebGL context no
 * matter how many sections show 3D.
 *
 * Lifecycle, in order:
 *   1. Server / first paint — renders `fallback`. Zero three.js bytes.
 *   2. Within `approachMargin` of the viewport — arms the provider (canvas
 *      is created), fetches the 3D chunk, fires `onApproach`.
 *   3. Intersecting the viewport — reports visible; the frame driver starts
 *      advancing and this slot's box is drawn each frame.
 *   4. Scrolled away — reports invisible. The scene stays mounted (cheap)
 *      but nothing in it draws, and if it was the last visible slot the
 *      renderer stops entirely.
 *
 * @example
 * <SceneSlot
 *   accessibleName="Forged crankshaft turning under a hard key light"
 *   description="A three-throw crankshaft rotates slowly, showing its
 *     counterweights and journal fillets."
 *   className="h-[70vh] w-full"
 *   fallback={
 *     <img src="/assets/renders/crank.webp" alt="Forged crankshaft" />
 *   }
 *   onApproach={() => preloadModel(MODELS.f.url, MODEL_PRIORITY.approaching)}
 * >
 *   <ForgeLights preset="hero" />
 *   <ForgeEnvironment />
 *   <ForgedPart url={MODELS.f.url} />
 * </SceneSlot>
 */
export function SceneSlot({
  accessibleName,
  description,
  fallback,
  children,
  className,
  style,
  index = 1,
  approachMargin = '600px 0px',
  onApproach,
  as: As = 'div',
}: SceneSlotProps) {
  // Non-throwing: a slot rendered outside a provider degrades to its static
  // fallback instead of aborting the static export for every route. See
  // `useOptionalScene3D`.
  const scene3d = useOptionalScene3D();
  const store = scene3d?.store ?? NULL_STORE;
  const webgl = scene3d?.webgl ?? 'unsupported';
  const motion = scene3d?.motion ?? false;

  if (process.env.NODE_ENV !== 'production' && !scene3d) {
    console.error(
      `[three3] <SceneSlot accessibleName="${accessibleName}"> is not inside a <Scene3DProvider>, ` +
        'so it is showing its static fallback and will never render 3D. ' +
        'Wrap the route (or the page body) in <Scene3DProvider> exactly once.',
    );
  }

  const id = useId();
  const descId = `${id}-desc`;

  const visibleRef = useRef(false);
  const [armed, setArmed] = useState(false);

  // Latched in a ref so changing the callback does not re-create the
  // observers (which would re-fire `onApproach`).
  const onApproachRef = useRef(onApproach);
  useEffect(() => {
    onApproachRef.current = onApproach;
  }, [onApproach]);

  useEffect(() => store.registerSlot(id), [store, id]);

  const observersRef = useRef<IntersectionObserver[]>([]);

  /**
   * Callback ref rather than `useEffect` + `getBoundingClientRect`: the
   * `setArmed(true)` below happens inside an IntersectionObserver callback,
   * which is not an effect body, so it stays clear of React 19's
   * `react-hooks/set-state-in-effect` rule. Same pattern as v2's
   * `StlPreview`.
   */
  const attach = useCallback(
    (node: HTMLElement | null) => {
      for (const o of observersRef.current) o.disconnect();
      observersRef.current = [];

      if (!node) {
        visibleRef.current = false;
        store.setSlotVisible(id, false);
        return;
      }

      // No IntersectionObserver (very old browser, or a test environment):
      // fail open. A slot that never arms would silently show the fallback
      // forever, which is worse than loading eagerly on a rare browser.
      if (typeof IntersectionObserver === 'undefined') {
        setArmed(true);
        store.arm();
        visibleRef.current = true;
        store.setSlotVisible(id, true);
        return;
      }

      const approach = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          setArmed(true);
          store.arm();
          onApproachRef.current?.();
          approach.disconnect();
        },
        { rootMargin: approachMargin },
      );
      approach.observe(node);

      const visibility = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visibleRef.current = e.isIntersecting;
            store.setSlotVisible(id, e.isIntersecting);
          }
        },
        { threshold: 0 },
      );
      visibility.observe(node);

      observersRef.current = [approach, visibility];
    },
    [approachMargin, id, store],
  );

  const slotApi = useMemo<SlotApi>(
    () => ({ id, visibleRef, motion, store }),
    [id, motion, store],
  );

  // `probing` is the pre-hydration state, so the fallback is what ships in
  // the exported HTML. `lost` and `unsupported` fall through to it too.
  const live = webgl === 'ok' && armed;

  // TS models `as` as a union of intrinsic tags, which JSX cannot resolve to
  // a single props type. The three allowed tags share the attribute surface
  // we use, so narrowing to `div` for typing purposes is safe and keeps the
  // ref properly typed.
  const Tag = As as 'div';

  return (
    <>
      {/* Sibling, not a child: the box below is `role="img"` while it is
          live, and burying the description inside a role="img" subtree makes
          it something AT is entitled to skip. */}
      {live && (
        <p id={descId} className="sr-only">
          {description}
        </p>
      )}

      <Tag
        ref={attach}
        // Live: an image with a name and a description, because that is
        // exactly what a rendered scene is. Falling back: no role at all —
        // the fallback's own alt text and copy are the accessible content,
        // and wrapping them in role="img" would throw them away.
        {...(live
          ? { role: 'img', 'aria-label': accessibleName, 'aria-describedby': descId }
          : {})}
        className={cn('relative', className)}
        style={style}
      >
        {live ? (
          // The context provider lives INSIDE <SlotView> on purpose: the
          // children are tunnelled into the canvas, and context is resolved
          // where an element renders, not where it was written. A provider
          // wrapped around <SlotView> would never reach them.
          <SlotView index={index} className="absolute inset-0">
            <SlotContext.Provider value={slotApi}>
              {children}
            </SlotContext.Provider>
          </SlotView>
        ) : (
          fallback
        )}
      </Tag>
    </>
  );
}

export default SceneSlot;
