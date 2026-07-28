'use client';

/**
 * Lazy wrappers for the three.js-powered components.
 *
 * Why this file exists
 * --------------------
 * Without `next/dynamic`, every route that statically imports a three
 * component pulls a fresh ~876 KB copy of three.js into its own route
 * chunk. Turbopack emits per-route bundles and won't dedupe the
 * vendor across them, so `/renders/*` would pull three.js into each of
 * its route chunks via `StlViewer` / `StlPreview`. (The home page no
 * longer touches three.js — its hammer act is now a canvas image
 * sequence, not an R3F scene.)
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
import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------------- */
/*  Skeletons (graphite + on-brand, no three.js, no Canvas)                   */
/* -------------------------------------------------------------------------- */

function AnvilSkeletonSvg() {
  return (
    // `stroke="currentColor"` + `text-mesh` keeps this on-token instead of
    // a raw hex — the animated dashes read as brand-mesh via inherited color.
    <svg
      width="220"
      height="180"
      viewBox="0 0 220 180"
      fill="none"
      className="text-mesh opacity-70"
      aria-hidden="true"
    >
      <rect
        x="20"
        y="60"
        width="180"
        height="32"
        rx="3"
        stroke="currentColor"
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
        stroke="currentColor"
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
        stroke="currentColor"
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
// Same radial-gradient stage background the mounted `<StlViewer>`/
// `<StlPreview>` paint via `BRAND_HEX` inline styles, expressed as a
// Tailwind arbitrary value against the CSS custom properties `@theme`
// generates — so the skeleton-to-live-canvas swap has zero visible seam,
// with no raw hex duplicated here.
const STAGE_BG =
  'bg-[radial-gradient(circle_at_center,var(--color-snow)_0%,var(--color-render-bg)_70%)]';

function StlViewerSkeleton() {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        STAGE_BG,
      )}
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
      className={cn('relative aspect-square w-full overflow-hidden', STAGE_BG)}
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
