'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import RevealHeading from '@/components/motion/RevealHeading';
import { PRODUCT_IMAGES } from '@/data/home';
import { gsap } from '@/lib/gsap';
import { withExt } from '@/lib/image-formats';

interface Tile {
  src: string;
  name: string;
}

/**
 * Build two image-only marquee rows. We deliberately do NOT mount live
 * R3F STL viewers in the marquee — the home page is the entry point,
 * not the catalogue. Even with halved counts + load staggering, the
 * STL canvases were the bottleneck on Act 03. Users get the full live
 * STL viewers on `/renders/` and `/products/`, which is where they
 * actually engage with them.
 */
function buildTiles(): { top: Tile[]; bottom: Tile[] } {
  const imgs = PRODUCT_IMAGES.slice(0, 14).map((src, i) => ({
    src,
    name: `Forged product ${String(i + 1).padStart(2, '0')}`,
  }));
  // Split asymmetrically so the two rows don't visually mirror each
  // other when paused.
  const top = imgs.slice(0, 7);
  const bottom = imgs.slice(7, 14);
  // If the user supplied fewer than 14 images, fall back to interleaving.
  if (bottom.length === 0) return { top, bottom: top.slice().reverse() };
  return { top, bottom };
}

interface MarqueeRowProps {
  tiles: Tile[];
  direction: 1 | -1;
  /** Seconds per full loop. Bigger = slower. */
  duration: number;
  reduced: boolean;
}

/**
 * Single horizontal marquee row. Duplicates the tile list once so
 * the GSAP tween can scroll exactly -50% (one full set width) and
 * loop seamlessly.
 */
function MarqueeRow({ tiles, direction, duration, reduced }: MarqueeRowProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (reduced) return;
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
  }, [direction, duration, reduced]);

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();

  const items = [...tiles, ...tiles];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-6"
        style={{ willChange: 'transform' }}
      >
        {items.map((tile, i) => (
          <ProductTile key={`${tile.name}-${i}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}

function ProductTile({ tile }: { tile: Tile }) {
  const [imageOk, setImageOk] = useState(true);

  return (
    <div
      className="group relative h-[360px] w-[280px] shrink-0 overflow-hidden bg-render-bg"
      data-magnetic
      data-cursor-label={tile.name}
    >
      {imageOk ? (
        // `images.unoptimized: true` (required for `output: 'export'`)
        // turns `next/image` into a passthrough anyway — a native
        // <picture> with AVIF/WebP siblings is a strictly smaller
        // payload, and we keep the explicit width/height for CLS.
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
            // Subtle ~5 % cover-zoom on tile hover. The marquee row
            // pauses on enter (so the tile is held still long enough
            // to read the move), the parent's overflow-hidden clips
            // the overage, and a 700 ms power-out feel keeps it
            // tactile, not bouncy.
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            onError={() => setImageOk(false)}
          />
        </picture>
      ) : (
        // Fallback only when an image fails to load — no visible text,
        // just an on-brand gradient tile so the marquee never shows a
        // broken-image icon.
        <div
          aria-hidden
          className="h-full w-full bg-[linear-gradient(135deg,#D9D9D9_0%,#FAFAFA_100%)]"
        />
      )}
      {/* Name caption — slides up + fades in on hover. Uses a soft
          graphite gradient backdrop so the title reads against any
          photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 bg-gradient-to-t from-graphite/85 via-graphite/40 to-transparent px-5 pb-4 pt-12 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100"
      >
        <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.22em] text-mesh">
          Forged
        </p>
        <p className="mt-1 font-display text-base font-light leading-tight text-paper">
          {tile.name}
        </p>
      </div>
    </div>
  );
}

export default function ProductsMarquee() {
  const reduced = useReducedMotion() ?? false;
  const { top, bottom } = buildTiles();

  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-[1140px] px-6 md:px-10">
        <Eyebrow>ACT 04 · CATALOGUE</Eyebrow>
        <RevealHeading
          as="h2"
          className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-graphite md:text-6xl"
        >
          Forged products to meet your expectations.
        </RevealHeading>
      </div>

      <div className="mt-16 flex flex-col gap-6">
        <MarqueeRow tiles={top} direction={1} duration={40} reduced={reduced} />
        <MarqueeRow
          tiles={bottom}
          direction={-1}
          duration={55}
          reduced={reduced}
        />
      </div>
    </section>
  );
}
