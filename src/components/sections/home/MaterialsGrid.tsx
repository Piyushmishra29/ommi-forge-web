'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import RevealHeading from '@/components/motion/RevealHeading';
import { MATERIALS, MATERIALS_INTRO } from '@/data/materials';
import type { Material } from '@/data/materials';

/**
 * MaterialsGrid
 *
 * ACT 02 — four cards (Carbon / Alloy / Stainless / Custom).
 *  - Desktop ≥ lg: horizontal scroll-snap.
 *  - Mobile: vertical stack with tap-to-flip.
 *  - Each card flips on hover/focus (desktop) or tap (mobile) to reveal
 *    grade-family names from `materials.ts`.
 *  - Reduced-motion: crossfade between faces (no rotateY).
 *
 * Mechanism: CSS 3D transform on an inner wrapper with `preserve-3d`,
 * front/back faces share absolute layout via `backface-visibility-hidden`.
 * Flip state is React-managed for tap-to-flip parity across pointer
 * types; hover toggles the same state.
 */

function flatGrades(m: Material): string[] {
  // Flatten the family.grades CSV strings into a single de-duped array.
  const all = m.families.flatMap((f) =>
    f.grades.split(',').map((g) => g.trim()).filter(Boolean),
  );
  return Array.from(new Set(all));
}

function FrontFace({ m }: { m: Material }) {
  return (
    // The card front paints on `render-bg` (#D9D9D9), not paper — mesh
    // measures only 2.25:1 there, which misses even the 3:1 large-text
    // floor, and ember reaches 3.84:1 (fine for the 96px numeral, short
    // of AA for the 11px tagline). `oxide` is the accent that clears
    // 4.5:1 on this surface, so both slots take it and the card keeps one
    // accent instead of two reds. See --color-oxide in globals.css.
    <article className="absolute inset-0 flex h-full flex-col justify-between bg-render-bg p-8 text-graphite md:p-10">
      <div>
        <p className="font-display text-[96px] font-light leading-none text-oxide">
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
        <p className="mt-6 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.22em] text-oxide">
          {m.tagline}
        </p>
      </div>
    </article>
  );
}

function BackFace({ m }: { m: Material }) {
  const grades = flatGrades(m);
  return (
    <article className="absolute inset-0 flex h-full flex-col justify-between bg-graphite p-8 text-paper md:p-10">
      <div>
        <Eyebrow className="text-paper">GRADES</Eyebrow>
        <h3 className="mt-4 font-display text-2xl font-light leading-tight md:text-3xl">
          {m.name}
        </h3>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
          {grades.map((g) => (
            <li
              key={g}
              className="flex items-center gap-2 font-body text-sm text-paper md:text-base"
            >
              <span aria-hidden className="inline-block h-1.5 w-1.5 bg-mesh" />
              {g}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        <Link
          href={`/materials/#${m.slug}`}
          data-magnetic
          data-cursor-label="Explore"
          // min-h-11: 12px uppercase text is an ~18px tall hit area on its
          // own, under the 44×44 minimum. The card back has room to spare.
          className="inline-flex min-h-11 items-center gap-2 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-saffron hover:text-paper transition-colors"
        >
          Explore materials <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

function FlipCard({ m, reduced }: { m: Material; reduced: boolean }) {
  const [flipped, setFlipped] = useState(false);

  if (reduced) {
    // Crossfade variant — no 3D rotation.
    return (
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        onFocus={() => setFlipped(true)}
        onBlur={() => setFlipped(false)}
        aria-pressed={flipped}
        aria-label={`${m.name} grades`}
        className="relative block h-full w-full text-left"
      >
        <AnimatePresence initial={false}>
          {flipped ? (
            <motion.div
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <BackFace m={m} />
            </motion.div>
          ) : (
            <motion.div
              key="front"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <FrontFace m={m} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={`${m.name} — flip for grades`}
      className="relative block h-full w-full text-left"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
      >
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <FrontFace m={m} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <BackFace m={m} />
        </div>
      </motion.div>
    </button>
  );
}

export default function MaterialsGrid() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Eyebrow>ACT 02 · MATERIALS</Eyebrow>
        <RevealHeading
          as="h2"
          className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-graphite md:text-6xl"
        >
          From four families, infinitely combined.
        </RevealHeading>
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
            lg:gap-10 lg:px-[max(2.5rem,calc((100vw-var(--container-page))/2))] lg:pb-6
          "
        >
          {MATERIALS.map((m) => (
            <li
              key={m.slug}
              className="
                relative h-[560px] w-full shrink-0
                lg:h-[720px] lg:w-[520px] lg:snap-start
              "
              data-magnetic
              data-cursor-label="Flip"
            >
              <FlipCard m={m} reduced={reduced} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
