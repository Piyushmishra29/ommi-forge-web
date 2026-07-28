import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { cssImageSet } from '@/lib/image-formats';
import { SUSTAINABILITY } from '@/data/about';

/**
 * Sustainability — 2-column block.
 *
 * Left: a tall, mesh-bordered image plate showing the rainwater /
 * vegetable-garden sustainability story.
 * Right: stewardship copy + magnetic CTA into `/contact/`.
 *
 * The original "Visit the plant →" CTA is preserved (per spec) — the
 * magnetic cursor already amplifies it on hover.
 */
export default function Sustainability() {
  return (
    <section className="relative bg-graphite py-32 text-paper md:py-40">
      {/* Subtle vertical hairline running the full section, anchoring
          the editorial composition. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-paper/5 md:block"
      />

      <div className="relative mx-auto grid max-w-page grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
        <div className="md:col-span-5">
          <div
            className="relative h-[480px] w-full overflow-hidden bg-steel/40 md:h-[560px]"
            aria-hidden
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                // CSS `image-set()`: AVIF (~138 KB) → WebP (~277 KB) →
                // 725 KB source JPG fallback.
                backgroundImage: cssImageSet(
                  '/assets/images/1-Copy-scaled.jpg',
                ),
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/55 to-transparent" />
            {/* Mesh corner accents */}
            <div className="absolute right-0 top-0 h-12 w-12 border-r-2 border-t-2 border-mesh" />
            <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-mesh" />
            {/* Caption tag */}
            <p className="absolute bottom-6 left-6 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper">
              Malur · Phase 3
            </p>
          </div>
        </div>

        <div className="md:col-span-7 md:pl-4">
          <Eyebrow className="text-paper">
            <span className="text-mesh">{SUSTAINABILITY.eyebrow}</span>
          </Eyebrow>
          <h2 className="mt-8 max-w-xl text-balance font-display text-3xl font-light leading-[1.1] text-paper md:text-5xl lg:text-6xl">
            {SUSTAINABILITY.heading}
          </h2>
          {/* max-w-xl caps the measure at ~72ch/16px (mobile, single-col
              full-bleed) down to ~64ch/18px (md 7-col) — the 7-col grid
              track alone is wide enough to run past 75ch on tablet
              widths just under the `md:` breakpoint, before the grid
              column split takes over. Matches the same cap used for the
              Values3Up slide body. */}
          <div className="mt-10 max-w-xl space-y-6 text-pretty font-body text-base leading-relaxed text-paper/80 md:text-lg md:leading-[1.7]">
            <p>{SUSTAINABILITY.body1}</p>
            <p>{SUSTAINABILITY.body2}</p>
          </div>

          <div className="mt-12">
            <Link
              href="/contact/"
              data-magnetic
              className="inline-flex items-center justify-center border border-mesh px-8 py-3.5 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-mesh transition-colors hover:bg-mesh hover:text-graphite"
            >
              Visit the plant →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
