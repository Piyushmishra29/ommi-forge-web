'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import SplitText from '@/components/motion/SplitText';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Global 404 — Off the map.
 *
 * Rendered by Next.js for any unmatched route (App Router convention).
 * Full-viewport graphite slab, centered column, a massive saffron-glowing
 * "404" in Manrope (SplitText so each digit can stagger in on mount), a
 * paper headline + subhead, two CTAs, a hairline rule, and a tiny email
 * line. SplitText animation is gated by `useReducedMotion`.
 */
export default function NotFound() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-404] [data-char]'), {
        y: 120,
        opacity: 0,
        duration: 0.95,
        ease: 'power3.out',
        stagger: 0.08,
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    // A <section>, not a <main>: this renders inside the root layout's
    // <main id="main">, and nesting a second main landmark gives the
    // document two mains for assistive tech to choose between.
    // Height is the viewport minus the fixed header the layout already
    // pads for — `100dvh` here made the slab overflow by exactly one
    // header, so every 404 shipped with a dead scrollbar.
    <section
      ref={root}
      aria-labelledby="notfound-heading"
      className="relative flex min-h-[calc(100dvh-var(--header-h))] w-full items-center justify-center overflow-hidden bg-graphite text-paper"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center md:px-10 md:py-32">
        <Eyebrow>OFF THE MAP</Eyebrow>

        {/* The v2 `textShadow: 0 0 48px rgba(255,153,51,.22)` is gone. A
            saffron bloom around saturated warm type on a dark ground is
            precisely the neon look §6.3 rules out — and it is the only
            glow that existed on the site. */}
        <div data-404 className="mt-8">
          <SplitText
            as="span"
            className="block font-display font-bold leading-[0.92] text-saffron"
            charClassName="text-[clamp(120px,20vw,240px)]"
          >
            404
          </SplitText>
        </div>

        <h1 id="notfound-heading" className="type-display-l mt-6 text-balance">
          This page isn&apos;t on our shop floor.
        </h1>

        <p className="type-lede mt-6 max-w-xl text-pretty">
          Let&apos;s get you back to something real.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            data-magnetic
            className="type-eyebrow inline-flex min-h-11 items-center justify-center bg-saffron px-8 py-4 text-graphite transition-colors hover:bg-mesh hover:text-graphite"
          >
            Back to the floor →
          </Link>
          <Link
            href="/renders/"
            data-magnetic
            className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-paper px-8 py-4 text-paper transition-colors hover:bg-paper hover:text-graphite"
          >
            Browse 3D renders →
          </Link>
        </div>

        <span
          aria-hidden
          className="mt-16 inline-block h-px w-12 bg-saffron"
        />
        {/* `paper/60` on graphite measures 5.4:1 by luck rather than by
            design; swarf is the measured dark-ground grey (6.19:1). */}
        <p className="type-small mt-4">
          Wandered off? Email{' '}
          <a
            href="mailto:marketing@ommiforge.com"
            className="text-saffron underline decoration-1 underline-offset-4 transition-colors hover:text-mesh"
          >
            marketing@ommiforge.com
          </a>
        </p>
      </div>
    </section>
  );
}
