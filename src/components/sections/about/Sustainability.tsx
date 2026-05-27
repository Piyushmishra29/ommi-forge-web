import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { cssImageSet } from '@/lib/image-formats';
import { SUSTAINABILITY } from '@/data/about';

/**
 * Sustainability — 2-column block.
 * Left: image (rainwater system / vegetable garden — graceful if missing).
 * Right: eyebrow + heading + two paragraphs of stewardship copy.
 */
export default function Sustainability() {
  return (
    <section className="bg-graphite py-32 text-paper md:py-40">
      <div className="mx-auto grid max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
        <div className="md:col-span-5">
          <div
            className="relative h-[480px] w-full overflow-hidden bg-steel/40"
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
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/40 to-transparent" />
            {/* Mesh corner accent */}
            <div className="absolute right-0 top-0 h-12 w-12 border-r-2 border-t-2 border-mesh" />
            <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-mesh" />
          </div>
        </div>

        <div className="md:col-span-7 md:pl-4">
          <Eyebrow className="text-paper">
            <span className="text-mesh">{SUSTAINABILITY.eyebrow}</span>
          </Eyebrow>
          <h2 className="mt-6 max-w-xl font-display text-3xl font-light leading-tight text-paper md:text-5xl">
            {SUSTAINABILITY.heading}
          </h2>
          <div className="mt-10 space-y-6 font-body text-base leading-relaxed text-paper/80 md:text-lg md:leading-[1.7]">
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
