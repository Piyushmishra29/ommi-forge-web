'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { withExt } from '@/lib/image-formats';

interface PhotoBreakProps {
  /** Source path under `/assets/images/`, with `.jpg` extension. */
  src: string;
  /** Alt copy for screen readers. */
  alt: string;
  /** Optional caption rendered low-left on the plate. */
  caption?: string;
  /**
   * Plate height. `tall` is a beat between two sections; `short` is
   * punctuation. Neither is a hero.
   */
  tone?: 'tall' | 'short';
}

/**
 * PhotoBreak — a full-bleed editorial photo plate between sections.
 *
 * Native `<picture>` with AVIF / WebP siblings via `withExt`; the JPG only
 * serves browsers that decode neither. Every image is a real Ommi
 * photograph (§6.24) — there is no stock abstraction anywhere on this site.
 *
 * Parallax is capped at ±8% of the plate height, one direction, per §4.4's
 * #13/#14 entry. v2 ran it at 0.18, which on a 72vh plate is a visible
 * slide rather than depth. It culls itself when the plate is off-screen, and
 * it does not run at all under reduced motion — the plate is then simply a
 * photograph, which loses nothing.
 */
export default function PhotoBreak({
  src,
  alt,
  caption,
  tone = 'tall',
}: PhotoBreakProps) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pictureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    const section = sectionRef.current;
    const picture = pictureRef.current;
    if (!section || !picture) return;

    // `quickSetter` rather than a tween: this writes one transform per
    // scroll frame and never needs to interpolate — a tween here would be a
    // second animation engine running alongside the scroll.
    const setY = gsap.quickSetter(picture, 'yPercent');
    let rafId = 0;
    let pending = false;

    const update = () => {
      pending = false;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Cull when entirely off-screen, so a page with three plates does not
      // pay for the two nobody is looking at.
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      // Plate centre against viewport centre, normalised to ±1, then scaled
      // to the ±8% cap. Dead-centre is zero offset.
      const centre = rect.top + rect.height / 2;
      const delta = (centre - vh / 2) / (vh / 2 + rect.height / 2);
      setY(Math.max(-8, Math.min(8, -delta * 8)));
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reduced]);

  const avif = withExt(src, 'avif');
  const webp = withExt(src, 'webp');

  // `svh`, not `vh`: the mobile URL bar resizing `vh` mid-scroll changes the
  // page height, which re-fires every ScrollTrigger measurement on the page.
  const heightCls =
    tone === 'tall'
      ? 'h-[60svh] min-h-[420px] md:h-[72svh]'
      : 'h-[44svh] min-h-[320px] md:h-[56svh]';

  return (
    <div
      ref={sectionRef}
      className={`relative w-full overflow-hidden bg-graphite ${heightCls}`}
    >
      {/* Over-drawn so the ±8% travel never reveals an empty edge. */}
      <div
        ref={pictureRef}
        className="absolute inset-x-0 -top-[10%] h-[120%]"
        style={{ willChange: 'transform' }}
      >
        <picture>
          <source srcSet={avif} type="image/avif" />
          <source srcSet={webp} type="image/webp" />
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      </div>

      {/* Lower-edge gradient so the next section's headline lands on a
          calmer ground. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite/60 to-transparent"
      />

      {caption ? (
        // paper, not saffron: this caption sits on an unpredictable
        // photograph, and only a near-white holds its contrast over one.
        <p className="page-x type-meta absolute inset-x-0 bottom-6 uppercase tracking-[0.26em] text-paper md:bottom-8">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
