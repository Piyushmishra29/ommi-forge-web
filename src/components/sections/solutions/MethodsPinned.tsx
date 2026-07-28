'use client';

import Link from 'next/link';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import MethodIllustration from './MethodIllustration';
import { StlPreview } from '@/components/three/lazy';
import { FORGING_METHODS, type ForgingMethod } from '@/data/solutions';
import { getRenderBySlug } from '@/data/renders';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/cn';

/**
 * MethodsPinned
 *
 * A single PinnedSection that holds 4× scroll length. The left half is
 * a sticky animated illustration that crossfades between four states
 * based on scroll progress. The right half holds four stacked text
 * blocks plus a small `<StlPreview>` of a representative part from
 * `RENDERS`; the active one is highlighted based on the same progress.
 *
 * Reduced-motion renders a DIFFERENT TREE (`<MethodsStatic>`), not the
 * same tree with the animation switched off. `<PinnedSection>` already
 * skips the pin when reduced motion is set — but its shell is
 * `h-screen overflow-hidden`, and the crossfade below keys off a scroll
 * progress that then never leaves 0. The result was that methods 02–04
 * sat at `opacity-0`, `aria-hidden`, clipped out of a viewport-height
 * box: three quarters of the page's content silently unreachable. The
 * static path drops the pin wrapper and stacks all four as ordinary
 * page content.
 */
export default function MethodsPinned() {
  const reduced = useReducedMotion();
  if (reduced) return <MethodsStatic />;

  return (
    <PinnedSection length={3} className="bg-graphite text-paper">
      <Inner />
    </PinnedSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared method content                                                     */
/* -------------------------------------------------------------------------- */

/** Big saffron-mesh step number plus an "of 04" counter. */
function MethodCounter({ number }: { number: string }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="font-display text-4xl font-light text-mesh md:text-5xl">
        {number}
      </span>
      <span className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-paper/60">
        of {String(FORGING_METHODS.length).padStart(2, '0')}
      </span>
    </div>
  );
}

/**
 * Title, spec, copy, CTA and the sample-part preview for one method.
 * Identical in both the pinned crossfade and the static fallback, so it
 * lives here rather than being duplicated between the two layouts.
 */
function MethodBody({ method }: { method: ForgingMethod }) {
  const sample = getRenderBySlug(method.sampleSlug);
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-12 sm:gap-10">
      <div className="sm:col-span-8">
        <h2 className="font-display text-3xl font-light leading-tight text-paper md:text-5xl">
          {method.title}
        </h2>
        <p className="mt-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
          {method.spec}
        </p>
        <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-paper/80 md:text-lg md:leading-[1.7]">
          {method.body}
        </p>
        <div className="mt-8">
          <Link
            href="/contact/"
            data-magnetic
            // min-h-11 = 44px, the minimum touch target; the 12px
            // vertical padding on 12px type lands short of it on its own.
            className="inline-flex min-h-11 items-center justify-center border border-mesh px-6 py-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-mesh transition-colors hover:bg-mesh hover:text-graphite"
          >
            {`Discuss a ${method.shortLabel} project →`}
          </Link>
        </div>
      </div>

      {/* Sample part — live STL preview of an actual forged piece from
          the RENDERS catalogue. */}
      {sample && (
        <div className="sm:col-span-4">
          <div className="aspect-square w-full overflow-hidden border border-paper/10 bg-paper/[0.02]">
            <StlPreview
              src={sample.model}
              ariaLabel={`${method.sampleName} — sample ${method.shortLabel} forging`}
              className="h-full w-full"
            />
          </div>
          <p className="mt-3 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper/60">
            Sample part
          </p>
          <p className="mt-1 font-display text-lg font-light text-paper">
            {method.sampleName}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pinned layout (default)                                                   */
/* -------------------------------------------------------------------------- */

function Inner() {
  // Intentionally uses the legacy `useScroll()` hook (React state via
  // `useSyncExternalStore`) rather than the ref-backed
  // `useScrollSubscribe`. The four method panels are React-rendered
  // crossfades — `activeIndex` controls `inert`, opacity, and
  // translate classes on each `<article>`, plus the step rail. All of
  // that NEEDS reconciliation. Moving this off React state would mean
  // hand-rolling DOM mutation on a dozen sibling nodes, which is not
  // worth it given the panels only flip 4 times across the whole pin.
  const { progress } = useScroll();
  const activeIndex = Math.min(
    FORGING_METHODS.length - 1,
    Math.floor(progress * FORGING_METHODS.length),
  );

  return (
    <div className="relative h-full w-full">
      <div className="mx-auto grid h-full max-w-page grid-cols-1 items-center gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
        {/* Sticky illustration column */}
        <div className="hidden md:col-span-5 md:flex md:h-full md:items-center">
          <MethodIllustration progress={progress} />
        </div>

        {/* Text + sample column */}
        <div className="md:col-span-7">
          {/* Mobile: illustration sits inline at the top */}
          <div className="mb-8 md:hidden">
            <MethodIllustration progress={progress} className="mx-auto" />
          </div>

          <MethodCounter number={FORGING_METHODS[activeIndex]?.number ?? '01'} />

          <div className="relative min-h-[420px] md:min-h-[460px]">
            {FORGING_METHODS.map((m, i) => (
              <article
                key={m.number}
                // `inert` (not just pointer-events-none) — the inactive
                // panels each hold a "Discuss a … project" link, and
                // pointer-events don't stop Tab. Without this, keyboard
                // users tabbed into three fully transparent panels.
                inert={i !== activeIndex}
                aria-hidden={i !== activeIndex}
                className={cn(
                  'transition-all duration-500',
                  i === activeIndex
                    ? 'relative translate-y-0 opacity-100'
                    : 'absolute inset-0 translate-y-3 opacity-0',
                )}
              >
                <MethodBody method={m} />
              </article>
            ))}
          </div>

          {/* Step rail */}
          <ol className="mt-12 flex gap-4">
            {FORGING_METHODS.map((m, i) => (
              <li
                key={m.number}
                className="flex flex-1 flex-col gap-2"
                // 'step' rather than a boolean: aria-current takes a
                // token, and "step" is what this rail actually marks.
                aria-current={i === activeIndex ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'h-px w-full transition-colors duration-500',
                    i <= activeIndex ? 'bg-mesh' : 'bg-paper/15',
                  )}
                />
                <span
                  className={cn(
                    'font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors',
                    // /60 not /40: at 10px these are the only place the
                    // other three method names appear while pinned, and
                    // paper/40 on graphite is 3.6:1 — under AA. /60 is
                    // 6.4:1 and still reads as subordinate to the
                    // full-strength active label.
                    i === activeIndex ? 'text-paper' : 'text-paper/60',
                  )}
                >
                  {m.shortLabel}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Static layout (reduced motion)                                            */
/* -------------------------------------------------------------------------- */

/**
 * All four methods as a plain ordered sequence — no pin, no crossfade,
 * no clipping. Each illustration is held at its FINISHED frame via
 * `staticIndex`, so the drawings still read as completed operations
 * (hammer down, ring grown) rather than frame 0 of an animation.
 */
function MethodsStatic() {
  return (
    <section className="bg-graphite text-paper">
      <ol className="mx-auto max-w-page px-6 py-24 md:px-10 md:py-32">
        {FORGING_METHODS.map((m, i) => (
          <li
            key={m.number}
            className="grid grid-cols-1 items-center gap-10 border-t border-paper/10 py-16 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-12 md:gap-16 md:py-20"
          >
            <div className="md:col-span-5">
              {/* `progress` is ignored when `staticIndex` is set. */}
              <MethodIllustration progress={0} staticIndex={i} className="mx-auto" />
            </div>
            <div className="md:col-span-7">
              <MethodCounter number={m.number} />
              <MethodBody method={m} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
