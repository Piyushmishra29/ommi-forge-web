'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface LenisProviderProps {
  children: React.ReactNode;
}

/**
 * LenisProvider
 *
 * Instantiates a single Lenis instance on mount, drives its RAF loop
 * through GSAP's ticker (so animations + smooth scroll share one
 * frame budget), and pipes Lenis scroll events into ScrollTrigger so
 * scroll-driven animations sync with the smoothed scroll position
 * instead of `window.scrollY`.
 *
 * Lenis 1.3+ no longer adds default classes — we add `lenis` and
 * `lenis-smooth` to <html> manually so the CSS contract in
 * globals.css applies.
 *
 * Disabled entirely when `prefers-reduced-motion: reduce` is set —
 * the browser handles native scroll in that case.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

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
    lenisRef.current = lenis;

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    // External controls — any component (e.g. mobile menu) can stop/start
    // smooth scroll without holding a direct reference to the instance.
    const onSetPaused = (e: Event) => {
      const detail = (e as CustomEvent<{ paused: boolean }>).detail;
      if (detail?.paused) lenis.stop();
      else lenis.start();
    };
    document.addEventListener('lenis:setpaused', onSetPaused);

    // Route-reset bridge — RouteResetEffects fires this on every nav so
    // it can snap to top without holding a direct Lenis reference.
    const onScrollTo = (e: Event) => {
      const detail = (e as CustomEvent<{ target: number; immediate?: boolean }>).detail;
      if (!detail) return;
      lenis.scrollTo(detail.target, { immediate: detail.immediate ?? false });
    };
    document.addEventListener('lenis:scrollto', onScrollTo);

    return () => {
      document.removeEventListener('lenis:setpaused', onSetPaused);
      document.removeEventListener('lenis:scrollto', onScrollTo);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove(
        'lenis',
        'lenis-smooth',
        'lenis-scrolling',
        'lenis-smooth-scrolling',
        'lenis-stopped',
      );
    };
  }, []);

  return <>{children}</>;
}
