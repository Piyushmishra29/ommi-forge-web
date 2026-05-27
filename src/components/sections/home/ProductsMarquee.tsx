'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/ui/Eyebrow';
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
            className="h-full w-full object-cover"
            onError={() => setImageOk(false)}
          />
        </picture>
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#D9D9D9_0%,#FAFAFA_100%)] text-graphite/40"
        >
          <span className="font-display text-3xl font-light">{tile.name}</span>
        </div>
      )}

      {/* Hover label */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-graphite/90 p-4 text-paper transition-transform duration-300 group-hover:translate-y-0">
        <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.22em] text-mesh">
          Forged product
        </p>
        <p className="mt-1 font-display text-lg leading-tight">{tile.name}</p>
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
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.1] text-graphite md:text-6xl">
          Forged products to meet your expectations.
        </h2>
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
