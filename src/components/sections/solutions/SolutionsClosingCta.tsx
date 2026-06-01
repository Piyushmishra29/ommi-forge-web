'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import SplitText from '@/components/motion/SplitText';
import Eyebrow from '@/components/ui/Eyebrow';
import { SOLUTIONS_CLOSING_CTA } from '@/data/solutions';

/**
 * SolutionsClosingCta
 *
 * Full-viewport saffron slab that closes the `/solutions` page.
 * Headline sweeps in via SplitText with a per-char y-rise stagger when
 * the section enters the viewport. The primary CTA is the magnetic
 * "Send us a spec sheet →" target linking to `/contact/`.
 *
 * Mirrors the `<ClosingCta>` pattern used on the home page so the two
 * end-of-route slabs feel like the same brand beat.
 *
 * Reduced-motion: the stagger never runs and everything renders at
 * rest.
 */
export default function SolutionsClosingCta() {
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
        stagger: 0.045,
        scrollTrigger: {
          trigger: el,
          start: 'top 70%',
          once: true,
        },
      });
      gsap.from(el.querySelectorAll('[data-cta-fade]'), {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 65%',
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
      {/* Subtle diagonal hairline texture — barely visible, gives the
          slab the same "machined" feel as the rest of the route. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0 14px, var(--color-graphite) 14px 15px)',
        }}
      />

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

      <div className="relative mx-auto flex w-full max-w-[var(--container-page)] flex-col items-start px-6 md:px-10">
        <Eyebrow data-cta-fade>
          <span className="text-graphite">{SOLUTIONS_CLOSING_CTA.eyebrow}</span>
        </Eyebrow>

        <div data-cta-headline className="mt-8 max-w-[18ch]">
          <SplitText
            as="h2"
            className="block font-display font-light leading-[0.95] tracking-tight"
            charClassName="text-[clamp(40px,7vw,88px)]"
          >
            {SOLUTIONS_CLOSING_CTA.headline}
          </SplitText>
        </div>

        <p
          data-cta-fade
          className="mt-8 max-w-2xl font-body text-lg text-graphite/85 md:text-xl md:leading-[1.6]"
        >
          {SOLUTIONS_CLOSING_CTA.subhead}
        </p>

        <div
          data-cta-fade
          className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <Link
            href={SOLUTIONS_CLOSING_CTA.primary.href}
            data-magnetic
            className="inline-flex items-center justify-center bg-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-paper hover:text-graphite"
          >
            {SOLUTIONS_CLOSING_CTA.primary.label}
          </Link>
          <Link
            href={SOLUTIONS_CLOSING_CTA.secondary.href}
            data-magnetic
            className="inline-flex items-center justify-center border border-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-graphite hover:text-paper"
          >
            {SOLUTIONS_CLOSING_CTA.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
