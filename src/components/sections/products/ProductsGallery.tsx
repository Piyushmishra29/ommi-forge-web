'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  APPLICATION_LABEL,
  PRODUCTS,
  productApplications,
  productCategory,
  type ProductApplication,
  type ProductItem,
} from '@/data/products';
// The overlay is the page's ONE 3D moment: one viewer, one context, on
// demand. Lazy so three.js never lands in this route's first-paint chunk.
import { StlViewer } from '@/components/three/lazy';
import PartPoster from '@/components/three/PartPoster';
import { withExt } from '@/lib/image-formats';
import { cn } from '@/lib/cn';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Explicit pixel dimensions per aspect — keep these in lockstep with
 * `aspectClass` so `<img width/height>` always declares a box matching the
 * rendered aspect ratio. Concrete numbers prevent CLS while the lazy-loaded
 * JPGs decode. (Poster tiles get theirs from `PartPoster`.)
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

/**
 * Close glyph — Lucide `x` geometry, inlined rather than pulled from an icon
 * package because this is the only icon on the route. Decorative: the
 * button's own text label ("Close") is the accessible name.
 */
function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-3.5 w-3.5"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section header                                                            */
/* -------------------------------------------------------------------------- */

interface SectionHeaderProps {
  /**
   * Id for the `<h2>`. Required — each band's `<section>` points its
   * `aria-labelledby` at this, so a missing id silently leaves the landmark
   * unnamed.
   */
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
}

function SectionHeader({ id, eyebrow, title, intro }: SectionHeaderProps) {
  return (
    <header className="max-w-[46ch]">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="type-display-l mt-6">
        {title}
      </h2>
      {intro ? <p className="type-lede mt-5">{intro}</p> : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tile primitives                                                           */
/* -------------------------------------------------------------------------- */

interface TileProps {
  item: ProductItem;
  onOpen: (slug: string) => void;
  /** Featured tiles use a heavier label + a taller desktop box. */
  featured?: boolean;
}

/**
 * A catalogue tile.
 *
 * **No canvas.** §5.3 is explicit that a grid of `<Canvas>` tiles is N WebGL
 * contexts and is the exact regression this project already shipped once, so
 * every `kind: 'stl'` item renders its offline poster instead — the same
 * still, from the same rig, at 3–8 KB. The live 3D on this page is the one
 * viewer that mounts when a tile is opened.
 */
function ProductTile({ item, onOpen, featured = false }: TileProps) {
  return (
    <motion.button
      type="button"
      layoutId={`card-${item.slug}`}
      data-magnetic
      onClick={() => onOpen(item.slug)}
      // Explicit name. Without it the button's accessible name is the
      // concatenation of everything inside it — code, name, the "View →"
      // arrow and (on mobile) the duplicate caption strip, which announces
      // the part name twice and never says what the button does.
      aria-label={`${item.name}, part ${item.code} — open detail`}
      // No local focus ring. This used to override the global one with
      // `focus:outline-none` + a saffron-only `ring-2`, which is the weakest
      // possible indicator here: tiles sit on the dark render stage and on
      // photography, where saffron alone measures ~2.2:1. The global two-tone
      // graphite+saffron ring in globals.css carries the 3:1 floor on every
      // surface in the palette — let it through.
      className="group relative block w-full overflow-hidden bg-graphite text-left"
    >
      <div
        className={cn(
          'overflow-hidden',
          featured ? 'aspect-[4/5] md:aspect-auto md:h-[36vh]' : aspectClass[item.aspect],
        )}
      >
        {/* §5.3's one permitted hover on this page: scale to 1.02 on the
            `mass` curve at the micro band. No tilt, no parallax, no
            magnetic 3D card (§6.15). */}
        <div className="h-full w-full transition-transform duration-200 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:scale-[1.02]">
          {item.kind === 'stl' ? (
            // `contain`, not `cover`: these boxes are 3:4, 4:3 and 1:1, and
            // cropping a square master into the first two eats the framing
            // margin the render leaves. On a graphite tile over a graphite
            // render there is no visible letterbox either way — the only
            // difference is whether the part gets clipped.
            //
            // alt is empty: the caption below and the button's own
            // aria-label already name the part.
            <PartPoster model={item.model} fit="contain" />
          ) : (
            <picture>
              <source srcSet={withExt(item.src, 'avif')} type="image/avif" />
              <source srcSet={withExt(item.src, 'webp')} type="image/webp" />
              {/* The blurb, not the name: both image-kind items are plant
                  photographs ("Power Hammer Bay", "Heat Treatment") whose
                  names describe the subject, not the picture. The blurb
                  describes what is actually in frame. */}
              <img
                src={item.src}
                alt={item.blurb}
                width={aspectSize[item.aspect].w}
                height={aspectSize[item.aspect].h}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </picture>
          )}
        </div>
      </div>

      {featured ? (
        <>
          {/* Top strip — always visible on featured, so the band reads with
              rhythm even at rest. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 md:p-6">
            <p className="type-eyebrow">Featured</p>
            <span
              aria-hidden
              className="h-px w-10 translate-y-2 bg-saffron transition-all duration-500 group-hover:w-16"
            />
          </div>
          {/* Bottom slab with the full label, slides up on hover. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-4 bg-gradient-to-t from-graphite via-graphite/70 to-transparent p-6 transition-transform duration-500 group-hover:translate-y-0 md:p-8">
            <div>
              <p className="type-eyebrow">{item.code}</p>
              {/* <p>, not <h3>: every label in this tile lives inside the
                  <button>, whose content model is phrasing only. A heading
                  nested in a button is invalid and isn't exposed as a
                  heading by screen readers anyway — the band's <h2> is the
                  real landmark. */}
              <p className="type-display-m mt-2">{item.name}</p>
            </div>
            <span className="type-eyebrow text-snow">View →</span>
          </div>
        </>
      ) : (
        // Revealed on focus as well as hover, so a keyboard user tabbing the
        // grid sees the same label a mouse user does.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-4 bg-gradient-to-t from-graphite via-graphite/70 to-transparent p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <div>
            <p className="type-eyebrow">{item.code}</p>
            <p className="type-display-s mt-1">{item.name}</p>
          </div>
          <span className="type-eyebrow text-snow">View →</span>
        </div>
      )}

      {/* Always-on caption strip — touch / no-hover. Skipped for featured,
          whose bottom slab is already visible. */}
      {!featured ? (
        <div className="bg-slag p-4 md:hidden">
          <p className="type-eyebrow">{item.code}</p>
          <p className="type-display-s mt-1">{item.name}</p>
        </div>
      ) : null}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gallery (owns modal state + renders three bands)                          */
/* -------------------------------------------------------------------------- */

/**
 * ProductsGallery
 *
 * Three editorial bands: featured 3-up, the catalogue masonry, and a
 * by-application index. The modal overlay is shared across all three —
 * `layoutId` lives on each card regardless of which band it sits in, so the
 * open interaction works uniformly.
 *
 * The overlay is the page's only WebGL context, mounted on demand and
 * unmounted on close.
 */
export default function ProductsGallery() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = PRODUCTS.find((p) => p.slug === activeSlug) ?? null;

  // Pre-bucket items once. Memoising means the by-application groups don't
  // re-allocate on every modal open/close.
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

  // Close on Escape + lock scroll + focus-trap inside the modal.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // `overflow: hidden` on <body> does NOT stop Lenis — it drives the
    // scroll position itself, so the page keeps gliding behind the overlay.
    // Same contract the mobile nav uses: pause the instance, which also
    // applies `.lenis-stopped { overflow: clip }` to <html>.
    const setLenisPaused = (paused: boolean) => {
      document.dispatchEvent(
        new CustomEvent('lenis:setpaused', { detail: { paused } }),
      );
    };
    setLenisPaused(true);

    // Save the element that opened the modal so focus can return to it.
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move focus into the dialog on the next frame (the layout animation
    // needs the node to exist first).
    const focusFrame = requestAnimationFrame(() => {
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      focusable[0]?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSlug(null);
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      setLenisPaused(false);
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(focusFrame);
      // Restore focus to whatever opened the modal.
      lastFocusedRef.current?.focus({ preventScroll: true });
    };
  }, [active]);

  return (
    <>
      {/* ----- Featured band ------------------------------------------------ */}
      <section id="gallery" aria-labelledby="featured-heading" className="section-y-sm">
        <div className="mx-auto max-w-page page-x">
          <SectionHeader
            id="featured-heading"
            eyebrow="Featured · Three hero parts"
            title="The parts our customers ask for most."
            intro="Walk a metallurgist through these and you'll cover the bulk of what leaves Malur — heavy-duty trunnions, drive sprockets and near-net cylinder heads."
          />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px bg-cinder/40 md:mt-16 md:grid-cols-3">
          {featured.map((p) => (
            <div key={p.slug} id={`product-${p.slug}`}>
              <ProductTile item={p} onOpen={setActiveSlug} featured />
            </div>
          ))}
        </div>
      </section>

      {/* ----- Catalogue masonry ------------------------------------------- */}
      <section aria-labelledby="catalogue-heading" className="section-y">
        <div className="mx-auto max-w-page page-x">
          <SectionHeader
            id="catalogue-heading"
            eyebrow="Full catalogue"
            title="Every named part we forge."
            intro="Levers, links, valve bodies and process photography — open any tile for the full 3D viewer."
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
        className="section-y-sm border-t border-cinder"
      >
        <div className="mx-auto max-w-page page-x">
          <SectionHeader
            id="by-application-heading"
            eyebrow="By application"
            title="What industry are you serving?"
            intro="Same parts, grouped by the industries they typically land in."
          />

          <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
            {byApplication.map((group) => (
              <div key={group.key} className="border-t border-cinder pt-6">
                <div className="flex items-baseline justify-between">
                  <p className="type-eyebrow text-snow">{group.label}</p>
                  <span className="type-spec text-swarf">
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
                        aria-label={`${p.name}, part ${p.code} — open detail`}
                        // min-h-11 = 44px. At 11px type these chips were
                        // ~29px tall and sat in a wrapped grid, which is
                        // exactly the case the minimum target size exists
                        // for.
                        className="type-meta group inline-flex min-h-11 items-center gap-2 border border-cinder px-3 py-2 uppercase tracking-[0.16em] text-snow transition-colors hover:border-saffron hover:text-saffron"
                      >
                        <span>{p.name}</span>
                        <span aria-hidden className="text-swarf transition-colors group-hover:text-saffron">
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
            // Scrolls internally: on a phone the square render plus the spec
            // column is taller than the viewport, and the panel used to be
            // centre-cropped with the CTA unreachable. `data-lenis-prevent`
            // keeps that wheel/touch scroll on the overlay instead of leaking
            // to the (paused) page beneath.
            data-lenis-prevent
            className="fixed inset-0 z-[1100] overflow-y-auto overscroll-contain bg-graphite/85 p-4 backdrop-blur-sm md:p-10"
            onClick={() => setActiveSlug(null)}
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                ref={dialogRef}
                layoutId={`card-${active.slug}`}
                onClick={(e) => e.stopPropagation()}
                // role/aria live on the PANEL, not the backdrop — the
                // backdrop is the click-away target and isn't part of the
                // dialog. Labelled by the heading it actually renders.
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-dialog-title"
                className="relative grid w-full max-w-5xl grid-cols-1 border border-cinder bg-slag md:grid-cols-12"
              >
                <div className="relative aspect-square w-full bg-graphite md:col-span-7 md:aspect-auto md:min-h-[560px]">
                  {active.kind === 'stl' ? (
                    <>
                      {/* The still goes in first and the viewer sits on top
                          with a transparent ground until the GLB lands, so
                          the panel is never an empty rectangle and the
                          canvas replaces the image with the same picture. */}
                      <div className="absolute inset-0">
                        <PartPoster
                          model={active.model}
                          alt={`${active.name} — render of the forged part`}
                          fit="contain"
                        />
                      </div>
                      <div className="absolute inset-0">
                        <StlViewer
                          src={active.model}
                          title={active.name}
                          productName={active.code}
                          description={active.blurb}
                          autoRotate={false}
                        />
                      </div>
                    </>
                  ) : (
                    <picture>
                      <source srcSet={withExt(active.src, 'avif')} type="image/avif" />
                      <source srcSet={withExt(active.src, 'webp')} type="image/webp" />
                      {/* Identification only here — unlike the tile, the
                          blurb is rendered as visible copy beside this
                          image, so repeating it in `alt` would just make a
                          screen reader say it twice. */}
                              <img
                        src={active.src}
                        alt={`${active.name}, part ${active.code}`}
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
                    <Eyebrow>Catalogue · {active.code}</Eyebrow>
                    <h2 id="product-dialog-title" className="type-display-m mt-4">
                      {active.name}
                    </h2>
                    <p className="type-body mt-6">{active.blurb}</p>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {productApplications(active).map((app) => (
                        <li
                          key={app}
                          className="type-meta border border-cinder px-2.5 py-1 uppercase tracking-[0.16em] text-snow"
                        >
                          {APPLICATION_LABEL[app]}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* min-h-11 = the 44px minimum touch target; 12px type
                      with py-3 lands at ~39px on its own. */}
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <a
                      href="/contact/"
                      data-magnetic
                      className="type-eyebrow inline-flex min-h-11 items-center justify-center bg-saffron px-6 py-3 text-graphite transition-colors hover:bg-mesh hover:text-paper"
                    >
                      Request a Quote
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveSlug(null)}
                      data-magnetic
                      className="type-eyebrow inline-flex min-h-11 items-center justify-center gap-2 px-2 text-swarf transition-colors hover:text-snow"
                    >
                      Close
                      <CloseIcon />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
