'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import { cssImageSet } from '@/lib/image-formats';
import { FOUNDER_QUOTE } from '@/data/about';

/**
 * useReducedMotion (local)
 *
 * Subscribes to `(prefers-reduced-motion: reduce)` via
 * `useSyncExternalStore`, so we never schedule a setState during an
 * effect. Mirrors the pattern used by MagneticCursor.
 */
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

/**
 * AboutHero
 *
 * Full-viewport editorial opener for `/about`.
 *
 *  - Background: DSC09268.jpg (foundry interior) served via CSS
 *    `image-set()` so AVIF/WebP siblings are picked first. The image
 *    parallaxes upward at `scrollY * 0.3`, capped to its own section
 *    bounds so it never bleeds into the next block.
 *  - Eyebrow: "EST. 1975 · BANGALORE → MALUR" — anchors the timeline
 *    before the headline lands.
 *  - Headline: clamp(56px, 9vw, 110px) Manrope display, split on chars
 *    so each glyph rises into place on mount.
 *  - Founder quote sits low on the right for a settled composition.
 *
 * All motion honours `prefers-reduced-motion`.
 */
export default function AboutHero() {
  const reduced = useSyncExternalStore(
    subscribeRM,
    getRMSnapshot,
    getRMServer,
  );
  const rootRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  // Char + fade entry animation on mount.
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-char]'), {
        yPercent: 110,
        opacity: 0,
        stagger: 0.012,
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.15,
      });
      gsap.from(el.querySelectorAll('[data-fade]'), {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.55,
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  // Parallax — translate the bg div by `scrollY * 0.3` while the
  // section is on-screen. Uses `gsap.quickSetter` so we never trigger
  // a React re-render on the scroll-hot path. Capped to the section's
  // own bounds so the image doesn't bleed past it.
  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    const section = rootRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    const setY = gsap.quickSetter(bg, 'y', 'px');
    let rafId = 0;
    let pending = false;

    const update = () => {
      pending = false;
      const rect = section.getBoundingClientRect();
      // Section top relative to viewport. When section top is 0 the
      // hero fully fills the viewport. We translate proportionally to
      // how far we've scrolled past the top.
      const scrolled = Math.max(0, -rect.top);
      // Cap the parallax to the section height so it never escapes.
      const max = section.offsetHeight * 0.3;
      const y = Math.min(scrolled * 0.3, max);
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

  return (
    <section
      ref={rootRef}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-graphite text-paper"
    >
      {/* Parallax bg — overdrawn 30% on the vertical so the translation
          range never reveals an empty edge. */}
      <div
        aria-hidden
        ref={bgRef}
        className="absolute inset-x-0 top-[-15%] h-[130%] bg-cover bg-center opacity-40"
        style={{
          backgroundImage: cssImageSet('/assets/images/DSC09268.jpg'),
          willChange: 'transform',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-graphite/95 via-graphite/55 to-graphite/95"
      />

      <div className="relative mx-auto grid w-full max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 pb-24 pt-40 md:grid-cols-12 md:px-10 md:pb-32 md:pt-48">
        <div className="md:col-span-8">
          <div data-fade>
            <Eyebrow className="text-paper">
              <span className="text-mesh">EST. 1975 · BANGALORE → MALUR</span>
            </Eyebrow>
          </div>
          <h1
            className="mt-10 max-w-5xl font-display font-light leading-[1.02] text-paper"
            style={{ fontSize: 'clamp(56px, 9vw, 110px)' }}
          >
            <SplitText as="span">
              {`A forging house built on heritage and metallurgy.`}
            </SplitText>
          </h1>
        </div>

        <div className="self-end md:col-span-4 md:pl-6" data-fade>
          <p className="font-display text-xl font-light leading-snug text-paper md:text-2xl">
            <span className="text-mesh">“</span>
            {FOUNDER_QUOTE.body}
            <span className="text-mesh">”</span>
          </p>
          <p className="mt-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-steel">
            {FOUNDER_QUOTE.attribution}
          </p>
        </div>
      </div>

      {/* Bottom edge hairline */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-paper/10" />
    </section>
  );
}
