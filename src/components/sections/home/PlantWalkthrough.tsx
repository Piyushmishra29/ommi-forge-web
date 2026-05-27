'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Inner scrubbed-video stage. Subscribes to `useScroll()` and drives
 * `video.currentTime` from the progress value. We deliberately do NOT
 * autoplay — every frame is driven by scroll.
 *
 * Source clip is `plant-walkthrough.mp4` — 1.8s loop, ambient. The
 * pinned scroll runs ~200vh, so we wrap progress*duration with a
 * modulo on the clip length, producing a slowed-down loop where the
 * viewer scrubs through the 1.8s clip ~N times across the pin.
 */
function ScrubStage() {
  const { progress } = useScroll();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSetRef = useRef(0);
  // Number of times the 1.8s clip wraps across the full pinned scroll.
  // Higher = faster perceived motion; 2 plays the loop twice top→bottom.
  const LOOPS = 2;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Wait for the metadata before trying to scrub.
    const tryScrub = () => {
      if (!Number.isFinite(v.duration) || v.duration <= 0) return;
      // 1.8s loop, ambient — wrap the scrubbed time so the clip
      // restarts cleanly each pass through the pinned scroll.
      const t = (progress * v.duration * LOOPS) % v.duration;
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
        src="/assets/video/plant-walkthrough.mp4"
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

/** Reduced-motion fallback — plain autoplay loop of the same source. */
function StaticPlant() {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden bg-graphite">
      <video
        src="/assets/video/plant-walkthrough.mp4"
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
