'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';

/**
 * Products hero.
 *
 * Editorial top frame for `/products`:
 *  - Eyebrow with a saffron count chip.
 *  - Display headline split per-char and swept in via GSAP on mount.
 *  - Subhead lifted from the source site copy.
 *  - "Browse all" cue that, on click, fires a `lenis:scrollto` custom
 *    event so the smooth-scroll controller drifts the page to the
 *    featured gallery. Falls back to a same-page `#gallery` anchor when
 *    Lenis is disabled (reduced-motion users) — `<a href>` keeps the
 *    keyboard target legitimate for assistive tech either way.
 *
 * Reduced-motion: GSAP timeline is skipped so the headline renders at
 * rest. The scroll cue still works (browser handles native scroll on
 * the anchor jump).
 */
export default function ProductsHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('[data-products-headline] [data-char]');
      const fades = el.querySelectorAll('[data-fade]');

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(chars, {
        yPercent: 110,
        opacity: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.012,
      }).from(
        fades,
        {
          y: 24,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
        },
        '-=0.6',
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  const handleBrowseAll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Look up the live gallery anchor position at click time — its
    // offset depends on whatever's above it (sticky header etc.).
    const target = document.getElementById('gallery');
    if (!target) return;
    // If Lenis is running we let the smooth-scroll bridge handle it.
    // The presence of `lenis-smooth` on <html> is the contract from
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
    <section
      ref={root}
      className="relative bg-paper pt-32 pb-16 md:pt-44 md:pb-24"
    >
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow data-fade>
          <span className="text-mesh">Catalogue · 13 forged parts</span>
        </Eyebrow>

        <h1
          data-products-headline
          className="mt-8 font-display font-light leading-[0.98] text-graphite"
          style={{ fontSize: 'clamp(56px, 9vw, 110px)' }}
        >
          <SplitText as="span">{`Forged products to meet your expectations.`}</SplitText>
        </h1>

        <p
          data-fade
          className="mt-10 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]"
        >
          Through the talents and can-do initiatives of our employees, the
          science of metallurgy and the latest advances in metal forging
          technology — we provide forged products that perform as promised.
        </p>

        <div
          data-fade
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
        >
          <a
            href="#gallery"
            data-magnetic
            data-cursor-label="Browse"
            onClick={handleBrowseAll}
            className="group inline-flex items-center gap-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:text-mesh"
          >
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-saffron transition-all duration-500 group-hover:w-16 group-hover:bg-mesh"
            />
            Browse all
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </a>
          <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.32em] text-steel">
            Tap any part for the 3D viewer
          </span>
        </div>
      </div>
    </section>
  );
}
