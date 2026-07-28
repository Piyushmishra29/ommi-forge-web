'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import PartPoster from '@/components/three/PartPoster';
import type { Render } from '@/data/renders';

export type RendersGridProps = {
  renders: Render[];
  /** Slug currently promoted to the stage. Marked, not styled differently. */
  activeSlug: string;
  /**
   * Fired on hover-intent or keyboard focus. The dwell timing and the model
   * preload live in `RendersShowroom` — this component only reports intent.
   */
  onIntent: (slug: string) => void;
  onIntentEnd: () => void;
};

/**
 * The nine catalogue tiles (§5.6).
 *
 * **Static posters, not canvases.** Nine `<Canvas>` tiles is nine WebGL
 * contexts; the browser caps at 8–16 and evicts the oldest, which is how a
 * grid like this goes blank after a couple of navigations. The one live part
 * is the stage behind this grid.
 *
 * Each tile is a `<Link>` to the detail route, so the grid is navigable and
 * indexable with no JS at all; promoting a part to the stage is an
 * enhancement layered on hover/focus, never the only way to see a part.
 */
export function RendersGrid({
  renders,
  activeSlug,
  onIntent,
  onIntentEnd,
}: RendersGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6">
      {renders.map((render) => {
        const active = render.slug === activeSlug;
        return (
          <li key={render.slug}>
            <Link
              href={`/renders/${render.slug}`}
              data-magnetic
              // No local focus ring: the global two-tone ring in globals.css
              // is the one indicator that clears 3:1 on graphite, on saffron
              // and on a poster's own dark ground. A saffron-only ring here
              // measures ~2.2:1 against the render stage.
              className="group block"
              // `pointerType` gates this instead of a `hover: hover` media
              // query, so a hybrid laptop still gets the behaviour from its
              // mouse and never from its touchscreen — §5.6: do not fake
              // hover on tap.
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') onIntent(render.slug);
              }}
              onPointerLeave={onIntentEnd}
              // Focus is a deliberate act, so it commits immediately rather
              // than waiting out a dwell the keyboard cannot express.
              onFocus={() => onIntent(render.slug)}
              onBlur={onIntentEnd}
            >
              <div
                className={cn(
                  'relative aspect-square overflow-hidden bg-graphite',
                  // A hairline, not a box: `cinder` is 3.03:1 on graphite and
                  // clears 1.4.11, and it goes saffron on the promoted tile so
                  // the grid says which part the stage is currently showing.
                  'border transition-colors duration-200',
                  active ? 'border-saffron' : 'border-cinder/50 group-hover:border-cinder',
                )}
              >
                {/* alt="" (the default) on purpose: the caption immediately
                    below names the part, and it is inside the same link, so
                    the link's accessible name already carries it. A repeated
                    alt makes a screen reader announce it twice. */}
                <PartPoster model={render.model} fit="cover" />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-eyebrow">{render.title}</p>
                  <h3 className="type-display-s mt-2 truncate">
                    {render.productName}
                  </h3>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    'type-meta shrink-0 pt-1 transition-transform duration-200',
                    'group-hover:translate-x-1',
                    active ? 'text-saffron' : 'text-swarf',
                  )}
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default RendersGrid;
