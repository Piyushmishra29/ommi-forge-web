'use client';

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import PinnedSection, {
  useScrollSubscribe,
} from '@/components/motion/PinnedSection';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Lightweight 1080p plant pan that ships ~1 MB instead of the 27 MB
 * `hero.mp4`. Duration ~5 s — the scrub math is `progress * duration`
 * so this works for any clip length.
 */
const PLANT_CLIP_SRC = '/assets/video/plant-pan-1080.mp4';

/**
 * Inner scrubbed drone-footage stage. Subscribes to scroll progress via
 * `useScrollSubscribe` (no React re-renders) and drives
 * `video.currentTime` directly from the callback. The <video> is gated
 * behind an IntersectionObserver — until the section is within 400 px
 * of the viewport we render a graphite placeholder so the home page
 * doesn't ship ~1 MB of MP4 on initial mount.
 */
function ScrubStage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSetRef = useRef(0);
  const [inView, setInView] = useState(false);

  // IntersectionObserver mounted via callback ref so we never end up
  // setting state inside a useEffect cleanup — mirrors the pattern
  // `src/components/three/StlPreview.tsx` uses for lazy STL loading.
  const observerRef = useRef<IntersectionObserver | null>(null);
  const setRefAndObserve = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
            break;
          }
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Scroll subscription — direct DOM mutation, no React state, no
  // re-render. Callback identity is stable so subscribe-effects don't
  // churn.
  const onScroll = useCallback((progress: number) => {
    const v = videoRef.current;
    if (!v) return;
    if (!Number.isFinite(v.duration) || v.duration <= 0) return;
    // Linear map progress (0..1) → currentTime across the full clip.
    // Works for any clip duration — the 5 s plant-pan clip and the old
    // 57 s hero clip alike.
    const t = Math.min(progress * v.duration, v.duration - 0.05);
    // Avoid hammering the video element with sub-pixel updates.
    if (Math.abs(t - lastSetRef.current) < 0.03) return;
    lastSetRef.current = t;
    try {
      v.currentTime = t;
    } catch {
      /* Safari occasionally throws if metadata isn't ready yet. */
    }
  }, []);

  useScrollSubscribe(onScroll);

  return (
    <div
      ref={setRefAndObserve}
      className="relative h-full w-full overflow-hidden bg-graphite"
    >
      {inView && (
        <video
          ref={videoRef}
          src={PLANT_CLIP_SRC}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}
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

/**
 * Reduced-motion fallback — plain autoplay loop of the lightweight
 * plant pan. Same intersection gating so the clip only loads if the
 * section actually scrolls near the viewport.
 */
function StaticPlant() {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const setRefAndObserve = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
            break;
          }
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return (
    <section
      ref={setRefAndObserve}
      className="relative h-[80vh] w-full overflow-hidden bg-graphite"
    >
      {inView && (
        <video
          src={PLANT_CLIP_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}
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
