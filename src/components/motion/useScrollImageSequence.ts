'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * The pin MUST be torn down in a layout effect, not a passive one. Pinning
 * reparents the section into a GSAP `.pin-spacer`; React's own removeChild
 * on route change then targets a node whose parent has silently changed and
 * throws NotFoundError — which unmounts the entire app to the router's
 * "This page couldn't load" screen. Layout-effect cleanups run synchronously
 * in the mutation phase BEFORE React detaches DOM; passive cleanups run
 * after, which is too late. (SSR renders never run layout effects, but React
 * still warns on useLayoutEffect during SSR — hence the isomorphic guard.)
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UseScrollImageSequenceOptions {
  /** Canvas that the frames are drawn onto (absolute-filled in the section). */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Section that pins while the sequence scrubs. */
  sectionRef: RefObject<HTMLElement | null>;
  /** Number of frames. */
  count: number;
  /** Builds the URL for frame `i` (0-based) — the desktop variant. */
  src: (i: number) => string;
  /**
   * Builds the URL for frame `i` on the mobile variant. Chosen once on
   * mount when `desktopQuery` does NOT match. Same frame count / numbering
   * as `src` — only the encoded resolution differs. Omit to always use
   * `src`.
   */
  srcMobile?: (i: number) => string;
  /**
   * Media query that selects the desktop variant. Evaluated once on mount
   * (no resize re-fetch — the chosen set persists). Default desktop ≥1024px.
   */
  desktopQuery?: string;
  /** ScrollTrigger pin length, e.g. "+=220%". */
  end?: string;
  /** Scrub smoothing (seconds). Default 0.5. */
  scrub?: number;
  /**
   * Fires with scroll progress (0..1) every tick — for driving overlay
   * copy off the same pin without a second ScrollTrigger. Under
   * reduced-motion (no pin) it's primed once with 1 so a scrubbed word
   * overlay can settle on its final state. Latched in a ref, so passing a
   * fresh closure each render does NOT re-mount the sequence.
   */
  onProgress?: (p: number) => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Debounced ScrollTrigger.refresh(), shared across all hook instances.
 * Mounting (or unmounting) a pin changes the document height under every
 * trigger below it; a global remeasure keeps their start/end positions
 * honest. Debounced so several scrubs mounting in one scroll burst cost
 * a single refresh.
 */
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const scheduleScrollTriggerRefresh = () => {
  if (typeof window === 'undefined') return;
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    // sort() first: refresh() processes triggers in creation order, and
    // these scrubs mount lazily — AFTER page-load triggers that sit below
    // them in the document (e.g. HeritageTimeline). Unsorted, a downstream
    // trigger is measured before this pin's spacer is re-applied and
    // keeps a start position that's short by the spacer height.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, 200);
};

/**
 * Coarse-to-fine load order. On a slow, high-latency origin, loading
 * 0,1,2,…N sequentially means the back half of the clip is unusable until
 * the whole thing has streamed in. Instead we front-load a sparse pass
 * spanning the entire timeline — frame 0, the last frame, then every 6th
 * frame — before filling in the gaps. Combined with nearest-frame drawing,
 * the scrub becomes usable (at lower temporal resolution) within the first
 * ~20 frames' worth of bandwidth and sharpens as the fill pass lands.
 */
const buildLoadOrder = (count: number): number[] => {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  push(count - 1);
  for (let i = 0; i < count; i += 6) push(i); // sparse spanning pass
  for (let i = 0; i < count; i += 1) push(i); // fill the remaining gaps
  return order;
};

/**
 * useScrollImageSequence — the Apple-style scroll-scrub: instead of seeking
 * an MP4 (which is unreliable on mobile Safari and paints white on
 * undecoded seeks), we pre-decode the clip to an image sequence and draw
 * the frame for the current scroll position onto a <canvas>. Drawing an
 * already-loaded image is cheap and deterministic, so the crawl is smooth
 * and identical on mobile and desktop.
 *
 * Frames are preloaded up front. The section pins for `end` and the frame
 * index tracks scroll progress. OS reduced-motion → draw a single frame,
 * no pin.
 */
export function useScrollImageSequence({
  canvasRef,
  sectionRef,
  count,
  src,
  srcMobile,
  desktopQuery = '(min-width: 1024px)',
  end = '+=220%',
  scrub = 0.5,
  onProgress,
}: UseScrollImageSequenceOptions) {
  // Latch the progress callback so a fresh closure per render doesn't
  // re-run the (frame-downloading) main effect.
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Same latch for the frame-URL builders: a consumer passing an inline
  // closure must never tear down the ScrollTrigger pin mid-scroll. The
  // variant choice is locked on mount anyway (see frameSrc below), so
  // identity churn carries no information.
  const srcRef = useRef(src);
  const srcMobileRef = useRef(srcMobile);
  useEffect(() => {
    srcRef.current = src;
    srcMobileRef.current = srcMobile;
  }, [src, srcMobile]);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // Pick the resolution variant once, on mount. We deliberately don't
    // re-fetch a different set on resize — the smaller mobile frames stay
    // good enough if the viewport later widens (e.g. tablet rotate), and
    // re-downloading a whole sequence mid-session would be far worse than
    // a slightly soft canvas.
    const srcNow = srcRef.current;
    const srcMobileNow = srcMobileRef.current;
    const frameSrc =
      srcMobileNow && !window.matchMedia(desktopQuery).matches
        ? srcMobileNow
        : srcNow;

    // --- preload frames with bounded concurrency ---
    // Why bounded? Unbounded `for (i=0..N) new Image().src = ...` fires N
    // parallel HTTP requests at once. With 100+ frames that saturates
    // the connection during hero LCP, starving the critical CSS / JS /
    // fonts. We cap parallel decodes and march through the queue in
    // coarse-to-fine order (see buildLoadOrder).
    //
    // We also explicitly `decode()` each image (off the main thread) so
    // the first paint draw doesn't trigger a sync raster on the UI
    // thread when we call drawImage().
    const PARALLEL = 14;
    const images: HTMLImageElement[] = new Array(count);
    let cancelled = false;

    const makeImage = (i: number): HTMLImageElement => {
      const img = new Image();
      img.decoding = 'async';
      // Bias the very first frame so it lands ahead of non-critical
      // assets — that frame is the LCP candidate.
      if (i === 0) {
        try {
          (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
            'high';
        } catch {
          // older browsers — best-effort
        }
      }
      img.src = frameSrc(i);
      return img;
    };

    const loadOne = async (i: number) => {
      const img = makeImage(i);
      images[i] = img;
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Decode failed — draw() routes around the missing frame via its
        // nearest-loaded-frame search. Don't abort the queue.
      }
      if (cancelled) return;
      // Redraw the current scroll target as finer frames arrive so a
      // stationary canvas visibly sharpens through the fill pass instead
      // of staying stuck on whatever coarse frame was nearest at scroll.
      draw(lastDrawn < 0 ? 0 : lastDrawn);
    };

    // Kick off the first PARALLEL loads, then a tiny worker queue
    // marches through the rest as each one completes. This keeps
    // exactly PARALLEL in flight at any time.
    const order = buildLoadOrder(count);
    let next = 0;
    const worker = async () => {
      while (!cancelled) {
        if (next >= order.length) return;
        const i = order[next];
        next += 1;
        await loadOne(i);
      }
    };
    const initial = Math.min(PARALLEL, order.length);
    for (let w = 0; w < initial; w += 1) {
      void worker();
    }

    let lastDrawn = -1;

    // Size the backing buffer only — DO NOT set inline style.width/height,
    // because that would override the CSS `h-full w-full` that keeps the
    // canvas filling the section. Stale inline pixel widths from an early
    // measurement (hydration, font load, pin wrap, browser zoom) used to
    // shrink the canvas and leave the poster bg-div leaking through as a
    // hard vertical seam. Reading the canvas's own client box (governed by
    // CSS) is always consistent with what's actually rendered.
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const isReady = (i: number) => {
      const img = images[i];
      return !!img && img.complete && img.naturalWidth > 0;
    };

    // Cover-fit draw (object-cover semantics). Uses the canvas's own client
    // box so sizing and drawing stay in lockstep regardless of section state.
    const draw = (index: number) => {
      const target = Math.max(0, Math.min(count - 1, index));
      // Draw the exact frame if it's decoded; otherwise the NEAREST decoded
      // frame (search downward first, then upward). During the coarse pass
      // this trades a little temporal resolution for a live canvas instead
      // of one frozen on a stale frame.
      let drawIndex = -1;
      if (isReady(target)) {
        drawIndex = target;
      } else {
        for (let d = 1; d < count; d += 1) {
          if (target - d >= 0 && isReady(target - d)) {
            drawIndex = target - d;
            break;
          }
          if (target + d < count && isReady(target + d)) {
            drawIndex = target + d;
            break;
          }
        }
      }
      // Nothing decoded yet — leave the poster background showing through.
      if (drawIndex < 0) return;
      lastDrawn = target;
      const img = images[drawIndex];
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw <= 0 || ch <= 0) return;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number, dh: number, dx: number, dy: number;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    sizeCanvas();
    draw(0);

    const onResize = () => {
      sizeCanvas();
      draw(lastDrawn < 0 ? 0 : lastDrawn);
    };
    window.addEventListener('resize', onResize);

    // ResizeObserver catches size changes that don't trigger window resize:
    // ScrollTrigger pin-spacer wrapping, layout shifts from font loading,
    // browser zoom, devtools opening/closing, dvh recompute, etc.
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(onResize)
        : null;
    ro?.observe(canvas);

    let st: ScrollTrigger | null = null;
    if (!reduced) {
      st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end,
        pin: true,
        pinSpacing: true,
        scrub,
        onUpdate: (self) => {
          draw(Math.round(self.progress * (count - 1)));
          onProgressRef.current?.(self.progress);
        },
      });
      // This pin just inserted a spacer into the document flow. Triggers
      // that measured their positions BEFORE this mount (e.g. the
      // PinnedSection-based HeritageTimeline, created at page load while
      // the IO-gated scrubs were still unmounted) are now offset by the
      // spacer height and will pin/animate at the wrong scroll position.
      // A debounced global refresh remeasures everyone; the debounce
      // collapses hero + hammer + plant mounting in quick succession
      // into a single remeasure.
      scheduleScrollTriggerRefresh();
    } else {
      // No pin under reduced-motion — prime overlay copy at its end state
      // so a scrubbed word cross-fade settles instead of freezing on frame 0.
      onProgressRef.current?.(1);
    }

    return () => {
      cancelled = true;
      if (st) {
        st.kill();
        // Killing the pin removes its spacer — remeasure downstream
        // triggers for the same reason as on create.
        scheduleScrollTriggerRefresh();
      }
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
    // `src` / `srcMobile` are read through refs (latched above), NOT deps:
    // an inline-closure consumer re-rendering mid-scroll must never kill
    // the pin. Swapping frame sources requires a `count` (or key) change.
    // canvasRef / sectionRef are stable React refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, end, scrub, desktopQuery]);
}
