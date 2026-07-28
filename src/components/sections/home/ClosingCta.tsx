'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import {
  MODELS,
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useScrollProgress,
} from '@/components/three3';
import { CLOSING_CTA } from '@/data/home';

/**
 * Beat 9 — the closing.
 *
 * The page opened on this part cold and unfinished; it closes on the same
 * part machined, oiled and cold again. That bookend is the concept, so the
 * part gets equal billing with the copy rather than sitting behind it.
 *
 * v2 made this a full-bleed saffron slab. On the dark ground that is a
 * fully-saturated colour used as a *fill*, which §6 rule 3 rules out — and
 * it would fight the one thing this beat exists to show. Saffron stays where
 * it belongs: on the button, and on the rim light hitting the steel.
 */

const ShippedScene = dynamicScene(() => import('./ShippedScene'));

const SHIPPED_DESCRIPTION =
  'The forged sprocket from the top of the page, turning slowly. Its faces ' +
  'are machined bright and it carries the faint sheen of the rust-preventive ' +
  'film parts ship under. There is no heat in it.';

export default function ClosingCta() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const progress = useScrollProgress(stage, {
    start: 'top bottom',
    end: 'bottom top',
  });

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Preset #9 retuned to §4.1: flat travel, `press`, no overshoot. Only
      // ever applied to a heading, never to a paragraph.
      gsap.from(el.querySelectorAll('[data-cta-headline] [data-char]'), {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.015,
        scrollTrigger: { trigger: el, start: 'top 70%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative w-full section-y-lg">
      <div className="mx-auto grid max-w-page items-center gap-12 page-x lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow>ONE HEAT LATER</Eyebrow>
          <div data-cta-headline className="mt-8">
            <h2 className="type-display-l">
              <SplitText as="span">{CLOSING_CTA.headline}</SplitText>
            </h2>
          </div>
          <p className="type-lede mt-6 max-w-[46ch]">{CLOSING_CTA.subhead}</p>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            <Link
              href={CLOSING_CTA.primary.href}
              data-magnetic
              className="inline-flex min-h-11 items-center justify-center bg-saffron px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
            >
              {CLOSING_CTA.primary.label}
            </Link>
            <Link
              href={CLOSING_CTA.secondary.href}
              data-magnetic
              className="inline-flex min-h-11 items-center justify-center border border-cinder px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-paper transition-colors hover:border-saffron hover:text-saffron"
            >
              {CLOSING_CTA.secondary.label}
            </Link>
          </div>
        </div>

        {/* 7/5, never 6/6 — an even split reads as a template (§2.5). */}
        <div
          ref={stage}
          className="relative aspect-square w-full lg:col-span-5"
        >
          <SceneSlot
            accessibleName="The forged sprocket from the opening, machined and cold"
            description={SHIPPED_DESCRIPTION}
            index={3}
            // Sized, not positioned — see the note in ProductsMarquee: the
            // slot forces `position: relative` on itself and wins.
            className="h-full w-full"
            onApproach={() => {
              // Already in cache from the act — this is here for the visitor
              // who deep-links past it, e.g. via the skip link or a hash.
              preloadModel(MODELS.g.url, MODEL_PRIORITY.approaching);
            }}
            fallback={
              // The poster is rendered from the machined state, which is
              // exactly what this beat shows — so the still and the canvas
              // are the same picture (§3.6) and this is real content in the
              // exported HTML rather than an empty box.
              <figure className="absolute inset-0 m-0 flex items-center justify-center">
                <picture>
                  <source
                    srcSet="/assets/posters/part-g.avif"
                    type="image/avif"
                  />
                  <img
                    src="/assets/posters/part-g.webp"
                    alt="The Forged Sprocket, machined bright and cold."
                    width={1000}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    className="w-[86%] max-w-[420px]"
                  />
                </picture>
                <figcaption className="sr-only">{SHIPPED_DESCRIPTION}</figcaption>
              </figure>
            }
          >
            <ShippedScene progress={progress} />
          </SceneSlot>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, transparent 50%, #1F2124CC 100%)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
