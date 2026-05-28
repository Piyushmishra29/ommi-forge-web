'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import SplitText from '@/components/motion/SplitText';
import { CLOSING_CTA } from '@/data/home';

/**
 * ClosingCta
 *
 * Full-viewport saffron slab. Headline sweeps in via SplitText with
 * chars from y+80 in a 50ms-per-char stagger when the section enters
 * the viewport. CTAs sit beneath, with magnetic targets.
 */
export default function ClosingCta() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-cta-headline] [data-char]'), {
        y: 80,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          start: 'top 70%',
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className="relative flex w-full items-center justify-center overflow-hidden bg-saffron py-32 text-graphite md:py-48"
    >
      {/* Graphite vignette top + bottom — softens the pure-saffron slab
          into a band rather than a wall, without losing the brand moment. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-graphite/15 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-graphite/15 to-transparent"
      />

      <div className="relative mx-auto flex max-w-[1140px] flex-col items-center px-6 text-center md:px-10">
        <div data-cta-headline>
          <SplitText
            as="h2"
            className="font-display text-[clamp(48px,8vw,112px)] font-light leading-[0.95] tracking-tight"
          >
            {CLOSING_CTA.headline}
          </SplitText>
        </div>
        <p className="mt-8 max-w-2xl font-body text-lg text-graphite/80 md:text-xl">
          {CLOSING_CTA.subhead}
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={CLOSING_CTA.primary.href}
            data-magnetic
            className="inline-flex items-center justify-center bg-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-paper hover:text-graphite"
          >
            {CLOSING_CTA.primary.label}
          </Link>
          <Link
            href={CLOSING_CTA.secondary.href}
            data-magnetic
            className="inline-flex items-center justify-center border border-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-graphite hover:text-paper"
          >
            {CLOSING_CTA.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
