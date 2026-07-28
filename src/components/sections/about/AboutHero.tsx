'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { cssImageSet } from '@/lib/image-formats';
import { FOUNDER_QUOTE } from '@/data/about';

/** ≤8 words — preset #9's own limit, and the reason this reads as an h1 and not a paragraph. */
const HEADLINE = 'A forging house built on heritage and metallurgy.';

/**
 * AboutHero — the page opener.
 *
 * `/about` is one of the two routes §4.4 allows the per-character h1 stagger
 * on (preset #9, retuned: flat `y`, no `rotateX`, `expo.out`, stagger
 * 0.015). Restricting it to two pages is what stops it becoming a house
 * tic.
 *
 * Reduced motion renders a DIFFERENT h1 — a plain text node instead of
 * `<SplitText>`'s per-character spans. That is §4.5's specified behaviour
 * and it is also simply better: a heading split into 45 `<span>`s is
 * something a screen reader can be made to announce letter by letter, and
 * the `aria-label` workaround only papers over it.
 *
 * The v2 parallax translated the backdrop by `scrollY * 0.3` on a hand-rolled
 * rAF loop. §4.4 caps parallax at `yPercent` ±8, one direction, so it is now
 * a single scrubbed ScrollTrigger inside the same `gsap.context` as
 * everything else — one ticker, one teardown.
 */
export default function AboutHero() {
  const root = useRef<HTMLElement | null>(null);
  const bg = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const intro = gsap.timeline();
      intro
        .from(el.querySelectorAll('[data-char]'), {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.015,
        })
        .from(
          el.querySelectorAll('[data-rise]'),
          {
            y: 16,
            opacity: 0,
            duration: 0.48,
            ease: 'expo.out',
            stagger: 0.04,
          },
          '-=0.45',
        );

      // §4.4 #13: ±8 yPercent, one direction, scrubbed. `scrub: 0.8` and
      // never `true` — instant tracking is weightless (§4.2).
      if (bg.current) {
        gsap.to(bg.current, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
    >
      {/* Overdrawn on the vertical so the ±8% travel never reveals an edge. */}
      <div
        aria-hidden
        ref={bg}
        className="absolute inset-x-0 top-[-10%] h-[120%] bg-cover bg-center opacity-40"
        style={{ backgroundImage: cssImageSet('/assets/images/DSC09268.jpg') }}
      />
      {/* Legibility scrim. Graphite, so the photograph reads as the same
          material as the page rather than as a window cut into it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-graphite/85 via-graphite/60 to-graphite"
      />

      <div className="page-x relative mx-auto grid w-full max-w-page grid-cols-1 gap-12 pb-[clamp(96px,11vw,144px)] pt-[clamp(96px,11vw,144px)] md:grid-cols-12">
        <div className="md:col-span-8">
          <div data-rise>
            <Eyebrow>Est. 1975 · Bangalore → Malur</Eyebrow>
          </div>

          {/* `display-l`, not `display-xl`: §2.4 reserves the extra-large
              step for the home h1 and nothing else. */}
          <h1 className="type-display-l mt-10 max-w-[15ch] text-balance">
            {reduced ? HEADLINE : <SplitText as="span">{HEADLINE}</SplitText>}
          </h1>
        </div>

        <figure className="self-end md:col-span-4" data-rise>
          <blockquote className="type-display-s text-balance text-snow">
            <span aria-hidden className="text-saffron">
              “
            </span>
            {FOUNDER_QUOTE.body}
            <span aria-hidden className="text-saffron">
              ”
            </span>
          </blockquote>
          {/* swarf, never steel (2.28:1) or cinder (3.03:1) — both fail AA
              for words on graphite. */}
          <figcaption className="type-meta mt-4 uppercase tracking-[0.26em] text-swarf">
            {FOUNDER_QUOTE.attribution}
          </figcaption>
        </figure>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-cinder" />
    </section>
  );
}
