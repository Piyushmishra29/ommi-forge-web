'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import PinnedSection, {
  useScrollSubscribe,
  useScrollProgressRef,
} from '@/components/motion/PinnedSection';
import { HammerStrikeHero } from '@/components/three/lazy';
import Eyebrow from '@/components/ui/Eyebrow';
import { HAMMER_INTRO_WORDS } from '@/data/home';

/**
 * GatedHammerHero
 *
 * Wraps the lazy `<HammerStrikeHero>` in an IntersectionObserver so the
 * three.js chunk (~890 KB) + WebGL context only initialize when the
 * scene is within ~600 px of the viewport. The wrapper div ALWAYS
 * renders at full height/width so the surrounding section keeps the
 * exact same layout — the pin trigger sees no movement and the scroll
 * math is untouched. We only gate the R3F mount itself.
 *
 * The observer disconnects after first intersection: once mounted, the
 * Canvas stays mounted for the lifetime of the section.
 *
 * `progress` is a stable ref — we forward it untouched into the R3F
 * scene, which reads `.current` inside its own `useFrame`. That keeps
 * scroll updates entirely outside React's render path.
 */
function GatedHammerHero({
  progress,
}: {
  progress: { readonly current: number };
}) {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRefAndObserve = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Non-browser / unsupported — render immediately.
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
            break;
          }
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return (
    <div ref={setRefAndObserve} className="h-full w-full bg-paper">
      {inView && <HammerStrikeHero progress={progress} />}
    </div>
  );
}

/**
 * HammerStrikeIntro
 *
 * `<PinnedSection length={2.5}>` so the section holds ~250vh of scroll.
 *  - Left column: eyebrow + a stack of 3 absolutely-positioned huge
 *    words ("Heat" / "Strike" / "Forge") whose opacities cross-fade as
 *    progress moves 0 → 0.33 → 0.66 → 1.
 *  - Right column: the R3F hammer-strike scene driven by the same
 *    progress value.
 *  - At progress > 0.95 we trigger a saffron flash by toggling a CSS
 *    variable on the section. A latch ref keeps the flash from
 *    re-firing during scroll oscillation.
 *
 * Perf note (2026-05): this component used to read `progress` from a
 * `useState`-backed context, which re-rendered every descendant 60×
 * per second. It now uses `useScrollSubscribe` to mutate refs / DOM
 * directly and forwards a progress ref into the R3F scene, so the
 * scroll-driven path never touches React.
 *
 * Reduced-motion: a single static "Forge" word + a 1-frame hammer
 * scene (progress fixed at 1). No pin, no flash.
 */
function HammerInner() {
  const progressRef = useScrollProgressRef();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const struckRef = useRef(false);
  const flashTlRef = useRef<gsap.core.Timeline | null>(null);

  // Refs into each cross-fading word so we can write opacity / transform
  // straight to the DOM from the scroll subscription — no React render.
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([null, null, null]);

  // Smooth window opacities — three layered words.
  const op = (
    progress: number,
    start: number,
    mid: number,
    end: number,
  ): number => {
    if (progress <= start) return start === 0 ? 1 : 0;
    if (progress >= end) return 0;
    if (progress < mid) return (progress - start) / (mid - start);
    return 1 - (progress - mid) / (end - mid);
  };

  // Build the impact-flash timeline ONCE on mount. We pause it and
  // `restart()` on each trigger so the saffron always lands back on
  // paper — no risk of getting "stuck" on saffron if the user
  // scroll-oscillates near 0.95.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const tl = gsap.timeline({ paused: true });
    tl.to(el, {
      backgroundColor: 'var(--color-saffron)',
      duration: 0.2,
      ease: 'power2.out',
    }).to(el, {
      backgroundColor: 'var(--color-paper)',
      duration: 0.4,
      ease: 'power2.out',
    });
    flashTlRef.current = tl;

    return () => {
      tl.kill();
      flashTlRef.current = null;
      // Reset inline style so HMR doesn't leave us mid-tween.
      gsap.set(el, { clearProps: 'backgroundColor,transition' });
    };
  }, []);

  // Single subscription — runs every scroll tick, writes directly into
  // the word elements and (debounced) restarts the flash timeline.
  // Stable callback identity so we don't re-subscribe on every render.
  const onScroll = useCallback((p: number) => {
    const heat = op(p, 0, 0.0, 0.33);
    const strike = op(p, 0.2, 0.45, 0.66);
    const forge = op(p, 0.55, 0.85, 1.0);
    const ops = [heat, strike, forge];
    for (let i = 0; i < wordRefs.current.length; i += 1) {
      const node = wordRefs.current[i];
      const opacity = ops[i] ?? 0;
      if (!node) continue;
      node.style.opacity = String(opacity);
      node.style.transform = `translateY(${(1 - opacity) * 20}px)`;
    }

    const tl = flashTlRef.current;
    if (tl) {
      if (p > 0.95 && !struckRef.current) {
        struckRef.current = true;
        tl.restart();
      } else if (p < 0.5) {
        struckRef.current = false;
      }
    }
  }, []);

  useScrollSubscribe(onScroll);

  return (
    <div
      ref={sectionRef}
      className="relative grid h-full w-full grid-cols-1 items-center bg-paper md:grid-cols-2"
    >
      {/* Left text */}
      <div className="relative z-10 flex h-full flex-col justify-center px-6 py-12 md:px-12 lg:px-20">
        <Eyebrow>ACT 01 · IMPACT</Eyebrow>
        <div
          aria-label="Heat. Strike. Forge."
          className="relative mt-6 h-[40vh] w-full md:h-[60vh]"
        >
          {HAMMER_INTRO_WORDS.map((word, i) => (
            <span
              key={word}
              aria-hidden
              ref={(node) => {
                wordRefs.current[i] = node;
              }}
              className="absolute inset-0 flex items-center font-display font-light leading-none text-graphite"
              style={{
                // Initial opacity — first word visible, others hidden.
                opacity: i === 0 ? 1 : 0,
                fontSize: 'clamp(80px, 14vw, 200px)',
                letterSpacing: '-0.02em',
                transform: 'translateY(0px)',
                transition: 'transform 250ms ease-out',
              }}
            >
              {word}.
            </span>
          ))}
        </div>
      </div>

      {/* Right scene — gated so the three.js chunk + WebGL context
          only spin up when the section nears the viewport. The wrapper
          inside `<GatedHammerHero>` keeps the same h-full/w-full
          footprint either way, so layout (and the pin trigger) is
          stable regardless of mount state. */}
      <div className="relative h-[50vh] w-full md:h-full">
        <GatedHammerHero progress={progressRef} />
      </div>
    </div>
  );
}

function HammerStatic() {
  return (
    <section className="relative grid w-full grid-cols-1 items-center bg-paper py-32 md:grid-cols-2 md:py-40">
      <div className="px-6 md:px-12 lg:px-20">
        <Eyebrow>ACT 01 · IMPACT</Eyebrow>
        <p
          className="mt-6 font-display font-light leading-none text-graphite"
          style={{ fontSize: 'clamp(80px, 14vw, 200px)' }}
        >
          Forge.
        </p>
      </div>
      <div className="relative aspect-square w-full md:aspect-auto md:h-[60vh]">
        <HammerStrikeHero progress={1} />
      </div>
    </section>
  );
}

export default function HammerStrikeIntro() {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <HammerStatic />;
  return (
    <PinnedSection length={2.5}>
      <HammerInner />
    </PinnedSection>
  );
}
