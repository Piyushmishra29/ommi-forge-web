'use client';

import Link from 'next/link';
import { CAREER_LISTINGS, CAREERS_CTA, WHAT_WE_LOOK_FOR } from '@/data/careers';

/**
 * CareersListings
 *
 * If `CAREER_LISTINGS` is empty (the current editorial stance — "we hire
 * when we hire") the component renders a full editorial moment:
 *
 *   1. A centred CV-request panel with eyebrow, large display headline,
 *      body, and a saffron magnetic mailto.
 *   2. A 3-up "What we look for" grid on graphite that names the three
 *      attributes we hire for (curiosity, care, continuity).
 *   3. A secondary magnetic CTA that points to `/contact/` so visitors
 *      who'd rather walk the plant have a next step.
 *
 * The listings code path is retained as a future stub — drop curated
 * openings into `CAREER_LISTINGS` and render them above the editorial
 * panel.
 */
export default function CareersListings() {
  if (CAREER_LISTINGS.length === 0) {
    return (
      <>
        {/* 1. CV-request editorial moment ---------------------------- */}
        <section className="bg-paper pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="mx-auto max-w-page px-6 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              {/* Paper section: ember for the label text (5.19:1), mesh kept
                  on the dash below — non-text ink only needs 3:1. The two
                  graphite sections further down stay all-mesh. */}
              <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-ember">
                <span
                  aria-hidden
                  className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
                />
                {CAREERS_CTA.eyebrow}
              </p>
              <h2
                className="mt-8 text-balance font-display font-light leading-[1.02] text-graphite"
                style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}
              >
                {CAREERS_CTA.heading}
              </h2>
              {/* max-w-xl: see CareersHero for why -2xl overruns the
                  65-75ch measure at 16px on tablet widths just under
                  `md:`. */}
              <p className="mx-auto mt-8 max-w-xl text-pretty font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
                {CAREERS_CTA.body}
              </p>
              <a
                href={`mailto:${CAREERS_CTA.email}`}
                data-magnetic
                data-cursor-label="Write to us"
                className="mt-12 inline-flex items-center justify-center bg-saffron px-10 py-5 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
              >
                {CAREERS_CTA.email}
              </a>
            </div>
          </div>
        </section>

        {/* 2. "What we look for" 3-up grid -------------------------- */}
        <section className="bg-graphite py-24 text-paper md:py-32">
          <div className="mx-auto max-w-page px-6 md:px-10">
            <div className="mb-12 max-w-2xl md:mb-16">
              <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                <span
                  aria-hidden
                  className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
                />
                What we look for
              </p>
              <h3 className="mt-6 text-balance font-display text-3xl font-light leading-tight text-paper md:text-5xl">
                Three traits. The rest we&apos;ll teach.
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {WHAT_WE_LOOK_FOR.map((trait) => (
                <article
                  key={trait.number}
                  className="relative flex min-h-[300px] flex-col justify-between border border-paper/10 bg-graphite p-8 md:p-10"
                >
                  <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                    <span className="text-mesh">{trait.number}</span>
                    <span aria-hidden className="px-3 text-paper/30">
                      ·
                    </span>
                    <span className="text-paper">{trait.tag}</span>
                  </p>
                  <p className="mt-8 text-pretty font-body text-base leading-relaxed text-paper/80 md:text-lg md:leading-[1.65]">
                    {trait.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-16 flex justify-center md:mt-20">
              <Link
                href="/contact/"
                data-magnetic
                data-cursor-label="Visit"
                className="inline-flex items-center justify-center border border-mesh bg-transparent px-10 py-5 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-mesh transition-colors hover:border-saffron hover:bg-saffron hover:text-graphite"
              >
                Visit the plant →
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Future: when curated listings exist, render them here.
  return null;
}
