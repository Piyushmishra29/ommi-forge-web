'use client';

import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  type Variants,
} from 'framer-motion';
import { PRODUCTS, type ProductItem } from '@/data/products';
// Single source of truth for lazy-loaded three components — keeps
// three.js in one shared async chunk instead of duplicating it per route.
import { StlPreview, StlViewer } from '@/components/three/lazy';

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

export default function ProductsGallery() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = PRODUCTS.find((p) => p.slug === activeSlug) ?? null;

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
    <section className="bg-paper pb-32 md:pb-40">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
          {PRODUCTS.map((p) => (
            <motion.button
              key={p.slug}
              type="button"
              layoutId={`card-${p.slug}`}
              data-magnetic
              onClick={() => setActiveSlug(p.slug)}
              className="group relative block w-full overflow-hidden bg-render-bg text-left focus:outline-none"
            >
              <div className={aspectClass[p.aspect]}>
                {p.kind === 'stl' ? (
                  <StlPreview
                    src={p.stl}
                    ariaLabel={`${p.name} 3D preview`}
                    className="h-full w-full"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.src}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Hover label */}
              <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-4 bg-gradient-to-t from-graphite/85 via-graphite/40 to-transparent p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <div>
                  <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-mesh">
                    {p.code}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-light text-paper md:text-2xl">
                    {p.name}
                  </h3>
                </div>
                <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper">
                  View →
                </span>
              </div>

              {/* Always-on caption strip (for touch/no-hover) */}
              <div className="bg-paper p-4 md:hidden">
                <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-mesh">
                  {p.code}
                </p>
                <h3 className="mt-1 font-display text-lg font-light text-graphite">
                  {p.name}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Overlay */}
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.src}
                    alt={active.name}
                    className="h-full w-full object-cover"
                  />
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
    </section>
  );
}
