'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { withExt } from '@/lib/image-formats';

/**
 * CareersHero
 *
 * Editorial opener for `/careers/`. Promotes the page to the same
 * cinematic register as `/`, `/about`, `/solutions`, `/products`:
 *
 *  - Eyebrow `JOIN OMMI · MALUR, KARNATAKA`.
 *  - Display headline at `clamp(56px, 10vw, 110px)`, split per-char
 *    and swept in via GSAP on mount.
 *  - Support sub-headline below the H1 anchoring who we hire.
 *  - A full-bleed photo break beneath — a plant interior so the page
 *    cannot be confused with a generic careers landing.
 *
 * Reduced-motion: the per-char stagger is skipped so the headline
 * renders at rest, mirroring SolutionsHero/ProductsHero behaviour.
 */
export default function CareersHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('[data-careers-headline] [data-char]');
      const fades = el.querySelectorAll('[data-fade]');

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(chars, {
        yPercent: 110,
        opacity: 0,
        duration: 1.0,
        ease: 'power4.out',
        stagger: 0.014,
      }).from(
        fades,
        {
          y: 20,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
        },
        '-=0.55',
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  const photoSrc = '/assets/images/DSC09326.jpg';

  return (
    <section
      ref={root}
      className="relative bg-paper pt-32 pb-0 md:pt-40"
    >
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Eyebrow data-fade>
          <span className="text-ember">Join Ommi · Malur, Karnataka</span>
        </Eyebrow>

        <h1
          data-careers-headline
          className="mt-8 max-w-5xl text-balance font-display font-light leading-[0.98] text-graphite"
          style={{ fontSize: 'clamp(56px, 10vw, 110px)' }}
        >
          <SplitText as="span">{`Build with steel. Talk to us.`}</SplitText>
        </h1>

        {/* max-w-xl (not -2xl): at 16px pre-md, a 2xl (672px) measure
            runs to ~84ch — past the 65-75ch comfortable line length —
            on tablet widths just under the `md:` breakpoint. */}
        <p
          data-fade
          className="mt-10 max-w-xl text-pretty font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]"
        >
          We hire metallurgists, machinists, and the people who keep our
          floor humming. Fifty-one harvests in, Ommi still hires for grit,
          taste and metallurgical curiosity — and we don&apos;t keep a posted
          roles board.
        </p>
      </div>

      {/* Editorial photo break — a plant interior so the page lands
          immediately in our world rather than a generic careers panel. */}
      <div
        data-fade
        className="relative mt-16 h-[44vh] min-h-[320px] w-full overflow-hidden bg-graphite md:mt-24 md:h-[56vh]"
      >
        <picture>
          <source srcSet={withExt(photoSrc, 'avif')} type="image/avif" />
          <source srcSet={withExt(photoSrc, 'webp')} type="image/webp" />
          <img
            src={photoSrc}
            alt="Inside the Ommi Forge plant in Malur, Karnataka"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite/35 to-transparent"
        />
        <p className="absolute bottom-6 left-6 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper md:bottom-8 md:left-10">
          Our floor · Malur, Karnataka
        </p>
      </div>
    </section>
  );
}
