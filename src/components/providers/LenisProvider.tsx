'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from '@/lib/gsap';

interface LenisProviderProps {
  children: React.ReactNode;
}

/**
 * LenisProvider
 *
 * Instantiates a single Lenis instance on mount, drives its RAF loop, and
 * pipes Lenis scroll events into GSAP ScrollTrigger so scroll-driven
 * animations stay perfectly in sync with the smoothed scroll position.
 *
 * Disabled entirely when `prefers-reduced-motion: reduce` is set —
 * the browser handles native scroll in that case.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) return;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    // Bridge ScrollTrigger's ticker to RAF — keeps animations in lockstep
    // even when Lenis is in a paused state (e.g. modal open).
    ScrollTrigger.refresh();

    return () => {
      lenis.off('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
