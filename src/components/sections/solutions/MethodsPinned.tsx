'use client';

import Link from 'next/link';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import MethodIllustration from './MethodIllustration';
import { StlPreview } from '@/components/three/lazy';
import { FORGING_METHODS } from '@/data/solutions';
import { getRenderBySlug } from '@/data/renders';
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
 * Reduced-motion: PinnedSection itself degrades to a normal stacked
 * block, so the inner layout falls back to a clean column with all four
 * methods visible at once. The illustration just stays on slide 1 — no
 * jank.
 */
export default function MethodsPinned() {
  return (
    <PinnedSection length={3} className="bg-graphite text-paper">
      <Inner />
    </PinnedSection>
  );
}

function Inner() {
  // Intentionally uses the legacy `useScroll()` hook (React state via
  // `useSyncExternalStore`) rather than the ref-backed
  // `useScrollSubscribe`. The four method panels are React-rendered
  // crossfades — `activeIndex` controls `aria-hidden`, opacity, and
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
      <div className="mx-auto grid h-full max-w-[var(--container-page)] grid-cols-1 items-center gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
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

          {/* Progress index */}
          <div className="mb-8 flex items-center gap-3">
            <span className="font-display text-4xl font-light text-mesh md:text-5xl">
              {FORGING_METHODS[activeIndex]?.number ?? '01'}
            </span>
            <span className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-paper/60">
              of {String(FORGING_METHODS.length).padStart(2, '0')}
            </span>
          </div>

          <div className="relative min-h-[420px] md:min-h-[460px]">
            {FORGING_METHODS.map((m, i) => {
              const sample = getRenderBySlug(m.sampleSlug);
              return (
                <article
                  key={m.number}
                  aria-hidden={i !== activeIndex}
                  className={cn(
                    'transition-all duration-500',
                    i === activeIndex
                      ? 'pointer-events-auto relative translate-y-0 opacity-100'
                      : 'pointer-events-none absolute inset-0 translate-y-3 opacity-0',
                  )}
                >
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-12 sm:gap-10">
                    <div className="sm:col-span-8">
                      <h2 className="font-display text-3xl font-light leading-tight text-paper md:text-5xl">
                        {m.title}
                      </h2>
                      <p className="mt-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                        {m.spec}
                      </p>
                      <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-paper/80 md:text-lg md:leading-[1.7]">
                        {m.body}
                      </p>
                      <div className="mt-8">
                        <Link
                          href="/contact/"
                          data-magnetic
                          className="inline-flex items-center justify-center border border-mesh px-6 py-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-mesh transition-colors hover:bg-mesh hover:text-graphite"
                        >
                          {`Discuss a ${m.shortLabel} project →`}
                        </Link>
                      </div>
                    </div>

                    {/* Sample part — live STL preview of an actual
                        forged piece from the RENDERS catalogue. */}
                    {sample && (
                      <div className="sm:col-span-4">
                        <div className="aspect-square w-full overflow-hidden border border-paper/10 bg-paper/[0.02]">
                          <StlPreview
                            src={sample.model}
                            ariaLabel={`${m.sampleName} — sample ${m.shortLabel} forging`}
                            className="h-full w-full"
                          />
                        </div>
                        <p className="mt-3 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper/60">
                          Sample part
                        </p>
                        <p className="mt-1 font-display text-lg font-light text-paper">
                          {m.sampleName}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Step rail */}
          <ol className="mt-12 flex gap-4">
            {FORGING_METHODS.map((m, i) => (
              <li
                key={m.number}
                className="flex flex-1 flex-col gap-2"
                aria-current={i === activeIndex}
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
                    i === activeIndex ? 'text-paper' : 'text-paper/40',
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
