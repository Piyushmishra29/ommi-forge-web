'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { HERO_COPY } from '@/data/home';
import { BRAND_HEX } from '@/lib/brand';

/**
 * Synthesised "hammer pulse" waveform — 60 floats in [0..1].
 * We don't fight autoplay/muted-video constraints; instead we
 * pre-compute a periodic amplitude curve that *feels* like the
 * cadence of a hammer line (a slow swell modulated by a sharper
 * strike component). The 4-bar visualiser reads this array each
 * RAF tick.
 */
function buildHammerPulse(steps = 60): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    out.push(Math.abs(Math.sin(t * 7 + t * 0.4)) * 0.6 + 0.4);
  }
  return out;
}

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
/**
 * AudioPulseBars
 *
 * 4-bar SVG visualiser that pulses on a synthesised hammer waveform.
 * Each bar samples the waveform at a phase offset, so the bars don't
 * move in lockstep. Reduced-motion: bars rest at 50% height.
 */
function AudioPulseBars({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<SVGGElement | null>(null);
  const wave = useMemo(() => buildHammerPulse(60), []);

  useEffect(() => {
    if (reduced) return;
    const node = groupRef.current;
    if (!node) return;
    const bars = Array.from(node.querySelectorAll<SVGRectElement>('rect'));
    if (bars.length === 0) return;

    let rafId = 0;
    const phases = [0, 12, 24, 36]; // step offsets so bars desync

    const tick = () => {
      const base = Math.floor(Date.now() / 80);
      bars.forEach((bar, i) => {
        const idx = (base + phases[i]) % wave.length;
        const v = wave[idx];
        bar.setAttribute('transform', `translate(${i * 8} ${20 - v * 20}) scale(1 ${v})`);
      });
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [reduced, wave]);

  // Initial (reduced-motion) heights: 50%.
  return (
    <svg
      width={60}
      height={20}
      viewBox="0 0 60 20"
      aria-hidden
      className="opacity-70"
    >
      <g ref={groupRef}>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={0}
            y={0}
            width={4}
            height={20}
            fill={BRAND_HEX.mesh}
            transform={`translate(${i * 8} 10) scale(1 0.5)`}
          />
        ))}
      </g>
    </svg>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  // The hero video AUTOPLAYS + LOOPS — always, for everyone. The footage
  // is the centrepiece, so it must just play (no scroll-scrub mechanic,
  // which was fragile over slow connections and froze without scroll).
  // Belt-and-braces: some browsers won't honour the autoplay attribute on
  // a muted background video after hydration, so we also call play()
  // explicitly once the element can play.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => {
        /* Autoplay can be refused; the poster stays visible. */
      });
    };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('canplay', tryPlay, { once: true });
    return () => v.removeEventListener('canplay', tryPlay);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Line 1 splits per-char; the italic line 2 splits per-WORD (italic
      // glyphs slant past their box, so per-char inline-block spans mangle
      // thin letters). Animate both char and word spans.
      const chars = el.querySelectorAll(
        '[data-hero-headline] [data-char], [data-hero-headline] [data-word]',
      );
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
      style={{ marginTop: 'calc(-1 * var(--header-h))' }}
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
    >
      {/* Background hero video — autoplay + loop, always. Muted +
          playsInline so mobile/iOS allow autoplay. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/video/hero-firstshot.mp4"
        poster="/assets/video/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      {/* Layered overlay: darker top-to-bottom gradient so headline + subhead
          read on bright midday footage. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-graphite/55 via-graphite/40 to-graphite/75"
        aria-hidden
      />

      {/* Foreground */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1140px] flex-col items-center px-6 text-center text-paper [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
        <Eyebrow className="text-paper">{HERO_COPY.eyebrow}</Eyebrow>

        <div
          data-hero-headline
          className="mt-8 font-display font-light leading-[1.02]"
        >
          <SplitText
            as="h1"
            className="text-[clamp(56px,11vw,124px)] text-paper"
          >
            {HERO_COPY.headlineLine1}
          </SplitText>
          <SplitText
            as="span"
            byWord
            className="mt-3 block text-[clamp(28px,5vw,52px)] italic text-paper/90"
          >
            {HERO_COPY.headlineLine2}
          </SplitText>
        </div>

        <p
          data-hero-subhead
          className="mt-10 max-w-xl font-body text-base text-paper md:text-lg"
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
            className="inline-flex items-center justify-center bg-saffron px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] transition-colors hover:bg-mesh hover:text-paper"
            style={{ textShadow: 'none' }}
          >
            {HERO_COPY.primaryCta.label}
          </Link>
          <Link
            href={HERO_COPY.secondaryCta.href}
            data-magnetic
            className="inline-flex items-center justify-center border border-paper/80 bg-graphite/20 px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper backdrop-blur-sm transition-colors hover:bg-paper hover:text-graphite"
          >
            {HERO_COPY.secondaryCta.label}
          </Link>
        </div>
      </div>

      {/* Scroll cue — moved out of the center column, anchored bottom-right
          so it never crosses the headline or subhead. */}
      <div
        data-hero-cue
        className="pointer-events-none absolute bottom-8 right-6 z-10 hidden flex-col items-end gap-3 text-paper/85 md:flex md:right-10"
      >
        <AudioPulseBars reduced={reduced} />
        <span
          aria-hidden
          className="block h-14 w-px animate-pulse bg-mesh"
        />
        <span
          className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.45em]"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          Scroll
        </span>
      </div>
    </section>
  );
}
