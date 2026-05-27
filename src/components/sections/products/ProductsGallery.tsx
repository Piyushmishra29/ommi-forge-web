'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  motion,
  type Variants,
} from 'framer-motion';
import {
  APPLICATION_LABEL,
  PRODUCTS,
  productApplications,
  productCategory,
  type ProductApplication,
  type ProductItem,
} from '@/data/products';
// Single source of truth for lazy-loaded three components — keeps
// three.js in one shared async chunk instead of duplicating it per route.
import { StlPreview, StlViewer } from '@/components/three/lazy';
import { withExt } from '@/lib/image-formats';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Explicit pixel dimensions per aspect — keep these in lockstep with
 * `aspectClass` so `<img width/height>` always declares a box matching
 * the rendered aspect ratio. Concrete numbers prevent CLS while the
 * lazy-loaded JPGs decode.
 */
const aspectSize: Record<ProductItem['aspect'], { w: number; h: number }> = {
  tall: { w: 600, h: 800 },
  wide: { w: 800, h: 600 },
  square: { w: 600, h: 600 },
};

const aspectClass: Record<ProductItem['aspect'], string> = {
  tall: 'aspect-[3/4]',
  wide: 'aspect-[4/3]',
  square: 'aspect-square',
};

const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* -------------------------------------------------------------------------- */
/*  Section header                                                            */
/* -------------------------------------------------------------------------- */

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
}

function SectionHeader({ eyebrow, title, intro, align = 'left' }: SectionHeaderProps) {
  return (
    <header
      className={
        align === 'center'
          ? 'mx-auto max-w-3xl text-center'
          : 'max-w-3xl'
      }
    >
      <Eyebrow>
        <span className="text-mesh">{eyebrow}</span>
      </Eyebrow>
      <h2 className="mt-6 font-display text-3xl font-light leading-[1.05] text-graphite md:text-5xl">
        {title}
      </h2>
      {intro ? (
        <p className="mt-5 font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tile primitives                                                           */
/* -------------------------------------------------------------------------- */

interface TileProps {
  item: ProductItem;
  onOpen: (slug: string) => void;
  /** Featured tiles use a heavier label + 33vh desktop height. */
  featured?: boolean;
}

function ProductTile({ item, onOpen, featured = false }: TileProps) {
  return (
    <motion.button
      type="button"
      layoutId={`card-${item.slug}`}
      data-magnetic
      onClick={() => onOpen(item.slug)}
      className="group relative block w-full overflow-hidden bg-render-bg text-left focus:outline-none"
    >
      <div
        className={
          featured
            ? 'aspect-[4/5] md:aspect-auto md:h-[33vh]'
            : aspectClass[item.aspect]
        }
      >
        {item.kind === 'stl' ? (
          <StlPreview
            src={item.stl}
            ariaLabel={`${item.name} 3D preview`}
            className="h-full w-full"
          />
        ) : (
          <picture>
            <source srcSet={withExt(item.src, 'avif')} type="image/avif" />
            <source srcSet={withExt(item.src, 'webp')} type="image/webp" />
            <img
              src={item.src}
              alt={item.name}
              width={aspectSize[item.aspect].w}
              height={aspectSize[item.aspect].h}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
        )}
      </div>

      {/* Hover label — richer treatment for featured tiles. */}
      {featured ? (
        <>
          {/* Top-left meta strip — always visible on featured so the
              section reads with rhythm even at rest. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 md:p-6">
            <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.28em] text-paper [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
              Featured
            </p>
            <span
              aria-hidden
              className="h-px w-10 translate-y-2 bg-saffron transition-all duration-500 group-hover:w-16"
            />
          </div>
          {/* Bottom slab with full label, slides up on hover. */}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-4 bg-gradient-to-t from-graphite/90 via-graphite/55 to-transparent p-6 opacity-95 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:p-8">
              <div>
                <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.28em] text-saffron">
                  {item.code}
                </p>
                <h3 className="mt-2 font-display text-2xl font-light leading-tight text-paper md:text-3xl">
                  {item.name}
                </h3>
              </div>
              <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.28em] text-paper">
                View →
              </span>
            </div>
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-4 bg-gradient-to-t from-graphite/85 via-graphite/40 to-transparent p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div>
            <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-mesh">
              {item.code}
            </p>
            <h3 className="mt-1 font-display text-xl font-light text-paper md:text-2xl">
              {item.name}
            </h3>
          </div>
          <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper">
            View →
          </span>
        </div>
      )}

      {/* Always-on caption strip — touch / no-hover. Skipped for
          featured because their bottom slab is already visible. */}
      {!featured ? (
        <div className="bg-paper p-4 md:hidden">
          <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-mesh">
            {item.code}
          </p>
          <h3 className="mt-1 font-display text-lg font-light text-graphite">
            {item.name}
          </h3>
        </div>
      ) : null}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gallery (owns modal state + renders three sections)                       */
/* -------------------------------------------------------------------------- */

/**
 * ProductsGallery
 *
 * Three editorial bands stacked vertically:
 *  1. Featured (3-up, 33vh desktop tiles).
 *  2. Catalogue (CSS-columns masonry of the rest, gap-4 for a tighter
 *     read than the previous gap-6).
 *  3. By application (Auto / Industrial / Agricultural) — a small
 *     compact list of chips so visitors can navigate the catalogue by
 *     industry, not just by part name.
 *
 * The modal overlay is shared across all three sections — `layoutId`
 * lives on each card, regardless of which band it sits in, so the
 * tap-to-zoom interaction works uniformly.
 */
export default function ProductsGallery() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = PRODUCTS.find((p) => p.slug === activeSlug) ?? null;

  // Pre-bucket items once per render. Memoising means the by-application
  // groups don't re-allocate on every modal open/close.
  const { featured, catalogue, byApplication } = useMemo(() => {
    const featured = PRODUCTS.filter((p) => productCategory(p) === 'featured');
    const catalogue = PRODUCTS.filter((p) => productCategory(p) !== 'featured');
    const order: ProductApplication[] = ['auto', 'industrial', 'agricultural'];
    const byApplication = order.map((app) => ({
      key: app,
      label: APPLICATION_LABEL[app],
      items: PRODUCTS.filter((p) => productApplications(p).includes(app)),
    }));
    return { featured, catalogue, byApplication };
  }, []);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSlug(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return (
    <>
      {/* ----- Featured band ------------------------------------------------ */}
      <section
        id="gallery"
        aria-labelledby="featured-heading"
        className="bg-paper pt-4 pb-20 md:pt-8 md:pb-28"
      >
        <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
          <SectionHeader
            eyebrow="Featured · Three hero parts"
            title="The parts our customers ask for most."
            intro="Walk a metallurgist through these and you'll cover the bulk of what leaves Malur — heavy-duty trunnions, drive sprockets and near-net cylinder heads."
          />
        </div>

        <div className="mt-12 md:mt-16">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-3 md:gap-1">
            {featured.map((p) => (
              <div key={p.slug} id={`product-${p.slug}`}>
                <ProductTile item={p} onOpen={setActiveSlug} featured />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Catalogue masonry ------------------------------------------- */}
      <section
        aria-labelledby="catalogue-heading"
        className="bg-paper pb-24 md:pb-32"
      >
        <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
          <SectionHeader
            eyebrow="Full catalogue"
            title="Every named part we forge."
            intro="Levers, links, valve bodies and process photography — tap any tile for the full 3D viewer."
          />

          <div className="mt-12 columns-1 gap-4 md:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid md:mt-16">
            {catalogue.map((p) => (
              <div key={p.slug} id={`product-${p.slug}`}>
                <ProductTile item={p} onOpen={setActiveSlug} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- By application ---------------------------------------------- */}
      <section
        aria-labelledby="by-application-heading"
        className="border-t border-graphite/10 bg-paper pb-24 pt-20 md:pb-32 md:pt-24"
      >
        <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
          <SectionHeader
            eyebrow="By application"
            title="What industry are you serving?"
            intro="Same parts, grouped by the industries they typically land in. Click a chip to zoom the 3D viewer."
          />

          <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-12">
            {byApplication.map((group) => (
              <div key={group.key} className="border-t border-graphite/15 pt-6">
                <div className="flex items-baseline justify-between">
                  <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.28em] text-graphite">
                    {group.label}
                  </p>
                  <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.28em] text-ash">
                    {group.items.length.toString().padStart(2, '0')}
                  </span>
                </div>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((p) => (
                    <li key={`${group.key}-${p.slug}`}>
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setActiveSlug(p.slug)}
                        className="group inline-flex items-center gap-2 border border-graphite/15 bg-paper px-3 py-2 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.16em] text-graphite transition-colors hover:border-mesh hover:bg-mesh hover:text-paper"
                      >
                        <span>{p.name}</span>
                        <span
                          aria-hidden
                          className="font-eyebrow text-[9px] font-semibold text-ash transition-colors group-hover:text-paper/70"
                        >
                          {p.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Shared overlay ---------------------------------------------- */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="product-overlay"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-graphite/85 p-4 backdrop-blur-sm md:p-10"
            onClick={() => setActiveSlug(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${active.name} detail`}
          >
            <motion.div
              layoutId={`card-${active.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden bg-paper md:grid-cols-12"
            >
              <div className="relative aspect-square w-full bg-render-bg md:col-span-7 md:aspect-auto md:min-h-[560px]">
                {active.kind === 'stl' ? (
                  <StlViewer
                    src={active.stl}
                    title={active.name}
                    productName={active.code}
                    autoRotate
                    className="h-full w-full"
                  />
                ) : (
                  <picture>
                    <source
                      srcSet={withExt(active.src, 'avif')}
                      type="image/avif"
                    />
                    <source
                      srcSet={withExt(active.src, 'webp')}
                      type="image/webp"
                    />
                    <img
                      src={active.src}
                      alt={active.name}
                      width={aspectSize[active.aspect].w}
                      height={aspectSize[active.aspect].h}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </picture>
                )}
              </div>

              <div className="flex flex-col justify-between p-8 md:col-span-5 md:p-10">
                <div>
                  <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                    Catalogue · {active.code}
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-light leading-tight text-graphite md:text-4xl">
                    {active.name}
                  </h2>
                  <p className="mt-6 font-body text-base leading-relaxed text-steel md:text-lg">
                    {active.blurb}
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {productApplications(active).map((app) => (
                      <li
                        key={app}
                        className="border border-graphite/20 px-2.5 py-1 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite"
                      >
                        {APPLICATION_LABEL[app]}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href="/contact/"
                    data-magnetic
                    className="inline-flex items-center justify-center bg-saffron px-6 py-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
                  >
                    Request a quote
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveSlug(null)}
                    data-magnetic
                    className="font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-steel transition-colors hover:text-graphite"
                  >
                    Close ✕
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
