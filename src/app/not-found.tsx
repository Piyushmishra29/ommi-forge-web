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
    <main
      ref={root}
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-graphite text-paper"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center md:px-10 md:py-32">
        <Eyebrow className="text-paper">OFF THE MAP</Eyebrow>

        <div
          data-404
          className="mt-8"
          style={{ textShadow: '0 0 48px rgba(255, 153, 51, 0.22)' }}
        >
          <SplitText
            as="span"
            className="block font-display font-bold leading-[0.92] text-mesh"
            charClassName="text-[clamp(120px,20vw,240px)]"
          >
            404
          </SplitText>
        </div>

        <h1
          className="mt-6 font-display font-light leading-[1.05] text-paper"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
        >
          This page isn&apos;t on our shop floor.
        </h1>

        <p className="mt-6 max-w-xl font-body text-base text-paper/70 md:text-lg">
          Let&apos;s get you back to something real.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            data-magnetic
            className="inline-flex items-center justify-center bg-saffron px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-paper hover:text-graphite"
          >
            Back to the floor →
          </Link>
          <Link
            href="/renders/"
            data-magnetic
            className="inline-flex items-center justify-center border border-paper px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-paper hover:text-graphite"
          >
            Browse 3D renders →
          </Link>
        </div>

        <span
          aria-hidden
          className="mt-16 inline-block h-px w-12 bg-saffron"
        />
        <p className="mt-4 font-body text-sm text-paper/60">
          Wandered off? Email{' '}
          <a
            href="mailto:marketing@ommiforge.com"
            className="text-paper underline decoration-saffron decoration-2 underline-offset-4 transition-colors hover:text-saffron"
          >
            marketing@ommiforge.com
          </a>
        </p>
      </div>

    </main>
  );
}
