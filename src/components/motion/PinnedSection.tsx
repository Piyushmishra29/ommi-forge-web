'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------------- */
/*  Ref-backed scroll store                                                   */
/* -------------------------------------------------------------------------- */
/*
 *  Background
 *  ----------
 *  PinnedSection used to expose `progress` via `useState<number>`. Every
 *  ScrollTrigger tick called `setProgress(...)`, which re-rendered every
 *  descendant in the React tree — at ~60 fps, that included heavy
 *  scroll-driven children like the heritage track.
 *
 *  This module now keeps `progress` in a mutable object that lives in a
 *  React ref, and notifies subscribers via a manually-managed listener
 *  Set. Consumers can either:
 *
 *    1. Subscribe via `useScrollSubscribe(cb)` — fires `cb(progress)`
 *       once per tick. No React re-render. Use this for any side-effect
 *       (DOM style, GSAP quickSetter, video.currentTime, mutating a ref
 *       passed into an R3F `useFrame`).
 *    2. Read via `useScroll()` — wraps `useSyncExternalStore` so React
 *       re-renders the calling component when progress changes. Use
 *       this only when the rendered output actually depends on the
 *       value (e.g. computing opacities for crossfading SVGs).
 *    3. Grab the raw value via `getScrollProgress()` (provided by the
 *       same hook for one-off reads inside callbacks).
 */

interface ScrollStore {
  progress: number;
  listeners: Set<() => void>;
}

interface ScrollContextValue {
  store: ScrollStore;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

/**
 * useScrollSubscribe
 *
 * Side-effect subscription that does NOT trigger React re-renders.
 * The callback fires once on mount (to "prime" with the current value)
 * and again whenever scroll progress updates.
 *
 * Outside a `<PinnedSection>`, the callback is never invoked.
 */
export function useScrollSubscribe(cb: (p: number) => void): void {
  const ctx = useContext(ScrollContext);
  // Latch the latest callback in a ref so we don't have to re-subscribe
  // every time the consumer's closure changes (which is most renders).
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  useEffect(() => {
    if (!ctx) return;
    const store = ctx.store;
    const fn = () => cbRef.current(store.progress);
    store.listeners.add(fn);
    // Prime with the current value so consumers don't have to special-case
    // "initial render before the first ScrollTrigger tick".
    fn();
    return () => {
      store.listeners.delete(fn);
    };
  }, [ctx]);
}

/**
 * getScrollProgress
 *
 * One-shot read of the current progress value from the nearest
 * `<PinnedSection>` ancestor. Use sparingly — most consumers should
 * subscribe instead.
 */
export function useScrollProgressRef(): { readonly current: number } {
  const ctx = useContext(ScrollContext);
  const ref = useRef(0);
  useEffect(() => {
    if (!ctx) return;
    const store = ctx.store;
    const fn = () => {
      ref.current = store.progress;
    };
    store.listeners.add(fn);
    fn();
    return () => {
      store.listeners.delete(fn);
    };
  }, [ctx]);
  return ref;
}

/**
 * useScroll
 *
 * Legacy hook — preserved for components whose RENDER depends on the
 * progress value (e.g. SVG opacity crossfades that React needs to
 * reconcile). Backed by `useSyncExternalStore` so it still re-renders
 * the calling component when progress ticks.
 *
 * Most consumers should migrate to `useScrollSubscribe` to drop the
 * per-frame re-render cost.
 */
export function useScroll(): { progress: number } {
  const ctx = useContext(ScrollContext);

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!ctx) return () => {};
      const store = ctx.store;
      store.listeners.add(notify);
      return () => {
        store.listeners.delete(notify);
      };
    },
    [ctx],
  );

  const getSnapshot = useCallback(
    () => ctx?.store.progress ?? 0,
    [ctx],
  );

  const getServerSnapshot = useCallback(() => 0, []);

  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { progress };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface PinnedSectionProps {
  children: React.ReactNode;
  /**
   * How far the section pins, in viewport heights. Default 1 (= 100vh).
   * Effectively the section "holds" for `length * 100vh` of scroll.
   */
  length?: number;
  className?: string;
  id?: string;
}

/**
 * PinnedSection
 *
 * A ScrollTrigger-pinned wrapper that exposes scroll progress (0..1) to
 * descendants via the `useScroll()` / `useScrollSubscribe()` hooks. The
 * actual pinned element is the inner content container — the outer
 * wrapper sets the scroll length so the page knows how much real estate
 * to allocate.
 *
 * Progress is held in a ref-backed store; the ScrollTrigger `onUpdate`
 * callback writes directly to `store.progress` and walks the listener
 * Set. No React state is involved in the per-frame path, so consumers
 * that use `useScrollSubscribe` incur zero reconciliation cost.
 *
 * In reduced-motion mode the section degrades to a normal stacked
 * block (no pin, no progress tracking).
 */
const PinnedSection = forwardRef<HTMLDivElement, PinnedSectionProps>(
  function PinnedSection({ children, length = 1, className, id }, ref) {
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    // Store + context value are instantiated ONCE per PinnedSection
    // mount and memoised so their identity is stable across renders.
    // Stable identity = stable Context value = no spurious subscriber
    // churn in descendants that read via useSyncExternalStore.
    //
    // useMemo with an empty dep array (not useRef) keeps us inside
    // React's "refs aren't touched during render" rule that
    // react-hooks/refs enforces.
    const contextValue = useMemo<ScrollContextValue>(
      () => ({
        store: { progress: 0, listeners: new Set<() => void>() },
      }),
      [],
    );

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reduce) return;

      const outer = outerRef.current;
      const inner = innerRef.current;
      const store = contextValue.store;
      if (!outer || !inner) return;

      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: outer,
          start: 'top top',
          end: () => `+=${window.innerHeight * length}`,
          pin: inner,
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Hot path — no React state, no setState. Direct mutation
            // of the store, then notify subscribers manually.
            store.progress = self.progress;
            // Iterate a snapshot so listeners that unsubscribe mid-walk
            // don't skip siblings.
            for (const fn of Array.from(store.listeners)) fn();
          },
        });
      }, outer);

      return () => ctx.revert();
    }, [length, contextValue]);

    return (
      <ScrollContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            outerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          // NB: `contain: layout|paint` is intentionally NOT applied here.
          // Both establish an independent containing block for fixed-
          // positioned descendants — and ScrollTrigger pins by setting
          // `position: fixed` on `innerRef`. With contain on the outer,
          // the "pinned" inner becomes fixed relative to the outer (not
          // the viewport) and scrolls away with it. See issue #11.
          className={cn('relative', className)}
        >
          <div ref={innerRef} className="h-screen w-full overflow-hidden">
            {children}
          </div>
        </div>
      </ScrollContext.Provider>
    );
  },
);

export default PinnedSection;
