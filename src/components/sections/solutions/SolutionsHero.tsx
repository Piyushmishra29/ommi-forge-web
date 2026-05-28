'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { SOLUTIONS_HERO } from '@/data/solutions';

/**
 * SolutionsHero
 *
 * Editorial opening frame above the pinned methods. Hero pattern:
 *  - Eyebrow ("FOUR METHODS · ONE FLOOR")
 *  - Large two-line SplitText headline (clamp 56 → 110px) that animates
 *    in on mount via a per-char y-rise stagger.
 *  - Subhead pulled from the source ommiforge.com Solutions copy.
 *  - A subtle scroll-driven fade-out + lift as the user scrolls toward
 *    `<MethodsPinned>` below, so the hero relinquishes the viewport
 *    gracefully instead of just disappearing under the next section.
 *
 * Reduced-motion: skip both the mount stagger AND the scroll-driven
 * fade. Everything renders at rest.
 */
export default function SolutionsHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Line 1 animates per-char; the italic line 2 is split per-WORD
      // (italic glyphs slant past their box, so per-char inline-block
      // spans mangle thin letters like "ill" in "billet"). Animate both.
      const chars = el.querySelectorAll(
        '[data-hero-headline] [data-char], [data-hero-headline] [data-word]',
      );
      const fades = el.querySelectorAll('[data-hero-fade]');

      // Mount-in stagger.
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .from(chars, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          stagger: 0.014,
        })
        .from(
          fades,
          { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 },
          '-=0.5',
        );

      // Scroll-driven fade-out as the user scrolls past the hero into
      // <MethodsPinned>. Pinning never starts until the trigger element
      // hits the top of the viewport, so we want the hero fully gone by
      // then.
      gsap.to(el.querySelector('[data-hero-inner]'), {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Force a refresh once the layout settles (helps when the page
      // mounts mid-scroll, e.g. after a client-side route hop).
      ScrollTrigger.refresh();
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className="relative bg-paper pt-32 pb-20 md:pt-40 md:pb-32"
    >
      <div
        data-hero-inner
        className="mx-auto max-w-[var(--container-page)] px-6 md:px-10"
      >
        <Eyebrow data-hero-fade>
          <span className="text-mesh">{SOLUTIONS_HERO.eyebrow}</span>
        </Eyebrow>

        <h1
          data-hero-headline
          className="mt-8 max-w-5xl font-display font-light leading-[0.98] text-graphite"
        >
          <SplitText
            as="span"
            className="block text-[clamp(56px,10vw,110px)]"
          >
            {SOLUTIONS_HERO.headlineLine1}
          </SplitText>
          <SplitText
            as="span"
            byWord
            className="block text-[clamp(56px,10vw,110px)] italic text-mesh"
          >
            {SOLUTIONS_HERO.headlineLine2}
          </SplitText>
        </h1>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          <p
            data-hero-fade
            className="font-body text-base leading-relaxed text-steel md:col-span-7 md:text-lg md:leading-[1.7]"
          >
            {SOLUTIONS_HERO.subhead}
          </p>

          <div
            data-hero-fade
            className="md:col-span-4 md:col-start-9 md:self-end"
          >
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-graphite">
              Scroll for each method
            </p>
            <span
              aria-hidden
              className="mt-4 block h-px w-16 bg-mesh"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
