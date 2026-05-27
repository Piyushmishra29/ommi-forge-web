'use client';

/**
 * Lazy wrappers for the three.js-powered components.
 *
 * Why this file exists
 * --------------------
 * Without `next/dynamic`, every route that statically imports a three
 * component pulls a fresh ~876 KB copy of three.js into its own route
 * chunk. Turbopack emits per-route bundles and won't dedupe the
 * vendor across them, so we were shipping three.js twice (once for
 * `/` via `HammerStrikeHero`, once for `/renders/*` via `StlViewer` /
 * `StlPreview`).
 *
 * Wrapping each component in `dynamic(() => import(...), { ssr: false })`
 * defers the actual import to a separate async chunk that the runtime
 * can share across routes. It also avoids running the WebGL code on
 * the server, where `window` doesn't exist.
 *
 * All importers should use these wrappers — there is one source of
 * truth for "load three on demand". The underlying components keep
 * both named and default exports, so any existing JSX usage works
 * unchanged.
 */

import dynamic from 'next/dynamic';

/* -------------------------------------------------------------------------- */
/*  Skeletons (graphite + on-brand, no three.js, no Canvas)                   */
/* -------------------------------------------------------------------------- */

function AnvilSkeletonSvg() {
  return (
    <svg
      width="220"
      height="180"
      viewBox="0 0 220 180"
      fill="none"
      className="opacity-70"
      aria-hidden="true"
    >
      <rect
        x="20"
        y="60"
        width="180"
        height="32"
        rx="3"
        stroke="#FF5533"
        strokeWidth="1.6"
        strokeDasharray="6 6"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </rect>
      <path
        d="M 60 92 L 75 130 L 145 130 L 160 92 Z"
        stroke="#FF5533"
        strokeWidth="1.6"
        strokeDasharray="6 6"
        fill="none"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>
      <rect
        x="55"
        y="130"
        width="110"
        height="22"
        rx="2"
        stroke="#FF5533"
        strokeWidth="1.6"
        strokeDasharray="6 6"
        fill="none"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
}

/**
 * 16:9-ish full-bleed skeleton (matches `<StlViewer>` host). Uses the
 * same radial-gradient background so the swap to the live Canvas is
 * visually quiet.
 */
function StlViewerSkeleton() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, #FFFFFF 0%, #D9D9D9 70%)',
      }}
      aria-hidden="true"
    >
      <AnvilSkeletonSvg />
    </div>
  );
}

/**
 * Square skeleton matching `<StlPreview>` tile.
 */
function StlPreviewSkeleton() {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, #FFFFFF 0%, #D9D9D9 70%)',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Full-bleed neutral skeleton for the hero scene. The hero takes the
 * full height of its parent (50vh mobile, 100% md+), so we just paint
 * a paper-tone block and let the Canvas fade in.
 */
function HammerStrikeHeroSkeleton() {
  return (
    <div
      className="h-full w-full bg-paper"
      aria-hidden="true"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Lazy components                                                           */
/* -------------------------------------------------------------------------- */

export const StlViewer = dynamic(
  () =>
    import('./StlViewer').then((m) => ({ default: m.StlViewer })),
  {
    ssr: false,
    loading: () => <StlViewerSkeleton />,
  },
);

export const StlPreview = dynamic(
  () =>
    import('./StlPreview').then((m) => ({ default: m.StlPreview })),
  {
    ssr: false,
    loading: () => <StlPreviewSkeleton />,
  },
);

export const HammerStrikeHero = dynamic(
  () =>
    import('./HammerStrikeHero').then((m) => ({ default: m.HammerStrikeHero })),
  {
    ssr: false,
    loading: () => <HammerStrikeHeroSkeleton />,
  },
);
