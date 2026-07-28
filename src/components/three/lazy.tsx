'use client';

/**
 * Lazy wrappers for the three.js-powered components.
 *
 * Why this file exists
 * --------------------
 * Without `next/dynamic`, every route that statically imports a three
 * component pulls a fresh ~876 KB copy of three.js into its own route chunk.
 * Turbopack emits per-route bundles and won't dedupe the vendor across them.
 * Wrapping in `dynamic(() => import(...), { ssr: false })` defers the import
 * to a separate async chunk the runtime shares across routes, and avoids
 * running WebGL code during the static export, where `window` doesn't exist.
 *
 * There is now exactly one component in that category. `StlPreview` no
 * longer touches three at all — in v3 it renders the offline poster (see its
 * own doc comment), so it is re-exported here directly rather than paying a
 * dynamic boundary and a loading skeleton for a 4 KB image. Callers keep the
 * same import path either way.
 */

import dynamic from 'next/dynamic';
import { cn } from '@/lib/cn';

export { StlPreview } from './StlPreview';
export type { StlPreviewProps } from './StlPreview';

/**
 * Full-bleed skeleton matching `<StlViewer>`'s host box. Graphite and empty:
 * the stage's clear colour is the page colour (§3.6), so the swap to the
 * live canvas has no seam and there is nothing to animate — §6.16 rejects a
 * spinner, and real byte progress appears a moment later from inside the
 * viewer itself.
 */
function StlViewerSkeleton() {
  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-graphite')}
      aria-hidden="true"
    />
  );
}

export const StlViewer = dynamic(
  () => import('./StlViewer').then((m) => ({ default: m.StlViewer })),
  {
    ssr: false,
    loading: () => <StlViewerSkeleton />,
  },
);
