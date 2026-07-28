'use client';

import Eyebrow from '@/components/ui/Eyebrow';
import NumberCounter from '@/components/ui/NumberCounter';
import RevealHeading from '@/components/motion/RevealHeading';
import { STATS } from '@/data/home';

/**
 * Same locale + grouping as NumberCounter's internal formatter, so the
 * invisible "ghost" below measures exactly the string the counter will
 * finish on ("1,000+", not "1000+").
 */
const statFormatter = new Intl.NumberFormat('en-IN');

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
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Eyebrow className="text-paper">OUR POWER IS NUMBERS</Eyebrow>
        <RevealHeading
          as="h2"
          className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-paper md:text-6xl"
        >
          Words can only mean so much.
        </RevealHeading>
        <p className="mt-6 max-w-xl font-body text-base text-paper/70 md:text-lg">
          Which is why our numbers speak for themselves.
        </p>

        <ul className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-12 xl:grid-cols-4 xl:gap-12">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex min-w-0 flex-col gap-4 border-t border-paper/15 pt-6 pr-4"
            >
              {/* Fluid font sizing tuned so the widest stat ("1,000+",
                  ~3.1em wide in Manrope bold) fits a 4-up xl cell
                  (≈249px at gap-12) WITH breathing room. 96px overflowed
                  into the next column — capped at 72px so "1,000+" lands
                  ~221px wide, leaving a comfortable gutter. Single-digit
                  stats still read large. gap-12 everywhere for air. */}
              {/* `grid` (not `block`) stacks an invisible ghost of the FINAL
                  string under the live counter in the same cell, so the box
                  is sized for "1,000+" from first paint. Without it the
                  counter mounts at "0" and the element's width grows through
                  the whole 1.6 s tween — reserve-space / CLS. tabular-nums
                  alone only equalises digit WIDTH, not digit COUNT. */}
              <span
                className="grid font-display font-bold leading-[0.92] text-saffron tabular-nums"
                style={{
                  fontSize: 'clamp(52px, 5.5vw, 72px)',
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 36px rgba(255,153,51,0.18)',
                }}
              >
                <span
                  aria-hidden
                  className="invisible col-start-1 row-start-1"
                >
                  {`${statFormatter.format(stat.value)}${stat.suffix}`}
                </span>
                <span className="col-start-1 row-start-1">
                  <NumberCounter to={stat.value} suffix={stat.suffix} />
                </span>
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
