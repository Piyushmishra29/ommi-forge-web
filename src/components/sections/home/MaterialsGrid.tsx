'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import { MATERIALS, MATERIALS_INTRO } from '@/data/materials';

/**
 * MaterialsGrid
 *
 * ACT 02 — four big cards (Carbon / Alloy / Stainless / Custom).
 *  - Desktop ≥ lg: horizontal scroll-snap (one card visible at a time on
 *    smaller viewports, ~2 cards on wide monitors). We rely on the
 *    browser's smooth-scroll + snap-mandatory rather than wiring up
 *    GSAP Observer — simpler, accessible, and degrades gracefully.
 *  - Mobile: vertical stack.
 *  - Cards subtly tilt on hover (`whileHover`) and are tagged
 *    `data-magnetic` so the global magnetic cursor picks them up.
 *  - Reduced-motion: no tilt; pure static cards.
 */
export default function MaterialsGrid() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-[1140px] px-6 md:px-10">
        <Eyebrow>ACT 02 · MATERIALS</Eyebrow>
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-graphite md:text-6xl">
          From four families, infinitely combined.
        </h2>
        <p className="mt-6 max-w-2xl font-body text-base text-steel md:text-lg">
          {MATERIALS_INTRO}
        </p>
      </div>

      {/* Cards — horizontal scroll on desktop, stacked on mobile */}
      <div className="mt-16">
        <ul
          className="
            flex flex-col gap-8 px-6 md:px-10
            lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:snap-x lg:snap-mandatory
            lg:gap-10 lg:px-[max(2.5rem,calc((100vw-1140px)/2))] lg:pb-6
          "
        >
          {MATERIALS.map((m) => {
            const Card = (
              <article className="flex h-full flex-col justify-between bg-render-bg p-8 text-graphite md:p-10">
                <div>
                  <p className="font-display text-[96px] font-light leading-none text-mesh">
                    {m.number}
                  </p>
                  <h3 className="mt-6 font-display text-3xl font-light leading-tight md:text-4xl">
                    {m.name}
                  </h3>
                </div>
                <div className="mt-8">
                  <p className="font-body text-sm leading-relaxed text-graphite/85 md:text-base">
                    {m.blurb}
                  </p>
                  <p className="mt-6 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.22em] text-mesh">
                    {m.tagline}
                  </p>
                </div>
              </article>
            );

            return (
              <li
                key={m.slug}
                className="
                  w-full shrink-0 lg:w-[520px] lg:h-[720px]
                  lg:snap-start
                "
                data-magnetic
                style={{ perspective: '1200px' }}
              >
                {reduced ? (
                  <div className="h-full">{Card}</div>
                ) : (
                  <motion.div
                    whileHover={{ rotateY: -3, rotateX: 2, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="h-full"
                  >
                    {Card}
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
