'use client';

import { useRef } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import { useScrollImageSequence } from '@/components/motion/useScrollImageSequence';

/**
 * PlantWalkthrough (Act 03)
 *
 * Full-bleed plant footage scroll-scrubbed as a JPG image sequence drawn
 * onto a <canvas> (the Apple technique, same as the Hero) — a reliable
 * "crawl to play" walk through the Malur floor on mobile + desktop, where
 * MP4 currentTime seeking paints white on iOS. The section pins while the
 * frames advance with scroll; OS reduced-motion → a single static frame.
 *
 * Frames live in /public/assets/frames/plant/ (f-001 … f-090), decoded from
 * the first ~9s of the walkthrough clip at 10fps.
 */
const PLANT_FRAME_COUNT = 90;
const plantFrame = (i: number) =>
  `/assets/frames/plant/f-${String(i + 1).padStart(3, '0')}.jpg`;

export default function PlantWalkthrough() {
  const root = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useScrollImageSequence({
    canvasRef,
    sectionRef: root,
    count: PLANT_FRAME_COUNT,
    src: plantFrame,
    end: '+=220%',
  });

  return (
    <section
      ref={root}
      className="relative h-[100dvh] w-full overflow-hidden bg-graphite"
    >
      {/* First frame as a cover-fit background so there's no blank flash
          before the canvas decodes its first frame. */}
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
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />

      <div className="absolute right-6 top-24 z-10 max-w-sm bg-graphite/55 p-6 backdrop-blur-md md:right-10 md:top-32 md:p-8">
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
