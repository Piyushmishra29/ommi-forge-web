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
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-saffron text-graphite"
    >
      <div className="mx-auto flex max-w-[1140px] flex-col items-center px-6 py-32 text-center md:px-10 md:py-40">
        <div data-cta-headline>
          <SplitText
            as="h2"
            className="font-display font-light leading-[0.95]"
            charClassName="text-[clamp(56px,11vw,160px)]"
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
