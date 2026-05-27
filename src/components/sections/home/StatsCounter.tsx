'use client';

import Eyebrow from '@/components/ui/Eyebrow';
import NumberCounter from '@/components/ui/NumberCounter';
import { STATS } from '@/data/home';

/**
 * StatsCounter
 *
 * Graphite slab section with paper text. Four counters set in
 * mesh-orange Manrope at clamp(80px, 14vw, 200px) above Work Sans
 * uppercase labels. NumberCounter honours reduced-motion internally.
 *
 * The huge font-size lives on the counter's outer span via an inline
 * style + Tailwind utility composition — we deliberately avoid
 * styled-jsx so the section stays a plain server-friendly component
 * once the surrounding 'use client' boundary is the only barrier.
 */
export default function StatsCounter() {
  return (
    <section className="bg-graphite py-32 text-paper md:py-40">
      <div className="mx-auto max-w-[1140px] px-6 md:px-10">
        <Eyebrow className="text-paper">OUR POWER IS NUMBERS</Eyebrow>
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-paper md:text-6xl">
          Words can only mean so much.
        </h2>
        <p className="mt-6 max-w-xl font-body text-base text-paper/70 md:text-lg">
          Which is why our numbers speak for themselves.
        </p>

        <ul className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex min-w-0 flex-col gap-4 overflow-hidden border-t border-paper/15 pt-6"
            >
              {/* Fluid font sizing tuned so the widest stat ("1,000+") fits
                  its 4-col cell at 1140px container without spilling into
                  siblings. Wider stats get less headroom; smaller stats
                  (single digit "8" / "1") still feel big.
                  Cell width at lg ≈ 260px → cap font-size at ~72px so
                  "1,000+" stays inside the cell. */}
              <span
                className="block font-display font-bold leading-[0.92] text-saffron tabular-nums"
                style={{
                  fontSize: 'clamp(56px, 9.5vw, 112px)',
                  letterSpacing: '-0.04em',
                  textShadow: '0 0 36px rgba(255,153,51,0.18)',
                }}
              >
                <NumberCounter to={stat.value} suffix={stat.suffix} />
              </span>
              <p className="font-eyebrow text-sm font-semibold uppercase tracking-[0.22em] text-paper">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
