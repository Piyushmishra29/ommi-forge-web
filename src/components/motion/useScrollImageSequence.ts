'use client';

import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

interface UseScrollImageSequenceOptions {
  /** Canvas that the frames are drawn onto (absolute-filled in the section). */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Section that pins while the sequence scrubs. */
  sectionRef: RefObject<HTMLElement | null>;
  /** Number of frames. */
  count: number;
  /** Builds the URL for frame `i` (0-based). */
  src: (i: number) => string;
  /** ScrollTrigger pin length, e.g. "+=220%". */
  end?: string;
  /** Scrub smoothing (seconds). Default 0.5. */
  scrub?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  end = '+=220%',
  scrub = 0.5,
}: UseScrollImageSequenceOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // --- preload frames ---
    const images: HTMLImageElement[] = [];
    let firstLoaded = false;
    for (let i = 0; i < count; i += 1) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src(i);
      if (i === 0) {
        img.onload = () => {
          firstLoaded = true;
          draw(0);
        };
      }
      images.push(img);
    }
    void firstLoaded;

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

    // Cover-fit draw (object-cover semantics). Uses the canvas's own client
    // box so sizing and drawing stay in lockstep regardless of section state.
    const draw = (index: number) => {
      const i = Math.max(0, Math.min(count - 1, index));
      let img = images[i];
      if (!img || !img.complete || img.naturalWidth === 0) {
        // Fall back to the last successfully drawn frame to avoid a flash.
        if (lastDrawn < 0) return;
        img = images[lastDrawn];
        if (!img || !img.complete) return;
      } else {
        lastDrawn = i;
      }
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
        },
      });
      ScrollTrigger.refresh();
    }

    return () => {
      st?.kill();
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, end, scrub]);
}
