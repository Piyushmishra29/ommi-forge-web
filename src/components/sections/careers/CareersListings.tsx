'use client';

import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { CAREER_LISTINGS, CAREERS_CTA, WHAT_WE_LOOK_FOR } from '@/data/careers';

/**
 * CareersListings
 *
 * If `CAREER_LISTINGS` is empty (the current editorial stance — "we hire
 * when we hire") the component renders:
 *
 *   1. A CV-request panel: eyebrow, large display headline, body, and a
 *      saffron magnetic mailto.
 *   2. A 3-up "What we look for" grid naming the three attributes we
 *      hire for (curiosity, care, continuity).
 *   3. A secondary CTA pointing at `/contact/` for visitors who'd rather
 *      walk the plant.
 *
 * All on graphite (§5.8). No paper cards on this route: a paper card is
 * for cold technical information, and none of this is a spec.
 *
 * The v2 panel was centred — `mx-auto max-w-3xl text-center`, with the
 * secondary CTA in a `justify-center` row. §6.22 rules out
 * centred-everything pages, and it was also the only page on the site
 * whose measure did not start at the same left edge as its own hero.
 * Everything here is now left-aligned against that edge.
 *
 * The listings code path is retained as a future stub — drop curated
 * openings into `CAREER_LISTINGS` and render them above this panel.
 */
export default function CareersListings() {
  if (CAREER_LISTINGS.length > 0) {
    // Future: when curated listings exist, render them here.
    return null;
  }

  return (
    <>
      {/* 1. CV-request editorial moment ---------------------------- */}
      <section className="section-y">
        <div className="mx-auto max-w-page page-x">
          <Eyebrow>{CAREERS_CTA.eyebrow}</Eyebrow>
          <h2 className="type-display-l mt-8 max-w-3xl text-balance">
            {CAREERS_CTA.heading}
          </h2>
          <p className="type-lede mt-8 max-w-[68ch] text-pretty">
            {CAREERS_CTA.body}
          </p>
          <a
            href={`mailto:${CAREERS_CTA.email}`}
            data-magnetic
            data-cursor-label="Write to us"
            className="type-eyebrow mt-12 inline-flex min-h-11 items-center justify-center bg-saffron px-10 py-5 text-graphite transition-colors hover:bg-mesh hover:text-graphite"
          >
            {CAREERS_CTA.email}
          </a>
        </div>
      </section>

      {/* 2. "What we look for" 3-up -------------------------------- */}
      <section
        aria-labelledby="what-we-look-for"
        className="section-y border-t border-cinder"
      >
        <div className="mx-auto max-w-page page-x">
          <div className="mb-12 max-w-2xl md:mb-16">
            <Eyebrow>What we look for</Eyebrow>
            {/* h2, not v2's h3: this section is a sibling of the CV panel,
                not a child of it, so an h3 here implied a nesting that the
                document outline does not have. */}
            <h2 id="what-we-look-for" className="type-display-l mt-8 text-balance">
              Three traits. The rest we&apos;ll teach.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {WHAT_WE_LOOK_FOR.map((trait) => (
              <article
                key={trait.number}
                // slag with an ash edge. These panels are not focusable, so
                // cinder's 3.03:1-on-graphite would technically do — but the
                // edge is what separates one trait from the next, and cinder
                // drops to 2.60:1 against the slag fill, which is the side
                // that matters for reading the panel as a panel.
                className="flex min-h-[300px] flex-col justify-between border border-ash bg-slag p-8 md:p-10"
              >
                <p className="type-eyebrow text-saffron">
                  <span>{trait.number}</span>
                  <span aria-hidden className="px-3 text-cinder">
                    ·
                  </span>
                  <span className="text-paper">{trait.tag}</span>
                </p>
                <p className="type-body mt-8 text-pretty">{trait.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 md:mt-20">
            <Link
              href="/contact/"
              data-magnetic
              data-cursor-label="Visit"
              // Border and label both saffron (7.57:1) rather than v2's mesh
              // (5.07:1) — this is a link, and saffron is the link colour on
              // dark; mesh is reserved for the hover step off it.
              className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-saffron px-10 py-5 text-saffron transition-colors hover:bg-saffron hover:text-graphite"
            >
              Visit the plant →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
