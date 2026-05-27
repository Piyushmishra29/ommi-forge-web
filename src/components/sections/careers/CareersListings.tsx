'use client';

import { CAREER_LISTINGS, CAREERS_CTA } from '@/data/careers';

/**
 * CareersListings
 *
 * If `CAREER_LISTINGS` is empty (the current editorial stance — "we hire
 * when we hire") the component renders a single centered CV panel with
 * the email magnetic CTA. The listings code path is retained as a
 * commented stub for the day real openings are curated in.
 */
export default function CareersListings() {
  if (CAREER_LISTINGS.length === 0) {
    return (
      <section className="bg-paper pb-32 md:pb-40">
        <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
          <div className="mx-auto max-w-3xl border border-graphite/10 bg-paper p-10 text-center md:p-16">
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
              {CAREERS_CTA.eyebrow}
            </p>
            <h2 className="mt-6 font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
              {CAREERS_CTA.heading}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
              {CAREERS_CTA.body}
            </p>
            <a
              href={`mailto:${CAREERS_CTA.email}`}
              data-magnetic
              className="mt-10 inline-flex items-center justify-center bg-saffron px-8 py-3.5 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
            >
              {CAREERS_CTA.email}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Future: when curated listings exist, render them here.
  return null;
}
