'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import PinnedSection, {
  useScrollSubscribe,
} from '@/components/motion/PinnedSection';
import Eyebrow from '@/components/ui/Eyebrow';
import { MILESTONES } from '@/data/home';

/**
 * HeritageTimeline
 *
 * Horizontal-scroll timeline (1975 → 2026). Wrapped in
 * `<PinnedSection length={4}>`; while pinned, the inner flex track is
 * translated leftward proportional to scroll progress so each
 * milestone slides into view.
 *
 * Perf: PinnedSection now publishes progress through a ref-backed
 * store, so this component subscribes via `useScrollSubscribe` and
 * writes the transform straight through `gsap.quickSetter`. No React
 * state is involved on the scroll path; the component renders once and
 * the `<div>` track is mutated imperatively per frame.
 *
 * Reduced-motion: renders the same milestones stacked vertically,
 * no pin, no horizontal motion.
 */
function TimelineTrack() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Cache the `x` setter once per element. `gsap.quickSetter` returns
  // a memoised function bound to the target — far cheaper per-call than
  // creating an inline `style={{ transform: ... }}` object that React
  // would otherwise have to diff every ScrollTrigger tick.
  const quickSetterRef = useRef<ReturnType<typeof gsap.quickSetter> | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    quickSetterRef.current = gsap.quickSetter(trackRef.current, 'x', 'vw');
    return () => {
      quickSetterRef.current = null;
    };
  }, []);

  const onScroll = useCallback((progress: number) => {
    // Distance to translate: track width − viewport width, expressed in vw.
    // With 6 milestones at ~80vw each = ~480vw total → translate by 380vw.
    const setter = quickSetterRef.current;
    if (!setter) return;
    setter(-380 * progress);
  }, []);

  useScrollSubscribe(onScroll);

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-paper">
      <div className="px-6 pt-12 md:px-12">
        <Eyebrow>ACT 05 · HERITAGE</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-light leading-[1.1] text-graphite md:text-5xl">
          Fifty-one years on the floor.
        </h2>
      </div>

      <div className="relative mt-12 flex-1">
        {/* Connecting hairline */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-px bg-graphite/15"
        />

        <div
          ref={trackRef}
          className="absolute inset-y-0 flex items-center gap-0"
          style={{ willChange: 'transform' }}
        >
          {MILESTONES.map((m) => (
            <article
              key={m.year}
              className="relative flex h-full w-[80vw] shrink-0 flex-col justify-center px-8 md:w-[60vw] md:px-16"
            >
              <div className="relative">
                <span
                  className="absolute -top-2 left-0 h-3 w-3 -translate-y-1/2 bg-mesh"
                  aria-hidden
                />
                <p className="font-display text-[clamp(72px,10vw,160px)] font-light leading-none text-mesh">
                  {m.year}
                </p>
                <h3 className="mt-6 font-display text-2xl font-light leading-tight text-graphite md:text-4xl">
                  {m.title}
                  {m.inProgress && (
                    <span className="ml-3 align-middle font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-mesh">
                      (in progress)
                    </span>
                  )}
                </h3>
                <p className="mt-6 max-w-md font-body text-base leading-relaxed text-steel">
                  {m.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaticList() {
  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-[1140px] px-6 md:px-10">
        <Eyebrow>ACT 05 · HERITAGE</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-light leading-[1.1] text-graphite md:text-5xl">
          Fifty-one years on the floor.
        </h2>

        <ol className="mt-16 grid gap-12 md:grid-cols-2">
          {MILESTONES.map((m) => (
            <li key={m.year}>
              <p className="font-display text-6xl font-light leading-none text-mesh">
                {m.year}
              </p>
              <h3 className="mt-4 font-display text-2xl font-light leading-tight text-graphite">
                {m.title}
                {m.inProgress && (
                  <span className="ml-3 align-middle font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-mesh">
                    (in progress)
                  </span>
                )}
              </h3>
              <p className="mt-3 font-body text-base leading-relaxed text-steel">
                {m.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function HeritageTimeline() {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <StaticList />;
  return (
    <PinnedSection length={4}>
      <TimelineTrack />
    </PinnedSection>
  );
}
