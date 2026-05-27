'use client';

import Link from 'next/link';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import { gsap } from '@/lib/gsap';
import { VALUES } from '@/data/about';
import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------------- */
/*  Reduced-motion (no setState-in-effect)                                    */
/* -------------------------------------------------------------------------- */
function subscribeRM(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getRMSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function getRMServer() {
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Static fallback                                                           */
/* -------------------------------------------------------------------------- */
const ACCENTS = [
  { bg: 'bg-graphite', text: 'text-paper', num: 'text-mesh' },
  { bg: 'bg-mesh', text: 'text-graphite', num: 'text-graphite' },
  { bg: 'bg-saffron', text: 'text-graphite', num: 'text-graphite' },
] as const;

function StaticValues() {
  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <div className="mb-16 max-w-2xl md:mb-24">
          <p className="mb-6 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span
              aria-hidden
              className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
            />
            How we work
          </p>
          <h2 className="font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
            Three values. Non-negotiable.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {VALUES.map((v, i) => {
            const a = ACCENTS[i % ACCENTS.length];
            return (
              <article
                key={v.number}
                className={`${a.bg} ${a.text} relative flex min-h-[420px] flex-col justify-between p-8 md:p-10`}
              >
                <span
                  className={`${a.num} font-display text-6xl font-light md:text-7xl`}
                >
                  {v.number}
                </span>
                <div>
                  <h3 className="mb-4 font-display text-2xl font-light leading-tight md:text-3xl">
                    {v.title}
                  </h3>
                  <p className="font-body text-base leading-relaxed opacity-90 md:text-lg">
                    {v.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center md:mt-24">
          <Link
            href="/contact/"
            data-magnetic
            className="inline-flex items-center justify-center bg-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-saffron hover:text-graphite"
          >
            Start a project with us →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pinned horizontal sequence                                                */
/* -------------------------------------------------------------------------- */

/**
 * ValueTrack
 *
 * One horizontal flex track holding three full-bleed value slides.
 * The track translates left by `progress * (1 - 1/N) * 100vw`, so
 * slide 1 → slide 2 → slide 3 snap in as the section scrubs through
 * its 3× viewport-height pin.
 *
 * Uses `gsap.quickSetter` so the scroll-hot path never reconciles
 * React. The active-index highlight rides a separate render that
 * reads `progress` via `useScroll()` (necessary for the chip rail
 * accents to update).
 */
function ValueTrack() {
  const { progress } = useScroll();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const quickSetterRef = useRef<ReturnType<typeof gsap.quickSetter> | null>(
    null,
  );

  useEffect(() => {
    if (!trackRef.current) return;
    quickSetterRef.current = gsap.quickSetter(trackRef.current, 'x', 'vw');
    return () => {
      quickSetterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const setter = quickSetterRef.current;
    if (!setter) return;
    // Three slides at 100vw each = 300vw total → translate by 200vw.
    const total = VALUES.length;
    const distance = -(total - 1) * 100;
    setter(distance * progress);
  }, [progress]);

  const activeIndex = Math.min(
    VALUES.length - 1,
    Math.max(0, Math.floor(progress * VALUES.length)),
  );

  return (
    <div className="relative h-full w-full bg-graphite text-paper">
      {/* Header strip — eyebrow + step rail. Stays in place over the
          translating slides. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-12 md:px-10 md:pt-16">
        <div className="mx-auto flex max-w-[var(--container-page)] items-end justify-between">
          <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span
              aria-hidden
              className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
            />
            How we work
          </p>
          <ol className="hidden items-center gap-3 md:flex">
            {VALUES.map((v, i) => (
              <li
                key={v.number}
                className={cn(
                  'flex items-center gap-2 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-500',
                  i === activeIndex ? 'text-paper' : 'text-paper/30',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'block h-px transition-all duration-500',
                    i === activeIndex
                      ? 'w-10 bg-saffron'
                      : 'w-6 bg-paper/20',
                  )}
                />
                {v.number}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Slide track */}
      <div
        ref={trackRef}
        className="flex h-full"
        style={{ willChange: 'transform' }}
      >
        {VALUES.map((v, i) => (
          <article
            key={v.number}
            className="relative flex h-full w-screen shrink-0 items-center"
          >
            <div className="mx-auto grid w-full max-w-[var(--container-page)] grid-cols-1 items-center gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
              <div className="md:col-span-5">
                {/* Mesh-orange numeral. clamp so it scales with viewport. */}
                <span
                  aria-hidden
                  className="block font-display font-light leading-none text-mesh"
                  style={{ fontSize: 'clamp(140px, 22vw, 320px)' }}
                >
                  {v.number}
                </span>
              </div>
              <div className="md:col-span-7 md:pl-4">
                <h3
                  className="font-display font-light leading-[1.05] text-paper"
                  style={{ fontSize: 'clamp(40px, 6.5vw, 84px)' }}
                >
                  {v.title}
                </h3>
                <p className="mt-8 max-w-xl font-body text-lg leading-relaxed text-paper/80 md:text-xl md:leading-[1.6]">
                  {v.body}
                </p>
                <p className="mt-10 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-paper/70">
                  Value {String(i + 1).padStart(2, '0')} of{' '}
                  {String(VALUES.length).padStart(2, '0')}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Hairline at top + bottom for an editorial frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-paper/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-paper/10"
      />
    </div>
  );
}

/**
 * Values3Up
 *
 * Three values delivered as a horizontal-scroll pinned sequence.
 * Mesh-orange numerals (01/02/03) at clamp(140px, 22vw, 320px),
 * Manrope display headlines, Work Sans body — same triptych content,
 * cinematic delivery.
 *
 * Below the pin, a separate magnetic CTA invites the next click.
 */
export default function Values3Up() {
  const reduced = useSyncExternalStore(
    subscribeRM,
    getRMSnapshot,
    getRMServer,
  );

  if (reduced) return <StaticValues />;

  return (
    <>
      <PinnedSection length={3} className="bg-graphite">
        <ValueTrack />
      </PinnedSection>

      <div className="bg-graphite pb-24 pt-4 md:pb-32">
        <div className="mx-auto flex max-w-[var(--container-page)] justify-center px-6 md:px-10">
          <Link
            href="/contact/"
            data-magnetic
            className="inline-flex items-center justify-center border border-mesh bg-transparent px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-mesh transition-colors hover:bg-saffron hover:text-graphite hover:border-saffron"
          >
            Start a project with us →
          </Link>
        </div>
      </div>
    </>
  );
}
