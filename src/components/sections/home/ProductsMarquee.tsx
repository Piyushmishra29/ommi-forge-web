'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import StlPreview from '@/components/three/StlPreview';
import { RENDERS } from '@/data/renders';
import { PRODUCT_IMAGES } from '@/data/home';
import { gsap } from '@/lib/gsap';

type Tile =
  | { kind: 'image'; src: string; name: string }
  | { kind: 'stl'; src: string; name: string };

/**
 * Build two interleaved tile rows. The top row mixes image tiles +
 * STL previews (4 STL + 4 image); the bottom row is shuffled so the
 * two scroll planes don't visually mirror each other.
 */
function buildTiles(): { top: Tile[]; bottom: Tile[] } {
  const stlTiles: Tile[] = RENDERS.slice(0, 4).map((r) => ({
    kind: 'stl',
    src: r.stl,
    name: r.productName,
  }));
  const imgTiles: Tile[] = PRODUCT_IMAGES.slice(0, 8).map((src, i) => ({
    kind: 'image',
    src,
    name: `Product ${i + 1}`,
  }));

  const top: Tile[] = [];
  for (let i = 0; i < 4; i += 1) {
    top.push(imgTiles[i]);
    top.push(stlTiles[i]);
  }

  const bottomImgs = imgTiles.slice(4, 8);
  const bottomStls: Tile[] = RENDERS.slice(4, 8).map((r) => ({
    kind: 'stl',
    src: r.stl,
    name: r.productName,
  }));
  const bottom: Tile[] = [];
  for (let i = 0; i < 4; i += 1) {
    bottom.push(bottomStls[i]);
    bottom.push(bottomImgs[i]);
  }

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
 * Single horizontal marquee row. We duplicate the tile list once so
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

    // The track holds two copies of `tiles`. Scrolling -50% wraps perfectly.
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

  // Pause on hover (desktop) — Lenis still scrolls fine through it.
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
      {tile.kind === 'stl' ? (
        <StlPreview src={tile.src} ariaLabel={tile.name} className="h-full" />
      ) : imageOk ? (
        <Image
          src={tile.src}
          alt={tile.name}
          width={280}
          height={360}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageOk(false)}
        />
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
          {tile.kind === 'stl' ? '3D render' : 'Forged product'}
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
        <Eyebrow>ACT 03 · CATALOGUE</Eyebrow>
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
