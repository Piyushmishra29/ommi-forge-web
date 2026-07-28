'use client';

import Eyebrow from '@/components/ui/Eyebrow';
import NumberCounter from '@/components/ui/NumberCounter';
import RevealHeading from '@/components/motion/RevealHeading';
import { STATS } from '@/data/home';

/**
 * Same locale + grouping as NumberCounter's internal formatter, so the
 * invisible ghost below measures exactly the string the counter will finish
 * on ("1,000+", not "1000+").
 */
const statFormatter = new Intl.NumberFormat('en-IN');

/**
 * Beat 8 — the numbers.
 *
 * These are the only counters on the site: `STATS` are real figures (eight
 * power hammers, not "10+"), and §6 rule 17 rules out counting a decorative
 * number for effect.
 */
export default function StatsCounter() {
  return (
    <section className="relative w-full section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>OUR POWER IS NUMBERS</Eyebrow>
        <RevealHeading as="h2" className="type-display-l mt-6 max-w-[20ch]">
          Words can only mean so much.
        </RevealHeading>
        <p className="type-lede mt-6 max-w-[46ch]">
          Which is why our numbers speak for themselves.
        </p>

        <ul className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex min-w-0 flex-col gap-4 border-t border-rule pr-4 pt-6"
            >
              {/* `grid` (not `block`) stacks an invisible ghost of the FINAL
                  string under the live counter in the same cell, so the box
                  is sized for "1,000+" from first paint. Without it the
                  counter mounts at "0" and the element's width grows through
                  the whole 1.6s tween — reserved space, not a layout shift.
                  `tabular-nums` (carried by .type-data) only equalises digit
                  WIDTH, not digit COUNT, so it cannot replace this. */}
              {/* `.type-data` carries the role — Work Sans 800, tabular
                  figures, -0.02em — but its 88px ceiling is sized for a
                  single figure, not for four in a row. Measured at 1440: a
                  4-up cell is 249px and "1,000+" sets ~290px at 88px, so the
                  second and third stats overlapped. Capped to fit the cell
                  with its gutter intact. */}
              <span className="type-data grid text-[clamp(38px,4.2vw,58px)] text-saffron">
                <span aria-hidden className="invisible col-start-1 row-start-1">
                  {`${statFormatter.format(stat.value)}${stat.suffix}`}
                </span>
                <span className="col-start-1 row-start-1">
                  <NumberCounter to={stat.value} suffix={stat.suffix} />
                </span>
              </span>
              <p className="type-eyebrow text-swarf">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
