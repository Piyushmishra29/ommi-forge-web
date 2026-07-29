'use client';

import { useEffect, useRef, useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * PlantWalkthrough (Act 03)
 *
 * An autoplaying 1280×720 clip of the Malur plant floor.
 *
 * Why this is a <video> when the rest of the site's motion is canvas
 * -----------------------------------------------------------------
 * The other scrub acts are WebP image sequences painted on a <canvas>
 * because MP4 `currentTime` seeking paints white on iOS Safari. That
 * constraint is about SCRUBBING — driving playback position from scroll.
 * This act no longer scrubs, it plays, and plain autoplay has none of that
 * problem. So the canvas technique buys nothing here and costs a lot:
 *
 *   before  108 WebP frames @ 960×540, 3.58 MB, pinned over `+=220%`
 *   after   one H.264 clip  @ 1280×720, 2.2 MB, 17 s, no pin
 *
 * That is 39 % fewer bytes for 78 % more pixels. The frames were the single
 * largest asset on the route and they were being upscaled from 960 px wide
 * to a full-bleed desktop viewport, which is where the softness came from.
 * Dropping the pin also removes 2.2 viewports of scrolling that the visitor
 * had to work through to get past this one section.
 *
 * The 960/640 plant frame tiers under `public/assets/frames/plant/` are no
 * longer referenced by anything.
 */

/** Poster doubles as the reduced-motion still and the pre-load paint. */
const POSTER = '/assets/video/plant-walkthrough-poster.webp';
const CLIP = '/assets/video/plant-walkthrough.mp4';

export default function PlantWalkthrough() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();

  // Gates the <video> element itself, not just playback: until the section
  // is near the viewport we render the poster alone, so a visitor who never
  // scrolls past Act 01 never fetches 2.2 MB of clip.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setArmed(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play only while on screen and the tab is foregrounded. A 17 s loop left
  // running behind nine viewports of scroll decodes every frame for nothing
  // and competes with the 3D acts for the frame budget — the same reason the
  // hero's pulse loop is visibility-gated.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    let onScreen = false;
    const sync = () => {
      if (onScreen && !document.hidden) void video.play().catch(() => {});
      else video.pause();
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) onScreen = entry.isIntersecting;
              sync();
            },
            { threshold: 0.01 },
          )
        : null;
    if (io) io.observe(video);
    else onScreen = true;

    const onVisibility = () => sync();
    document.addEventListener('visibilitychange', onVisibility);
    sync();

    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      video.pause();
    };
  }, [armed, reduced]);

  return (
    <section
      ref={sectionRef}
      // `100svh`, not `100dvh`: a mobile URL bar collapsing changes `dvh`
      // mid-section, which moves the box under the visitor. The small
      // viewport unit is stable for the whole gesture (§2.5).
      className="relative h-[100svh] w-full overflow-hidden bg-graphite"
      style={{ contain: 'layout style paint' }}
    >
      {/* Poster sits underneath permanently: it is what paints before the
          clip has buffered, what a reduced-motion visitor keeps, and what
          shows if the video fails to decode. No blank frame in any path. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${POSTER}')` }}
      />

      {armed && !reduced ? (
        <video
          ref={videoRef}
          // Decorative: the heading and paragraph beside it carry the
          // meaning, so announcing the clip would just repeat them.
          aria-hidden
          muted
          loop
          playsInline
          // `autoPlay` is deliberately absent — the visibility effect owns
          // play/pause. Setting both means the browser starts playback the
          // moment it can, off-screen, before the effect has a say.
          preload="metadata"
          poster={POSTER}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={CLIP} type="video/mp4" />
        </video>
      ) : null}

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
