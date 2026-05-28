'use client';

import { useEffect, useRef } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * PlantWalkthrough (Act 03)
 *
 * Full-bleed plant footage that AUTOPLAYS + LOOPS. The long (~49s) clip
 * isn't worth frame-sequencing for a scrub, so it plays reliably on every
 * device (muted + playsInline + explicit play() for iOS) while the hero
 * carries the scroll-scrub "crawl to play" interaction.
 */
const PLANT_CLIP_SRC = '/assets/video/walkthrough-scrub.mp4';

export default function PlantWalkthrough() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('canplay', tryPlay, { once: true });
    return () => v.removeEventListener('canplay', tryPlay);
  }, []);

  return (
    <section className="relative h-[80vh] w-full overflow-hidden bg-graphite">
      <video
        ref={videoRef}
        src={PLANT_CLIP_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/video/hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
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
