'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import { useScrollImageSequence } from '@/components/motion/useScrollImageSequence';

/**
 * PlantWalkthrough (Act 03)
 *
 * Scroll-scrubbed plant-floor walkthrough rendered as a WebP image
 * sequence drawn onto a <canvas> (the Apple AirPods technique, same as
 * the Hero) — reliable "crawl to play" on iOS Safari, where MP4
 * currentTime seeking paints white.
 *
 * Lazy mounted: the canvas + the 90-frame preload don't fire until the
 * section is within ~600 px of the viewport (IntersectionObserver). Saves
 * ~8 MB of network on first paint for users who never scroll past Act 01.
 *
 * Frames live in /public/assets/frames/plant/ (f-001 … f-090), decoded
 * from the first ~9 s of the walkthrough clip at 10 fps as WebP q80.
 */
/**
 * 24 fps × 9 s = 216 frames. Bumped from 10 fps for visibly smoother
 * scroll-scrub (~1 new frame every 11 px of mouse wheel at the default
 * `end: +=220%`). Lazy-mounted so the ~19 MB payload only loads when
 * the section nears viewport.
 */
const PLANT_FRAME_COUNT = 216;
const plantFrame = (i: number) =>
  `/assets/frames/plant/f-${String(i + 1).padStart(3, '0')}.webp`;

/**
 * PlantCanvas mounts only after the parent section enters the lazy-load
 * window. The scroll-image-sequence hook needs to pin the OUTER <section>
 * (normal-flow element) — we pass its ref in via props rather than
 * creating our own, otherwise ScrollTrigger would try to pin an
 * absolutely-positioned div and the pin wouldn't anchor.
 */
function PlantCanvas({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useScrollImageSequence({
    canvasRef,
    sectionRef,
    count: PLANT_FRAME_COUNT,
    src: plantFrame,
    end: '+=220%',
  });

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${plantFrame(0)}')` }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
      />
    </>
  );
}

export default function PlantWalkthrough() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

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
    // Defensive fallback: if the observer hasn't fired by 2.5 s — which
    // can happen on fast momentum scroll or deep-link landings that skip
    // the rootMargin window in some browsers — force the canvas to mount
    // so the section is never permanently blank.
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
      {active ? <PlantCanvas sectionRef={sectionRef} /> : null}
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />

      <div className="absolute right-6 top-24 z-10 max-w-sm bg-graphite/75 p-6 md:right-10 md:top-32 md:p-8">
        <Eyebrow className="text-paper">ACT 03 · WALKTHROUGH</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-light leading-tight text-paper md:text-5xl">
          Inside the wonderworld.
        </h2>
        <p className="mt-4 font-body text-sm text-paper/80 md:text-base">
          A pass through the Malur plant — hammers, anvils, and the floor
          that turns spec sheets into steel.
        </p>
      </div>
    </section>
  );
}
