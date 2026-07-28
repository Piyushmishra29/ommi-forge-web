'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import { SOLUTIONS_CLOSING_CTA } from '@/data/solutions';

/**
 * SolutionsClosingCta — the page's last beat.
 *
 * v2 built this as a full-bleed saffron slab. That does not survive the
 * move to a dark ground: §6.3 rules out any colour at full saturation used
 * as a *fill* on graphite, and §2.2 gives saffron exactly two jobs — a light
 * source, or a hairline. A wall of it is neither, and next to the cold steel
 * of the act above it read as a different website.
 *
 * So the slab is gone and the warmth moves to where it is earned: the
 * primary button (a control, and the one surface the two-tone focus ring
 * was specifically measured against at 7.57:1) and a single hairline. The
 * page ends on the same graphite it started on, which is the point — the
 * part cooled, the shop is still dark.
 *
 * Reduced motion: one tree, entrance skipped. Nothing here is conditional
 * on a tween.
 */
export default function SolutionsClosingCta() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // §4.4 preset #4, retuned to our numbers: 480ms, y 16, `press`.
      // `play none none reverse` so scrolling back up re-arms it instead of
      // leaving a half-played state behind.
      gsap.from(el.querySelectorAll('[data-rise]'), {
        y: 16,
        opacity: 0,
        duration: 0.48,
        ease: 'expo.out',
        stagger: 0.04,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative bg-graphite">
      {/* The one warm mark in the block. A hairline, not a fill. */}
      <div aria-hidden className="h-px w-full bg-saffron/60" />

      <div className="page-x section-y-lg mx-auto max-w-page">
        <div data-rise>
          <Eyebrow>{SOLUTIONS_CLOSING_CTA.eyebrow}</Eyebrow>
        </div>

        <h2 className="type-display-l mt-8 max-w-[14ch] text-balance" data-rise>
          {SOLUTIONS_CLOSING_CTA.headline}
        </h2>

        <p className="type-lede mt-8 max-w-[68ch] text-pretty" data-rise>
          {SOLUTIONS_CLOSING_CTA.subhead}
        </p>

        <div
          className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          data-rise
        >
          <Link
            href={SOLUTIONS_CLOSING_CTA.primary.href}
            data-magnetic
            className="type-eyebrow inline-flex min-h-11 items-center justify-center bg-saffron px-8 py-4 text-graphite transition-colors duration-200 hover:bg-mesh"
          >
            {SOLUTIONS_CLOSING_CTA.primary.label}
          </Link>
          <Link
            href={SOLUTIONS_CLOSING_CTA.secondary.href}
            data-magnetic
            className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-cinder px-8 py-4 transition-colors duration-200 hover:border-mesh hover:text-mesh"
          >
            {SOLUTIONS_CLOSING_CTA.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
