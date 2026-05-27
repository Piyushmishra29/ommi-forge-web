'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import { StlPreview } from '@/components/three/lazy';
import { RENDERS } from '@/data/renders';
import { PRODUCT_IMAGES } from '@/data/home';
import { gsap } from '@/lib/gsap';
import { withExt } from '@/lib/image-formats';

type Tile =
  | { kind: 'image'; src: string; name: string }
  | { kind: 'stl'; src: string; name: string };

/**
 * Build two interleaved tile rows. Each row is 8 tiles with 6 image
 * tiles + 2 STL previews (down from 4 STL + 4 image previously); the
 * bottom row uses a different STL ordering so the two scroll planes
 * don't visually mirror each other. Halving the STL count was a
 * deliberate perf call — every STL is a 2-5 MB fetch + WebGL ticker,
 * and the marquee mounts both copies (looped) at once, so 16 STL
 * instances was the dominant hitch on Act 03 entry. With 4 unique
 * STLs total (2 per row, duplicated for the loop) we're at 8 GL
 * canvases, half the previous load.
 */
function buildTiles(): { top: Tile[]; bottom: Tile[] } {
  const topStls: Tile[] = RENDERS.slice(0, 2).map((r) => ({
    kind: 'stl',
    src: r.stl,
    name: r.productName,
  }));
  const bottomStls: Tile[] = RENDERS.slice(2, 4).map((r) => ({
    kind: 'stl',
    src: r.stl,
    name: r.productName,
  }));

  const imgTiles: Tile[] = PRODUCT_IMAGES.slice(0, 12).map((src, i) => ({
    kind: 'image',
    src,
    name: `Product ${i + 1}`,
  }));

  // Top row: img, img, stl, img, img, img, stl, img  (6 img + 2 stl)
  const topImgs = imgTiles.slice(0, 6);
  const top: Tile[] = [
    topImgs[0],
    topImgs[1],
    topStls[0],
    topImgs[2],
    topImgs[3],
    topImgs[4],
    topStls[1],
    topImgs[5],
  ];

  // Bottom row: img, stl, img, img, img, img, stl, img  (6 img + 2 stl)
  // Offset STL positions so the two rows don't line up vertically.
  const bottomImgs = imgTiles.slice(6, 12);
  const bottom: Tile[] = [
    bottomImgs[0],
    bottomStls[0],
    bottomImgs[1],
    bottomImgs[2],
    bottomImgs[3],
    bottomImgs[4],
    bottomStls[1],
    bottomImgs[5],
  ];

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

  // Compute a stagger delay (ms) for every STL tile so the network
  // sees them one after another instead of all at once. Image tiles
  // get 0 ms (they're cheap, lazy-loaded by the browser). Indexing by
  // tile position in the rendered list — duplicates share the same
  // src so the second pass is a memory-cache hit anyway.
  let stlSeen = 0;
  const stlDelays = items.map((tile) => {
    if (tile.kind !== 'stl') return 0;
    const delay = stlSeen * 200;
    stlSeen += 1;
    return delay;
  });

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
          <ProductTile
            key={`${tile.name}-${i}`}
            tile={tile}
            stlDelayMs={stlDelays[i]}
          />
        ))}
      </div>
    </div>
  );
}

function ProductTile({
  tile,
  stlDelayMs,
}: {
  tile: Tile;
  stlDelayMs: number;
}) {
  const [imageOk, setImageOk] = useState(true);
  const [stlReady, setStlReady] = useState(stlDelayMs === 0);

  // Stagger STL activation. The StlPreview itself still gates the
  // GL Canvas via IntersectionObserver, but on viewport entry we'd
  // otherwise queue every STL fetch in the same frame. Holding back
  // by 200 ms × stl-index lets the browser pipeline them.
  useEffect(() => {
    if (tile.kind !== 'stl' || stlDelayMs === 0) return;
    const t = setTimeout(() => setStlReady(true), stlDelayMs);
    return () => clearTimeout(t);
  }, [tile.kind, stlDelayMs]);

  return (
    <div
      className="group relative h-[360px] w-[280px] shrink-0 overflow-hidden bg-render-bg"
      data-magnetic
    >
      {tile.kind === 'stl' ? (
        stlReady ? (
          <StlPreview src={tile.src} ariaLabel={tile.name} className="h-full" />
        ) : (
          <div
            aria-hidden
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(circle at center, #FFFFFF 0%, #D9D9D9 70%)',
            }}
          />
        )
      ) : imageOk ? (
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
