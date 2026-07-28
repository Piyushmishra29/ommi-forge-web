import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { cssImageSet } from '@/lib/image-formats';
import { SUSTAINABILITY } from '@/data/about';

/**
 * Sustainability — the stewardship block that closes `/about`.
 *
 * A 5/7 split, never 6/6 (§2.5: a half-and-half split reads as a template).
 * Left is a real plant photograph, right is `SUSTAINABILITY` verbatim.
 *
 * v2 framed the photo with two mesh-orange corner brackets. §6.9 rules
 * those out by name — HUD corner brackets are mech-cockpit vocabulary, and
 * this is a steel forge. What replaced them is a single cinder hairline,
 * which is how the rest of the site separates things.
 *
 * No `'use client'`: nothing here moves, so it stays a server component and
 * costs the route no hydration.
 */
export default function Sustainability() {
  return (
    <section aria-labelledby="sustainability-heading" className="relative">
      <div className="page-x section-y mx-auto grid max-w-page grid-cols-1 gap-12 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <div
            className="relative h-[420px] w-full overflow-hidden border border-cinder md:h-[560px]"
            aria-hidden
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                // CSS `image-set()`: AVIF (~138 KB) → WebP (~277 KB) →
                // 725 KB source JPG fallback.
                backgroundImage: cssImageSet('/assets/images/1-Copy-scaled.jpg'),
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 to-transparent" />
            <p className="type-meta absolute bottom-6 left-6 uppercase tracking-[0.26em] text-paper">
              Malur · Phase 3
            </p>
          </div>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Eyebrow>{SUSTAINABILITY.eyebrow}</Eyebrow>
          <h2
            id="sustainability-heading"
            className="type-display-l mt-8 max-w-[16ch] text-balance"
          >
            {SUSTAINABILITY.heading}
          </h2>

          {/* 68ch: the 6-column track alone runs past 75ch at the tablet
              widths just below `md:`, where this column is still full-bleed. */}
          <div className="mt-10 max-w-[68ch] space-y-6">
            <p className="type-lede text-pretty">{SUSTAINABILITY.body1}</p>
            <p className="type-lede text-pretty">{SUSTAINABILITY.body2}</p>
          </div>

          <div className="mt-12">
            <Link
              href="/contact/"
              data-magnetic
              className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-cinder px-8 py-4 transition-colors duration-200 hover:border-mesh hover:text-mesh"
            >
              Visit the plant →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
