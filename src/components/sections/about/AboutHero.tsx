'use client';

import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { FOUNDER_QUOTE } from '@/data/about';

/**
 * Full-viewport hero for `/about`.
 *
 * Background: DSC09268.jpg (foundry interior). If the asset is missing
 * (still downloading) the layered graphite background reads cleanly on
 * its own.
 *
 * Left column: eyebrow + SplitText headline animating in on mount.
 * Right column: founder quote — sits low on the y-axis for a settled
 * editorial composition.
 */
export default function AboutHero() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) return;

    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-char]'), {
        yPercent: 110,
        opacity: 0,
        stagger: 0.012,
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.15,
      });
      gsap.from(el.querySelectorAll('[data-fade]'), {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.55,
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-graphite text-paper"
    >
      {/* Background image — graceful if missing */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url(/assets/images/DSC09268.jpg)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-graphite/95 via-graphite/60 to-graphite/95"
      />

      <div className="relative mx-auto grid w-full max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 pb-24 pt-40 md:grid-cols-12 md:px-10 md:pb-32 md:pt-48">
        <div className="md:col-span-8">
          <Eyebrow className="text-paper" data-fade>
            <span className="text-mesh">Who we are</span>
          </Eyebrow>
          <h1 className="mt-8 max-w-4xl font-display text-4xl font-light leading-[1.05] text-paper md:text-6xl lg:text-7xl">
            <SplitText as="span">
              {`A forging house built on heritage and metallurgy.`}
            </SplitText>
          </h1>
        </div>

        <div
          className="self-end md:col-span-4 md:pl-6"
          data-fade
        >
          <p className="font-display text-xl font-light leading-snug text-paper md:text-2xl">
            <span className="text-mesh">“</span>
            {FOUNDER_QUOTE.body}
            <span className="text-mesh">”</span>
          </p>
          <p className="mt-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-ash">
            {FOUNDER_QUOTE.attribution}
          </p>
        </div>
      </div>

      {/* Bottom edge hairline */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-paper/10" />
    </section>
  );
}
