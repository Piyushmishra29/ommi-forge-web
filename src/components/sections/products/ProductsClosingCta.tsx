'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import SplitText from '@/components/motion/SplitText';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * ProductsClosingCta
 *
 * Saffron slab pinned to the foot of `/products`. SplitText headline
 * sweeps in via GSAP when the section reaches 70% viewport — same
 * cadence as the home page closer for visual consistency.
 *
 * The whole tile is a magnetic link to `/contact/` (the magnetic ring
 * is handled globally by `MagneticCursor` reading `data-magnetic`).
 * Subtle ambient hammer-mark glyph sits behind the headline so the
 * slab isn't a flat field of colour.
 *
 * Reduced-motion: no GSAP timeline; headline renders at rest.
 */
export default function ProductsClosingCta() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-pcta-headline] [data-char]'), {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.035,
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
          once: true,
        },
      });
      gsap.from(el.querySelectorAll('[data-pcta-fade]'), {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className="relative isolate overflow-hidden bg-saffron text-graphite"
    >
      {/* Ambient glyph — an outsized infinity mark bled off the right
          edge at graphite/5, so it reads as paper texture rather than
          as an icon. Purely decorative, hence aria-hidden.
          NB: the sibling closers (home + /solutions) use gradient
          vignettes instead; this slab is the only one carrying a
          glyph. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 font-display text-[clamp(360px,55vw,720px)] font-light leading-none text-graphite/5 select-none"
      >
        ∞
      </span>

      <div className="relative mx-auto flex max-w-page flex-col gap-12 px-6 py-24 md:flex-row md:items-end md:justify-between md:px-10 md:py-32">
        <div className="max-w-3xl">
          <Eyebrow data-pcta-fade>
            <span className="text-graphite">Still scoping a part?</span>
          </Eyebrow>

          <div data-pcta-headline className="mt-8">
            <SplitText
              as="h2"
              className="font-display font-light leading-[0.95] text-graphite"
              charClassName="text-[clamp(48px,9vw,128px)]"
            >
              {`Talk to a metallurgist`}
            </SplitText>
          </div>
          <p
            data-pcta-fade
            className="mt-6 max-w-xl font-body text-base leading-relaxed text-graphite/80 md:text-lg md:leading-[1.6]"
          >
            Bring a drawing, a CAD file or a rough sketch on the back of a
            workshop note. We&rsquo;ll come back with material, tonnage and
            heat-treat in one reply.
          </p>
        </div>

        <div data-pcta-fade className="shrink-0">
          <Link
            href="/contact/"
            data-magnetic
            data-cursor-label="Talk →"
            className="group inline-flex items-center gap-5 border border-graphite bg-graphite px-8 py-6 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-paper hover:text-graphite md:px-10 md:py-8"
          >
            <span className="text-[clamp(14px,1.4vw,18px)] tracking-[0.18em]">
              Talk to a metallurgist
            </span>
            <span
              aria-hidden
              className="text-2xl leading-none transition-transform duration-500 group-hover:translate-x-2 md:text-3xl"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
