'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Inner scrubbed drone-footage stage. Subscribes to `useScroll()` and
 * drives `video.currentTime` from the progress value. Source is the
 * 57s aerial plant tour (the same MP4 the Hero plays muted/looped) —
 * here the viewer scrubs through it across a 200vh pinned scroll.
 */
function ScrubStage() {
  const { progress } = useScroll();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSetRef = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Wait for the metadata before trying to scrub.
    const tryScrub = () => {
      if (!Number.isFinite(v.duration) || v.duration <= 0) return;
      // Linear map progress (0..1) → currentTime across the full clip.
      const t = Math.min(progress * v.duration, v.duration - 0.05);
      // Avoid hammering the video element with sub-pixel updates.
      if (Math.abs(t - lastSetRef.current) < 0.03) return;
      lastSetRef.current = t;
      try {
        v.currentTime = t;
      } catch {
        /* Safari occasionally throws if metadata isn't ready yet. */
      }
    };

    if (v.readyState >= 1) {
      tryScrub();
    } else {
      v.addEventListener('loadedmetadata', tryScrub, { once: true });
      return () => v.removeEventListener('loadedmetadata', tryScrub);
    }
  }, [progress]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-graphite">
      <video
        ref={videoRef}
        src="/assets/video/hero.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />

      {/* Top-right overlay */}
      <div className="absolute right-6 top-24 z-10 max-w-sm bg-graphite/55 p-6 backdrop-blur-md md:right-10 md:top-32 md:p-8">
        <Eyebrow className="text-paper">ACT 04 · WALKTHROUGH</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-light leading-tight text-paper md:text-5xl">
          Inside the wonderworld.
        </h2>
        <p className="mt-4 font-body text-sm text-paper/80 md:text-base">
          A scroll-driven pass through the Malur plant — hammers, anvils,
          and the floor that turns spec sheets into steel.
        </p>
      </div>
    </div>
  );
}

/** Reduced-motion fallback — plain autoplay loop of the same drone clip. */
function StaticPlant() {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden bg-graphite">
      <video
        src="/assets/video/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-graphite/30" aria-hidden />
      <div className="absolute right-6 top-12 z-10 max-w-sm bg-graphite/55 p-6 backdrop-blur-md md:right-10 md:p-8">
        <Eyebrow className="text-paper">ACT 04 · WALKTHROUGH</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-light leading-tight text-paper md:text-5xl">
          Inside the wonderworld.
        </h2>
        <p className="mt-4 font-body text-sm text-paper/80">
          A pass through the Malur plant — hammers, anvils, and the floor
          that turns spec sheets into steel.
        </p>
      </div>
    </section>
  );
}

export default function PlantWalkthrough() {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <StaticPlant />;
  return (
    <PinnedSection length={2}>
      <ScrubStage />
    </PinnedSection>
  );
}
