'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import RevealHeading from '@/components/motion/RevealHeading';
import {
  MODELS,
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useScrollProgress,
} from '@/components/three3';
import { PRODUCT_IMAGES } from '@/data/home';
import { gsap } from '@/lib/gsap';
import { withExt } from '@/lib/image-formats';

/**
 * Beat 4 — the line, and the catalogue under it.
 *
 * The 3D half is the page's second and last slot: three real parts crossing
 * one frame on one axis while the section scrolls past. It is unpinned —
 * §5.1 puts this beat in normal scroll, and the page already spends its one
 * pin on the act above.
 *
 * The catalogue half is images only. Live viewers in a grid means N WebGL
 * contexts, which is the exact regression this project already shipped once;
 * the parts are viewable properly on `/renders` and `/products`, which is
 * where someone who wants to inspect one actually goes.
 */

const LineScene = dynamicScene(() => import('./LineScene'));

/** Real names, from `src/data/renders.ts` and the model filenames. */
const LINE_PARTS =
  'Connecting Rod · Forged Sprocket · Hub · Trunnion 85000103 · Crank · Lever';

/** Offline renders of the three parts, through the same rig the canvas uses. */
const LINE_POSTERS = [
  { src: '/assets/posters/part-i', alt: 'Connecting Rod — a closed-die forging in grey steel.' },
  { src: '/assets/posters/part-g', alt: 'Forged Sprocket — a closed-die forging in grey steel.' },
  { src: '/assets/posters/part-h', alt: 'Hub — a forged wheel hub in grey steel.' },
  {
    src: '/assets/posters/trunnion-85000103',
    alt: 'Trunnion 85000103 — a forged trunnion in grey steel.',
  },
  { src: '/assets/posters/part-f', alt: 'Crank — a forged crank in grey steel.' },
  { src: '/assets/posters/part-e', alt: 'Lever — a forged lever in grey steel.' },
] as const;
const LINE_DESCRIPTION =
  'Six forged parts cross a dark stage in single file, the way they cross ' +
  'the floor: the connecting rod from the opening leads, a forged sprocket ' +
  'follows it in from the right, then a wheel hub, trunnion 85000103, a ' +
  'crank, and a lever. All six are cold, as-forged grey steel.';

interface Tile {
  src: string;
  name: string;
}

/**
 * Two rows of seven. Split asymmetrically rather than mirrored so the pair
 * does not read as one block when the marquee is paused.
 */
function buildTiles(): { top: Tile[]; bottom: Tile[] } {
  const imgs = PRODUCT_IMAGES.slice(0, 14).map((src, i) => ({
    src,
    name: `Forged product ${String(i + 1).padStart(2, '0')}`,
  }));
  const top = imgs.slice(0, 7);
  const bottom = imgs.slice(7, 14);
  if (bottom.length === 0) return { top, bottom: top.slice().reverse() };
  return { top, bottom };
}

function ProductTile({ tile }: { tile: Tile }) {
  const [imageOk, setImageOk] = useState(true);

  return (
    <div
      className="group relative aspect-[7/9] w-full shrink-0 overflow-hidden bg-slag lg:aspect-auto lg:h-[360px] lg:w-[280px]"
      data-magnetic
      data-cursor-label={tile.name}
    >
      {imageOk ? (
        // `images.unoptimized: true` (required by `output: 'export'`) turns
        // `next/image` into a passthrough anyway — a native <picture> with
        // AVIF/WebP siblings is strictly smaller, and the explicit
        // width/height still reserves the box.
        <picture>
          <source srcSet={withExt(tile.src, 'avif')} type="image/avif" />
          <source srcSet={withExt(tile.src, 'webp')} type="image/webp" />
          <img
            src={tile.src}
            alt={tile.name}
            width={280}
            height={360}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            onError={() => setImageOk(false)}
          />
        </picture>
      ) : (
        // Only when a file goes missing — an on-brand slab beats a broken
        // image icon, and it carries no text so nothing is lost with it.
        <div aria-hidden className="h-full w-full bg-slag" />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 bg-gradient-to-t from-graphite/90 via-graphite/45 to-transparent px-5 pb-4 pt-12 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
      >
        <p className="type-meta uppercase text-saffron">Forged</p>
        <p className="type-display-s mt-1">{tile.name}</p>
      </div>
    </div>
  );
}

interface MarqueeRowProps {
  tiles: Tile[];
  direction: 1 | -1;
  /** Seconds per full loop. Bigger = slower. */
  duration: number;
}

/**
 * One row. The tile list is duplicated so the tween can travel exactly -50%
 * — one full set width — and loop seamlessly. This is the one thing on the
 * site allowed to loop forever (§6 rule 21); it is a marquee, not a hijacked
 * scroll axis.
 */
function MarqueeRow({ tiles, direction, duration }: MarqueeRowProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const fromPct = direction === -1 ? 0 : -50;
    const toPct = direction === -1 ? -50 : 0;
    gsap.set(track, { xPercent: fromPct });

    tweenRef.current = gsap.to(track, {
      xPercent: toPct,
      duration,
      ease: 'none',
      repeat: -1,
    });

    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, [direction, duration]);

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      // Focus as well as hover: a keyboard user tabbing into anything inside
      // the row must not have it slide out from under them. React's
      // onFocus/onBlur bubble, so this covers descendants.
      onFocus={pause}
      onBlur={resume}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-6"
        style={{ willChange: 'transform' }}
      >
        {[...tiles, ...tiles].map((tile, i) => (
          <ProductTile key={`${tile.name}-${i}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}

/**
 * Reduced motion (§4.5): a static grid, every one of the 14 tiles visible
 * and reachable at once.
 *
 * The v2 pass found this section clipping everything past the first few
 * tiles when the track stopped moving, and fixed it by turning the row into
 * a focusable horizontal scroll container. A wrapping grid is the stronger
 * version of the same fix, and the one the direction specifies: nothing is
 * off-screen, so there is no scroll container to operate and no keyboard
 * affordance to discover.
 */
function StaticGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="mx-auto grid max-w-page grid-cols-2 gap-6 page-x md:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.name}>
          <ProductTile tile={tile} />
        </li>
      ))}
    </ul>
  );
}

export default function ProductsMarquee() {
  const reduced = useReducedMotion();
  const { top, bottom } = buildTiles();

  const stage = useRef<HTMLDivElement>(null);
  // The parts cross the frame as the stage crosses the viewport — the
  // section's own scroll position is the conveyor's position. Ref-backed, so
  // no React render happens on the scroll path, and it keeps working under
  // reduced motion because it is the visitor's scrolling, not an animation.
  const progress = useScrollProgress(stage, {
    start: 'top bottom',
    end: 'bottom top',
  });

  return (
    <section className="relative w-full section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>THE LINE</Eyebrow>
        <RevealHeading as="h2" className="type-display-l mt-6 max-w-[20ch]">
          Forged products to meet your expectations.
        </RevealHeading>
      </div>

      {/* The conveyor. Full-bleed: a 3D stage breaks the container (§2.5),
          and it carries no border, no radius and no shadow — a rounded
          viewport is the "3D widget embedded in a page" look. */}
      <div ref={stage} className="relative mt-16 h-[56svh] w-full">
        {/* `h-full w-full`, never `absolute inset-0`: the slot sets its own
            `position: relative` and Tailwind's `.relative` wins the cascade,
            so an absolutely-positioned slot silently collapses to zero
            height and the canvas scissors to nothing. */}
        <SceneSlot
          accessibleName="Three forged parts crossing a dark stage in single file"
          description={LINE_DESCRIPTION}
          index={2}
          className="h-full w-full"
          onApproach={() => {
            // Warmed on approach, not on mount: half a screen of warning is
            // enough to hide the fetch behind the scroll, and a visitor who
            // never gets here never pays for it.
            //
            // Listed in travel order, which is also the order they are
            // needed. The loader's concurrency cap is 2, so these queue
            // rather than arriving together — the part that enters first
            // finishes first. `MODELS.i` is absent deliberately: the rod
            // leads the line but is already resident from the opening act,
            // and asking for it again would only take a slot in that queue.
            preloadModel(MODELS.g.url, MODEL_PRIORITY.approaching);
            preloadModel(MODELS.h.url, MODEL_PRIORITY.approaching);
            preloadModel(MODELS.trunnion.url, MODEL_PRIORITY.approaching);
            preloadModel(MODELS.f.url, MODEL_PRIORITY.approaching);
            preloadModel(MODELS.e.url, MODEL_PRIORITY.approaching);
          }}
          fallback={
            // The same six parts the canvas draws, in the same order, from
            // the offline renders of the shared rig (§3.6, §5.9). This is what
            // ships in the exported HTML and what a no-WebGL visitor keeps.
            <figure className="absolute inset-0 m-0 flex items-center justify-center gap-[4%] page-x">
              {LINE_POSTERS.map((part) => (
                <picture key={part.src}>
                  <source srcSet={`${part.src}.avif`} type="image/avif" />
                  <img
                    src={`${part.src}.webp`}
                    alt={part.alt}
                    width={1000}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    className="w-[30%] max-w-[300px]"
                  />
                </picture>
              ))}
              <figcaption className="sr-only">{LINE_DESCRIPTION}</figcaption>
            </figure>
          }
        >
          <LineScene progress={progress} />
        </SceneSlot>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, transparent 45%, #1F2124CC 100%)',
          }}
        />

        <p className="type-meta absolute bottom-6 left-0 right-0 z-30 mx-auto max-w-page page-x text-swarf">
          {LINE_PARTS}
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-6">
        {reduced ? (
          <StaticGrid tiles={[...top, ...bottom]} />
        ) : (
          <>
            <MarqueeRow tiles={top} direction={1} duration={40} />
            <MarqueeRow tiles={bottom} direction={-1} duration={55} />
          </>
        )}
      </div>
    </section>
  );
}
