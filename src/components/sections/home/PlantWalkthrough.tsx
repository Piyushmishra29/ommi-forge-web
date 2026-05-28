'use client';

import { useEffect, useRef, useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import { useVideoScrub } from '@/components/motion/useVideoScrub';

/**
 * PlantWalkthrough (Act 03)
 *
 * Scroll-scrubbed plant footage — the "Inside the wonderworld" crawl. The
 * section pins and the video advances frame-by-frame with scroll, via the
 * shared `useVideoScrub` hook (which carries the mobile-Safari fixes:
 * loadedmetadata bind, touch-prime, fastSeek).
 *
 * OS reduced-motion users get a plain autoplay loop instead (no pin, no
 * scrub) — `osReduced` swaps both the attributes and skips the hook.
 */
const PLANT_CLIP_SRC = '/assets/video/walkthrough-scrub.mp4';

export default function PlantWalkthrough() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setOsReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Scrub (no-op when OS reduced-motion is set — the hook bails internally).
  useVideoScrub({ videoRef, sectionRef, end: '+=250%' });

  // Reduced-motion fallback: make sure the autoplay loop actually starts.
  useEffect(() => {
    if (!osReduced) return;
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [osReduced]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-graphite"
    >
      <video
        ref={videoRef}
        src={PLANT_CLIP_SRC}
        autoPlay={osReduced}
        loop={osReduced}
        muted
        playsInline
        preload="auto"
        poster="/assets/video/hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />

      {/* Top-right overlay */}
      <div className="absolute right-6 top-24 z-10 max-w-sm bg-graphite/55 p-6 backdrop-blur-md md:right-10 md:top-32 md:p-8">
        <Eyebrow className="text-paper">ACT 03 · WALKTHROUGH</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-light leading-tight text-paper md:text-5xl">
          Inside the wonderworld.
        </h2>
        <p className="mt-4 font-body text-sm text-paper/80 md:text-base">
          A scroll-driven pass through the Malur plant — hammers, anvils,
          and the floor that turns spec sheets into steel.
        </p>
      </div>
    </section>
  );
}
