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
 * Editorial opener for `/careers/`, on the dark ground. No 3D on this
 * route and none below it (§5.8) — the page with the least content gets
 * the least spectacle, and that restraint is the design.
 *
 *  - Eyebrow `JOIN OMMI · MALUR, KARNATAKA`, saffron on graphite.
 *  - `display-l`, the page-h1 role (§2.4). v2 ran this at
 *    `clamp(56px, 10vw, 110px)`, i.e. the home hero's scale on a
 *    secondary route; `display-xl` is the home h1 only.
 *  - Support sub-headline anchoring who we hire.
 *  - A full-bleed plant interior beneath — the page's one photo.
 *
 * Reduced-motion: the per-char stagger is skipped so the headline
 * renders at rest. Nothing is left at `opacity: 0` waiting for a
 * timeline that never runs — `gsap.from()` is only ever reached on the
 * non-reduced path, so the resting DOM is the complete DOM.
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
    <section ref={root} className="relative section-y pb-0">
      <div className="mx-auto max-w-page page-x">
        {/* `data-fade` has to sit on a real DOM node: <Eyebrow> does not
            spread unknown props, so the v2 `<Eyebrow data-fade>` selected
            nothing and the eyebrow simply never joined the timeline. */}
        <div data-fade>
          <Eyebrow>Join Ommi · Malur, Karnataka</Eyebrow>
        </div>

        <h1
          data-careers-headline
          className="type-display-l mt-8 max-w-4xl text-balance"
        >
          <SplitText as="span">{`Build with steel. Talk to us.`}</SplitText>
        </h1>

        <p data-fade className="type-lede mt-10 max-w-[68ch] text-pretty">
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
        className="relative mt-16 h-[44vh] min-h-[320px] w-full overflow-hidden bg-slag md:mt-24 md:h-[56vh]"
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
        {/* Legibility scrim for the caption below it, and the seam that
            lets the photo fall back into the graphite ground rather than
            ending on a hard edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite to-transparent"
        />
        <p className="type-eyebrow absolute bottom-6 left-6 text-paper md:bottom-8 md:left-10">
          Our floor · Malur, Karnataka
        </p>
      </div>
    </section>
  );
}
