'use client';

import { cn } from '@/lib/cn';
import PartPoster from './PartPoster';

export type StlPreviewProps = {
  src: string;
  className?: string;
  /** Optional aria label for the tile. */
  ariaLabel?: string;
};

/**
 * DEPRECATED in v3 — kept only so existing callers keep compiling. New code
 * should use `<PartPoster>` (static) or a `<SceneSlot>` on the route's shared
 * canvas (live).
 *
 * In v2 this mounted its own `<Canvas>` per tile. That is the one behaviour
 * V3-DIRECTION §5.3 and §5.6 both single out: a grid of canvases is a grid of
 * WebGL contexts, the browser caps at 8–16 and evicts the oldest, and this
 * project has already shipped that regression once. Four of these on
 * `/solutions` is four contexts before the visitor has scrolled.
 *
 * So it now renders the offline poster instead — the same still the rest of
 * the lane uses, from the same rig, at 3–8 KB and zero contexts. A caller
 * that genuinely needs a *live* part should put a `<SceneSlot>` on the
 * route's one shared canvas; that is what the engine exists for.
 *
 * The `ariaLabel` contract is unchanged, and it still matters: labelled and
 * exposed when a label is passed, decorative and hidden when it isn't. When
 * the caller already wraps the tile in a link whose visible text names the
 * part, a second accessible name here just makes a screen reader say it twice.
 */
export function StlPreview({ src, className, ariaLabel }: StlPreviewProps) {
  return (
    <div
      className={cn('relative aspect-square w-full overflow-hidden bg-graphite', className)}
      {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    >
      {/* The wrapper carries the role/label when there is one, so the image
          itself is always decorative — otherwise AT hears the same name from
          both the group and the image inside it. */}
      <PartPoster model={src} fit="cover" />
    </div>
  );
}

export default StlPreview;
