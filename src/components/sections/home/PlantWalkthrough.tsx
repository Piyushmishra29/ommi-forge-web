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
 * Lazy mounted: the canvas + the frame preload don't fire until the
 * section is within ~600 px of the viewport (IntersectionObserver). Saves
 * network on first paint for users who never scroll past Act 01.
 *
 * Two responsive encodes with identical numbering (f-001 … f-108): 960-wide
 * for desktop, 640-wide for mobile — the hook picks one on mount.
 */
/**
 * 108 frames (decimated from 216) — halves the payload on a slow origin
 * while the hook's nearest-frame drawing keeps the scrub visually smooth.
 * `end: +=220%` is a share of viewport, so scroll length / feel is
 * independent of frame count. Lazy-mounted so the payload only loads when
 * the section nears viewport.
 */
const PLANT_FRAME_COUNT = 108;
const plantFrame = (dir: 960 | 640) => (i: number) =>
  `/assets/frames/plant/${dir}/f-${String(i + 1).padStart(3, '0')}.webp`;
const plantSrc = plantFrame(960);
const plantSrcMobile = plantFrame(640);

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
    src: plantSrc,
    srcMobile: plantSrcMobile,
    end: '+=220%',
  });

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${plantFrame(960)(0)}')` }}
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
    // Defensive fallback: if the observer hasn't fired by 2.5 s — which can
    // happen on fast momentum scroll or deep-link landings that skip the
    // rootMargin window in some browsers — force the canvas to mount so the
    // section is never permanently blank.
    //
    // Gated on proximity, which it was not before: an unconditional timer
    // fetched all 108 frames (3.6 MB, the single biggest asset on the route)
    // 2.5 s after landing, for every visitor, including the ones who never
    // scrolled past the hero. Measured on the exported build — it is why the
    // plant sequence showed up in a first-visit trace.
    const fallback = window.setTimeout(() => {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight + 1200) setActive(true);
    }, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      // `100svh`, not `100dvh`: a mobile URL bar collapsing changes `dvh`
      // mid-pin, which moves the pinned box under the visitor. The small
      // viewport unit is stable for the whole gesture (§2.5).
      className="relative h-[100svh] w-full overflow-hidden bg-graphite"
      style={{ contain: 'layout style paint' }}
    >
      {active ? <PlantCanvas sectionRef={sectionRef} /> : null}
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />

      {/* A flat scrim, not a blur: this is the one job blur is actually for
          and the site does not spend it here (§6 rule 2). Opaque enough that
          the copy holds its measured contrast over any frame of the clip. */}
      <div className="absolute right-6 top-24 z-10 max-w-sm bg-graphite/85 p-6 md:right-10 md:top-32 md:p-8">
        <Eyebrow>WALKTHROUGH</Eyebrow>
        <h2 className="type-display-m mt-4">Inside the wonderworld.</h2>
        <p className="type-body mt-4">
          A pass through the Malur plant — hammers, anvils, and the floor
          that turns spec sheets into steel.
        </p>
      </div>
    </section>
  );
}
