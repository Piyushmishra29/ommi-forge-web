'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from '@/lib/gsap';
import { withExt } from '@/lib/image-formats';

/* -------------------------------------------------------------------------- */
/*  Reduced-motion subscription                                               */
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

interface PhotoBreakProps {
  /** Source path under `/assets/images/`, with `.jpg` extension. */
  src: string;
  /** Alt copy for screen readers. */
  alt: string;
  /** Optional caption rendered low-left on the plate. */
  caption?: string;
  /**
   * Plate height. Defaults to `60vh` on desktop, `48vh` on mobile —
   * a punctuation beat between editorial sections, not a hero.
   */
  tone?: 'tall' | 'short';
}

/**
 * PhotoBreak
 *
 * A full-bleed editorial photo plate used between sections of
 * `/about/`. Uses native `<picture>` with AVIF / WebP siblings (via
 * `withExt`) for performance; the JPG only serves as a fallback for
 * browsers that decode neither modern format.
 *
 * Parallax: the image translates upward at `scrollY * 0.18` while the
 * plate is on-screen, capped to the plate height so the bottom edge
 * never reveals an empty seam. Honours `prefers-reduced-motion`.
 */
export default function PhotoBreak({
  src,
  alt,
  caption,
  tone = 'tall',
}: PhotoBreakProps) {
  const reduced = useSyncExternalStore(
    subscribeRM,
    getRMSnapshot,
    getRMServer,
  );
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pictureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    const section = sectionRef.current;
    const picture = pictureRef.current;
    if (!section || !picture) return;

    const setY = gsap.quickSetter(picture, 'y', 'px');
    let rafId = 0;
    let pending = false;

    const update = () => {
      pending = false;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Cull when entirely off-screen so we don't burn CPU on
      // mobiles with multiple breaks below the fold.
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      // Map "section center vs viewport center" to a parallax offset.
      // When the plate is dead-center, offset = 0. When the plate is
      // about to leave the top, offset is negative (image pushed up).
      const sectionCenter = rect.top + rect.height / 2;
      const delta = sectionCenter - vh / 2;
      const max = section.offsetHeight * 0.18;
      const y = Math.max(-max, Math.min(max, -delta * 0.18));
      setY(y);
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

  const heightCls =
    tone === 'tall'
      ? 'h-[60vh] min-h-[420px] md:h-[72vh]'
      : 'h-[44vh] min-h-[320px] md:h-[56vh]';

  return (
    <div
      ref={sectionRef}
      className={`relative w-full overflow-hidden bg-graphite ${heightCls}`}
    >
      {/* Over-drawn picture so the parallax translate range never
          reveals an empty edge. */}
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
      {/* Lower-edge gradient so the next section's headline sits on
          a calmer ground. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite/35 to-transparent"
      />
      {caption ? (
        <p className="absolute bottom-6 left-6 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-paper md:bottom-8 md:left-10">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
