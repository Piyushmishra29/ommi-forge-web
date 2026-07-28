import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { MATERIALS, MATERIALS_INTRO } from '@/data/materials';
import type { Material } from '@/data/materials';

/**
 * Beat 5 — the cold bench.
 *
 * The absence of 3D here is the design (§5.1). This is the metallurgist's
 * side of the building: fluorescent light, printed sheets, no fire. Four
 * paper cards on the dark ground, and the contrast with the act above is the
 * argument the section is making.
 *
 * A paper card is a printed datasheet, not a UI card (§2.3): square corners,
 * no shadow, a single 4px saffron rule at the top and nothing else warm.
 * Inside it, `.paper-card` re-points the six semantic ink variables, so the
 * v2 light-mode contrast system applies verbatim to this subtree through the
 * cascade rather than through anything an author has to remember.
 *
 * v2 flipped these cards on hover to reveal the grades. That is a 3D card
 * tilt (§6 rule 15) and, worse, it put real technical content behind an
 * interaction with no affordance on touch. The grades are printed on the
 * sheet now, which is where a grade table belongs.
 */
function MaterialCard({ m }: { m: Material }) {
  return (
    <article className="paper-card flex flex-col p-8 md:p-10" data-rule="saffron">
      <p className="type-display-m text-ink-accent">{m.number}</p>
      <h3 className="type-display-m mt-4">{m.name}</h3>
      <p className="type-body mt-5">{m.blurb}</p>

      {/* The grade table. `.type-spec` is the role for grade codes and
          dimensions — Roboto 600 with tabular figures, so C10/C15/C20 line
          up column-wise the way they do on a real mill certificate. */}
      <dl className="mt-8">
        {m.families.map((family) => (
          <div
            key={family.name}
            className="border-t border-rule py-4 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6"
          >
            <dt className="type-small text-ink-muted">{family.name}</dt>
            <dd className="type-spec mt-1 text-ink sm:mt-0">{family.grades}</dd>
          </div>
        ))}
      </dl>

      <p className="type-meta mt-8 uppercase text-ink-accent">{m.tagline}</p>

      <Link
        href={`/materials/#${m.slug}`}
        data-magnetic
        data-cursor-label="Explore"
        // min-h-11: 12px uppercase text is an ~18px tall hit area on its own,
        // under the 44×44 minimum. The sheet has room to spare.
        className="mt-auto inline-flex min-h-11 items-center gap-2 pt-8 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-ink-accent transition-colors hover:text-graphite"
      >
        Explore materials <span aria-hidden>→</span>
      </Link>
    </article>
  );
}

export default function MaterialsGrid() {
  return (
    <section className="relative w-full section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>MATERIALS</Eyebrow>
        <h2 className="type-display-l mt-6 max-w-[18ch]">
          From four families, infinitely combined.
        </h2>
        <p className="type-lede mt-6 max-w-[62ch]">{MATERIALS_INTRO}</p>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {MATERIALS.map((m) => (
            <MaterialCard key={m.slug} m={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
