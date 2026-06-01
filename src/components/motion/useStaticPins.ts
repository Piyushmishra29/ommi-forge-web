'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * useStaticPins — true when the section should render its STATIC fallback
 * instead of a GSAP-pinned scroll: either OS reduced-motion is set, OR the
 * viewport is phone-width. Stacking several pinned sections is janky on
 * phones (and compounds with the hero's scroll-scrub), so heavy pinned
 * sections (HammerStrikeIntro, HeritageTimeline) fall back to their
 * already-built static layouts on mobile.
 *
 * SSR-safe: returns `false` on the server and on the first client render
 * (matching the server markup → no hydration mismatch), then flips after
 * mount if the viewport is mobile.
 */
export function useStaticPins(): boolean {
  const reduced = useReducedMotion() ?? false;
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return reduced || mobile;
}
