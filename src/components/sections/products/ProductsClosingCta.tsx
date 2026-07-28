'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * ProductsClosingCta
 *
 * The foot of `/products`.
 *
 * v2 made this a full-bleed **saffron slab**. On the v3 dark ground that is
 * the one thing §6.3 rules out — a fully saturated colour used as a *fill*
 * reads as neon, and §6.4 is explicit that "one 4px saffron rule is the
 * entire accent vocabulary". So the slab becomes a `slag` panel on graphite
 * with a single saffron rule along its top edge and a saffron button; the
 * warmth is now a light source and an accent rather than a wall of colour.
 *
 * No `SplitText` either — §4.4 keeps the per-character reveal to `h1` on `/`
 * and `/about`. This is an `h2` on a third page, so it gets the site default
 * (preset #4 at the `press` curve, component band).
 *
 * Reduced motion: no timeline, and nothing is left at `opacity: 0` waiting
 * for a ScrollTrigger that will never fire.
 */
export default function ProductsClosingCta() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-pcta-fade]'), {
        y: 16,
        opacity: 0,
        duration: 0.48,
        ease: 'expo.out',
        stagger: 0.04,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="section-y relative">
      <div className="mx-auto max-w-page page-x">
        <div className="border-t-4 border-saffron bg-slag p-8 md:p-14">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div data-pcta-fade>
                <Eyebrow>Still scoping a part?</Eyebrow>
              </div>

              <h2 data-pcta-fade className="type-display-l mt-8">
                Talk to a metallurgist
              </h2>

              <p data-pcta-fade className="type-lede mt-6 max-w-[54ch]">
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
                className="type-eyebrow group inline-flex min-h-11 items-center gap-5 bg-saffron px-8 py-6 text-graphite transition-colors hover:bg-mesh hover:text-paper md:px-10 md:py-8"
              >
                Talk to a metallurgist
                <span
                  aria-hidden
                  className="text-2xl leading-none transition-transform duration-500 group-hover:translate-x-2"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
