'use client';

import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

interface UseVideoScrubOptions {
  /** The <video> to scrub. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** The section that pins while the video scrubs. */
  sectionRef: RefObject<HTMLElement | null>;
  /**
   * Pin length as a ScrollTrigger `end` offset, e.g. "+=300%". Bigger =
   * slower crawl (more scroll distance per second of footage).
   */
  end?: string;
  /** Scrub smoothing (seconds of catch-up). Default 0.5. */
  scrub?: number;
}

const isTouch = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * useVideoScrub — drives a <video>'s frame from scroll position, the
 * "crawl to play" interaction, with the fixes that make it work on mobile
 * Safari (where it's otherwise broken):
 *
 *  1. Bind on `loadedmetadata` (reliable on iOS — only `duration` is
 *     needed). iOS frequently never fires `canplaythrough` for muted
 *     background video, so depending on it means the scrub never starts.
 *  2. Prime the decoder: on touch devices iOS won't paint programmatic
 *     `currentTime`/`fastSeek` results until the video has been play()'d.
 *     We prime on first `touchstart` (a user gesture) and again on bind.
 *  3. Seek via `fastSeek()` when available (Safari/iOS) — jumps to the
 *     nearest keyframe fast; our clips are encoded keyframe-dense.
 *
 * Gated on OS reduced-motion ONLY (not CALM_MODE / `useReducedMotion`),
 * so the scrub runs in the full build on mobile. When OS reduced-motion
 * is set the caller should render a plain autoplay-loop fallback instead
 * of mounting this hook.
 */
export function useVideoScrub({
  videoRef,
  sectionRef,
  end = '+=300%',
  scrub = 0.5,
}: UseVideoScrubOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) return;

    const v = videoRef.current;
    const el = sectionRef.current;
    if (!v || !el) return;

    let st: ScrollTrigger | null = null;
    let lastSet = -1;
    let primed = false;

    // Prime the decoder so iOS will render seeked frames. Safe on desktop
    // (a muted play→pause is a no-op visually).
    const prime = () => {
      if (primed) return;
      primed = true;
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => v.pause()).catch(() => {
          /* Autoplay refused outside a gesture — the touchstart path
             will prime within the next user gesture. */
          primed = false;
        });
      } else {
        try {
          v.pause();
        } catch {
          /* ignore */
        }
      }
    };

    const seek = (t: number) => {
      // fastSeek is the smooth path on Safari/iOS; fall back to currentTime.
      const fast = (v as HTMLVideoElement & { fastSeek?: (n: number) => void })
        .fastSeek;
      try {
        if (typeof fast === 'function') fast.call(v, t);
        else v.currentTime = t;
      } catch {
        /* Safari throws if metadata isn't ready yet — retry next tick. */
      }
    };

    const bind = () => {
      if (st || !Number.isFinite(v.duration) || v.duration <= 0) return;
      prime();
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end,
        pin: true,
        pinSpacing: true,
        scrub,
        onUpdate: (self) => {
          const t = Math.min(self.progress * v.duration, v.duration - 0.05);
          if (Math.abs(t - lastSet) < 0.02) return;
          lastSet = t;
          seek(t);
        },
      });
      ScrollTrigger.refresh();
    };

    if (v.readyState >= 1) bind();
    else v.addEventListener('loadedmetadata', bind, { once: true });

    // On touch, prime within the first real user gesture (most reliable).
    let onFirstTouch: (() => void) | undefined;
    if (isTouch()) {
      onFirstTouch = () => prime();
      window.addEventListener('touchstart', onFirstTouch, {
        once: true,
        passive: true,
      });
    }

    return () => {
      st?.kill();
      st = null;
      v.removeEventListener('loadedmetadata', bind);
      if (onFirstTouch) window.removeEventListener('touchstart', onFirstTouch);
    };
    // gsap/ScrollTrigger are module singletons; refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, scrub]);
}
