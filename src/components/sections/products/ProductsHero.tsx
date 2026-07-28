'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import { PRODUCTS } from '@/data/products';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Products hero.
 *
 * Editorial top frame for `/products`: eyebrow with a live part count,
 * display headline, subhead lifted from the source site copy, and a "browse
 * all" cue that hands the scroll to Lenis when Lenis is running.
 *
 * **No `SplitText` here.** §4.4 restricts the per-character reveal (GSAP
 * preset #9) to `h1` on `/` and `/about` — one headline treatment on the
 * whole site, so the entrance reads as an event rather than a house style.
 * This page gets the site-wide default instead: preset #4, retuned to the
 * `press` curve at the component band (480ms, `y: 16`).
 *
 * Reduced motion: the timeline is skipped entirely and the section renders
 * at rest. It is not frozen mid-animation — `gsap.from()` would leave the
 * headline at `opacity: 0` if the tween never ran, which is precisely the
 * class of bug the v2 pass found twice.
 */
export default function ProductsHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-fade]'), {
        y: 16,
        opacity: 0,
        duration: 0.48,
        // `press` — expo.out. Anything that *arrives* uses this curve.
        ease: 'expo.out',
        // 40ms per item, §4.2. Four items, so the cap of 8 never bites here.
        stagger: 0.04,
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  const handleBrowseAll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Look up the live gallery anchor position at click time — its offset
    // depends on whatever's above it (sticky header etc.).
    const target = document.getElementById('gallery');
    if (!target) return;
    // If Lenis is running we let the smooth-scroll bridge handle it. The
    // presence of `lenis-smooth` on <html> is the contract from
    // LenisProvider; if it's missing (reduced-motion) we let the native
    // anchor jump happen by NOT calling preventDefault.
    if (!document.documentElement.classList.contains('lenis-smooth')) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY;
    document.dispatchEvent(
      new CustomEvent('lenis:scrollto', {
        detail: { target: top, immediate: false },
      }),
    );
  };

  return (
    <section ref={root} className="section-y-lg relative">
      <div className="mx-auto max-w-page page-x">
        {/* The wrapper, not the <Eyebrow>, carries `data-fade`: `Eyebrow`
            does not spread unknown props, so the v2 `<Eyebrow data-fade>`
            was silently dropped and that item never animated. TypeScript
            does not catch it — hyphenated JSX attributes are exempt from
            prop checking. */}
        <div data-fade>
          <Eyebrow>
            {/* Counted, not typed — the gallery below renders straight from
                PRODUCTS, so a hardcoded 13 goes stale the first time a part
                is added. */}
            Catalogue · {PRODUCTS.length} forged parts
          </Eyebrow>
        </div>

        <h1 data-fade className="type-display-l mt-8 max-w-[16ch]">
          Forged products to meet your expectations.
        </h1>

        <p data-fade className="type-lede mt-10 max-w-[60ch]">
          Through the talents and can-do initiatives of our employees, the
          science of metallurgy and the latest advances in metal forging
          technology — we provide forged products that perform as promised.
        </p>

        <div data-fade className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href="#gallery"
            data-magnetic
            data-cursor-label="Browse"
            onClick={handleBrowseAll}
            // min-h-11 = the 44px minimum target; 12px type on its own gives
            // this scroll cue a ~15px tall hit area.
            className="type-eyebrow group inline-flex min-h-11 items-center gap-3 text-snow transition-colors hover:text-saffron"
          >
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-saffron transition-all duration-500 group-hover:w-16"
            />
            Browse all
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
          <span className="type-meta uppercase tracking-[0.26em]">
            Open any part for the 3D viewer
          </span>
        </div>
      </div>
    </section>
  );
}
