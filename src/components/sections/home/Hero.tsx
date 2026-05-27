'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { HERO_COPY } from '@/data/home';

/**
 * Hero
 *
 * Full-viewport (100dvh) opening frame.
 *  - Background: muted, looping `/assets/video/hero.mp4` with a graphite
 *    overlay so headline copy stays readable.
 *  - Foreground: eyebrow → display headline (split on chars + animated
 *    in on mount) → second italic-feel line → subhead → CTA row.
 *  - A 1px mesh-orange scroll cue grows downward beneath the CTAs.
 *
 * Reduced-motion: no GSAP timeline; everything renders at rest with
 * the video still showing (the browser/OS honours reduced-motion for
 * `<video autoplay>` separately).
 */
export default function Hero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('[data-hero-headline] [data-char]');
      const subhead = el.querySelector('[data-hero-subhead]');
      const ctaRow = el.querySelector('[data-hero-ctas]');
      const cue = el.querySelector('[data-hero-cue]');

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      tl.from(chars, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.015,
      })
        .from(
          subhead,
          { y: 12, opacity: 0, duration: 0.6 },
          '-=0.35',
        )
        .from(
          ctaRow,
          { scale: 0.9, opacity: 0, duration: 0.5 },
          '-=0.25',
        )
        .from(
          cue,
          { scaleY: 0, opacity: 0, duration: 0.6, transformOrigin: 'top' },
          '-=0.2',
        );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className="relative -mt-[68px] flex h-[100dvh] w-full items-center justify-center overflow-hidden"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/video/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      {/* Graphite overlay */}
      <div className="absolute inset-0 bg-graphite/35" aria-hidden />

      {/* Foreground */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1140px] flex-col items-center px-6 text-center text-paper">
        <Eyebrow className="text-paper">{HERO_COPY.eyebrow}</Eyebrow>

        <div
          data-hero-headline
          className="mt-8 font-display font-light leading-[1.05]"
        >
          <SplitText
            as="h1"
            className="text-[clamp(64px,12vw,128px)] text-paper"
          >
            {HERO_COPY.headlineLine1}
          </SplitText>
          <SplitText
            as="span"
            className="mt-2 block text-[clamp(40px,7vw,64px)] italic text-paper/70"
          >
            {HERO_COPY.headlineLine2}
          </SplitText>
        </div>

        <p
          data-hero-subhead
          className="mt-8 max-w-xl font-body text-base text-paper/85 md:text-lg"
        >
          {HERO_COPY.subhead}
        </p>

        <div
          data-hero-ctas
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href={HERO_COPY.primaryCta.href}
            data-magnetic
            className="inline-flex items-center justify-center bg-saffron px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
          >
            {HERO_COPY.primaryCta.label}
          </Link>
          <Link
            href={HERO_COPY.secondaryCta.href}
            data-magnetic
            className="inline-flex items-center justify-center border border-paper/70 px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-paper hover:text-graphite"
          >
            {HERO_COPY.secondaryCta.label}
          </Link>
        </div>

        {/* Scroll cue */}
        <div
          data-hero-cue
          className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-paper/70"
        >
          <span
            className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.4em]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            Scroll
          </span>
          <span
            aria-hidden
            className="block h-16 w-px animate-pulse bg-mesh"
          />
        </div>
      </div>
    </section>
  );
}
