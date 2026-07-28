'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * A WebP frame sequence drawn to a canvas, driven by a number you own.
 *
 * Why this exists next to `useScrollImageSequence`
 * -----------------------------------------------
 * That hook creates its own `ScrollTrigger` **pin**, which is exactly right
 * for a section that is nothing but footage (the plant walkthrough). The
 * home act is not that: §5.1 gives `/` **one** pinned act containing four
 * beats, only the middle one of which is footage. Two pins stacked at the
 * top of the page would be two pin-spacers, two scrub timelines and two
 * sources of truth for "how far through the act are we".
 *
 * So the act owns the pin, and this owns only the pixels: loading, decoding
 * and drawing. Call `draw(t)` with a 0–1 position within the clip from
 * wherever your progress comes from.
 *
 * The loader is a deliberate copy of the proven one — bounded concurrency,
 * coarse-to-fine order, nearest-decoded-frame drawing, cover fit, DPR capped
 * at 2, backing-store sizing only (never inline width/height, which used to
 * leave a hard vertical seam when a stale measurement shrank the canvas).
 */

export type FrameSequenceOptions = {
  /** Canvas the frames are drawn onto. Sized from its own client box. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Number of frames in the sequence. */
  count: number;
  /** Builds the URL for frame `i` (0-based) — the desktop encode. */
  src: (i: number) => string;
  /** Same numbering, smaller encode. Chosen once, on the frame loading starts. */
  srcMobile?: (i: number) => string;
  /** Media query selecting the desktop encode. Default ≥1024px. */
  desktopQuery?: string;
  /**
   * Gate on the network. Frames are ~2.3 MB at the desktop tier — an order
   * of magnitude more than everything else above the fold put together — so
   * this stays `false` until the visitor has actually started moving toward
   * the beat that needs them. Flipping it to `true` starts the download and
   * it never stops again.
   */
  enabled: boolean;
};

/**
 * Coarse-to-fine load order. Sequentially loading 0…N leaves the back half
 * of the clip unusable until the whole thing has streamed; a sparse pass
 * spanning the full timeline first (frame 0, the last frame, then every
 * 6th) makes the scrub usable at low temporal resolution within the first
 * ~20 frames of bandwidth, and it sharpens as the fill pass lands.
 */
function buildLoadOrder(count: number): number[] {
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
  for (let i = 0; i < count; i += 6) push(i);
  for (let i = 0; i < count; i += 1) push(i);
  return order;
}

/**
 * @returns a stable ref holding the draw function. `draw(t)` takes a 0–1
 * position within the clip; it is a no-op until `enabled` has gone true and
 * at least one frame has decoded, which is why the caller keeps a poster
 * underneath.
 *
 * @example
 * const drawFrame = useFrameSequence({ canvasRef, count: 108, src, enabled });
 * // inside the act's scrub callback:
 * drawFrame.current(mapRange(p, 0.34, 0.64, 0, 1));
 */
export function useFrameSequence({
  canvasRef,
  count,
  src,
  srcMobile,
  desktopQuery = '(min-width: 1024px)',
  enabled,
}: FrameSequenceOptions): RefObject<(t: number) => void> {
  const draw = useRef<(t: number) => void>(() => {});

  // Latched, not depended on: a consumer passing an inline closure must
  // never restart a part-loaded download. The encode choice is locked when
  // loading starts anyway, so identity churn carries no information.
  const srcRef = useRef(src);
  const srcMobileRef = useRef(srcMobile);
  useEffect(() => {
    srcRef.current = src;
    srcMobileRef.current = srcMobile;
  }, [src, srcMobile]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mobile = srcMobileRef.current;
    const frameSrc =
      mobile && !window.matchMedia(desktopQuery).matches ? mobile : srcRef.current;

    const images: HTMLImageElement[] = new Array(count);
    let cancelled = false;
    let lastDrawn = 0;

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

    const paint = (index: number) => {
      const target = Math.max(0, Math.min(count - 1, index));
      let drawIndex = -1;
      if (isReady(target)) {
        drawIndex = target;
      } else {
        // Nearest decoded frame, searching outward. During the coarse pass
        // this trades temporal resolution for a live canvas instead of one
        // frozen on a stale frame.
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
      if (drawIndex < 0) return;
      lastDrawn = target;

      const img = images[drawIndex];
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw <= 0 || ch <= 0) return;
      // Cover fit — `object-cover` semantics, computed from the canvas's own
      // client box so sizing and drawing can never disagree.
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number;
      let dh: number;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
      } else {
        dw = cw;
        dh = cw / ir;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    draw.current = (t: number) => {
      paint(Math.round(Math.max(0, Math.min(1, t)) * (count - 1)));
    };

    const loadOne = async (i: number) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameSrc(i);
      images[i] = img;
      try {
        if (typeof img.decode === 'function') await img.decode();
      } catch {
        // Decode failed — paint() routes around it via the nearest-frame
        // search. Never abort the queue for one bad frame.
      }
      if (cancelled) return;
      // Repaint the current position as finer frames land, so a stationary
      // canvas visibly sharpens instead of holding a coarse frame.
      paint(lastDrawn);
    };

    // Bounded concurrency: an unbounded `for (i of frames) new Image()` fires
    // 108 parallel requests and starves everything else on the connection.
    const order = buildLoadOrder(count);
    let next = 0;
    const worker = async () => {
      while (!cancelled && next < order.length) {
        const i = order[next];
        next += 1;
        await loadOne(i);
      }
    };
    const PARALLEL = 12;
    for (let w = 0; w < Math.min(PARALLEL, order.length); w += 1) void worker();

    sizeCanvas();

    const onResize = () => {
      sizeCanvas();
      paint(lastDrawn);
    };
    window.addEventListener('resize', onResize);
    // A ResizeObserver catches what `resize` misses: pin-spacer wrapping,
    // font-load reflow, browser zoom, dvh recompute.
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(canvas);

    return () => {
      cancelled = true;
      draw.current = () => {};
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
    // `src`/`srcMobile` are read through refs by design (see above);
    // canvasRef is a stable React ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, desktopQuery, enabled]);

  return draw;
}
