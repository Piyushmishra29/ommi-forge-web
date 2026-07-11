'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useScrollImageSequence } from '@/components/motion/useScrollImageSequence';
import { HAMMER_INTRO_WORDS } from '@/data/home';

/**
 * HammerStrikeScrub (Act 01)
 *
 * Scroll-scrubbed real footage of a power hammer striking a glowing steel
 * bar, rendered as a WebP image sequence drawn onto a <canvas> (the Apple
 * technique, same as the Hero / PlantWalkthrough) — reliable "crawl to
 * play" on iOS Safari where MP4 currentTime seeking paints white. Replaces
 * the earlier three.js primitive hammer, dropping three.js off the home
 * bundle entirely.
 *
 * The three intro words (Heat / Strike / Forge) cross-fade over the footage
 * as scroll progress moves 0 → 1, driven off the SAME pin via the hook's
 * `onProgress` callback (ref-writes to the DOM, no per-frame React render).
 *
 * Lazy mounted (IntersectionObserver, ~600 px) so the frame payload only
 * loads as the section nears the viewport. Two responsive encodes with
 * identical numbering (f-001 … f-108): 960-wide desktop, 640-wide mobile.
 */
const HAMMER_FRAME_COUNT = 108;
const hammerFrame = (dir: 960 | 640) => (i: number) =>
  `/assets/frames/hammer/${dir}/f-${String(i + 1).padStart(3, '0')}.webp`;
const hammerSrc = hammerFrame(960);
const hammerSrcMobile = hammerFrame(640);

/**
 * Triangular opacity window: ramps 0 → 1 across [start, mid], back 1 → 0
 * across [mid, end]. A `start` of 0 holds full opacity at rest so the first
 * word is visible before the pin engages. (Ported verbatim from the prior
 * three.js hammer act's cross-fade so the timing/feel is unchanged.)
 */
const op = (p: number, start: number, mid: number, end: number): number => {
  if (p <= start) return start === 0 ? 1 : 0;
  if (p >= end) return 0;
  if (p < mid) return (p - start) / (mid - start);
  return 1 - (p - mid) / (end - mid);
};

/**
 * HammerCanvas mounts only after the parent section enters the lazy-load
 * window. The hook pins the OUTER <section> (a normal-flow element) — we
 * pass its ref in via props rather than creating our own, otherwise
 * ScrollTrigger would try to pin the absolutely-positioned canvas.
 * `onProgress` is forwarded to the hook so the word overlay rides the pin.
 */
function HammerCanvas({
  sectionRef,
  onProgress,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  onProgress: (p: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useScrollImageSequence({
    canvasRef,
    sectionRef,
    count: HAMMER_FRAME_COUNT,
    src: hammerSrc,
    srcMobile: hammerSrcMobile,
    end: '+=250%',
    onProgress,
  });

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${hammerFrame(960)(0)}')` }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
      />
    </>
  );
}

export default function HammerStrikeScrub() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();

  // Refs into each cross-fading word so the scroll callback writes opacity /
  // transform straight to the DOM — no React render on the hot path.
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([null, null, null]);

  const onProgress = useCallback((p: number) => {
    // Strike/Forge peak on the footage's spark impacts (frames 53 and 100 of
    // 108 → progress 0.486 and 0.925). Forge holds at 1 so the section — and
    // the reduced-motion static state — ends on a visible word.
    const ops = [
      op(p, 0, 0.0, 0.33), // Heat
      op(p, 0.2, 0.486, 0.7), // Strike
      p < 0.6 ? 0 : Math.min((p - 0.6) / 0.325, 1), // Forge
    ];
    for (let i = 0; i < wordRefs.current.length; i += 1) {
      const node = wordRefs.current[i];
      if (!node) continue;
      const opacity = ops[i] ?? 0;
      node.style.opacity = String(opacity);
      node.style.transform = `translateY(${(1 - opacity) * 20}px)`;
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    // Defensive fallback: if the observer hasn't fired by 2.5 s — fast
    // momentum scroll or deep-link landings can skip the rootMargin window
    // in some browsers — force the canvas to mount so the section is never
    // permanently blank.
    const fallback = window.setTimeout(() => setActive(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-graphite"
      style={{ contain: 'layout style paint' }}
    >
      {active ? (
        <HammerCanvas sectionRef={sectionRef} onProgress={onProgress} />
      ) : null}

      {/* Scrim: keep the big words legible over dark, contrasty footage.
          Heavier on the left (where the words sit) and along the bottom. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-graphite/80 via-graphite/40 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-graphite/70 to-transparent"
      />

      {/* Overlay copy */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 md:px-12 lg:px-20">
        <Eyebrow className="text-paper">ACT 01 · IMPACT</Eyebrow>
        <div
          aria-label="Heat. Strike. Forge."
          className="relative mt-6 h-[40vh] w-full md:h-[55vh]"
        >
          {HAMMER_INTRO_WORDS.map((word, i) => (
            <span
              key={word}
              aria-hidden
              ref={(node) => {
                wordRefs.current[i] = node;
              }}
              className="absolute inset-0 flex items-center font-display font-light leading-none text-paper [text-shadow:0_2px_32px_rgba(0,0,0,0.55)]"
              style={{
                // Under reduced-motion the hook primes onProgress(1) → Forge;
                // pre-mount, show Heat (or Forge if reduced) to avoid a flash.
                opacity: (reduced ? i === 2 : i === 0) ? 1 : 0,
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
    </section>
  );
}
