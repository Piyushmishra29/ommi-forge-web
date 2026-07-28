import { cn } from '@/lib/cn';
import { withExt } from '@/lib/image-formats';
import { POSTER_SIZE, posterFor, type PosterState } from '@/lib/posters';

export type PartPosterProps = {
  /** GLB url — the poster is derived from its filename. */
  model: string;
  /**
   * Alternative text. Pass `''` (the default) when the part is already named
   * in adjacent visible text, which is the usual case: a tile whose caption
   * says "Forged Sprocket" does not need the image to say it again.
   */
  alt?: string;
  className?: string;
  /**
   * `contain` keeps the whole part in frame — for stages and detail
   * fallbacks. `cover` fills a non-square tile by cropping, which is safe
   * because the render leaves ≥25% margin on every side. Default `cover`.
   */
  fit?: 'contain' | 'cover';
  /**
   * `eager` + high fetch priority for the one poster that is above the fold
   * on its route (it is the LCP element there). Everything else stays lazy.
   */
  priority?: boolean;
  /**
   * §3.2 material state. Must match the state of the canvas this still
   * stands in for, or the fade-in is a visible pop. Default `machined`,
   * which is what §5.6 and §5.7 specify for this lane.
   */
  state?: PosterState;
};

/**
 * The static twin of a 3D part — a still rendered from the same rig
 * (V3-DIRECTION §5.9).
 *
 * This is what `<SceneSlot fallback>` gets, what `/products` and the
 * `/renders` grid show *instead of* a canvas (§5.3: a grid of `<Canvas>`
 * tiles is N WebGL contexts and is the exact regression this project already
 * shipped once), and what a no-WebGL browser keeps.
 *
 * No border, no radius, no shadow — §6.10 applies to the poster as much as
 * to the canvas it stands in for, because the whole point is that a visitor
 * cannot tell which one they are looking at.
 */
export default function PartPoster({
  model,
  alt = '',
  className,
  fit = 'cover',
  priority = false,
  state = 'machined',
}: PartPosterProps) {
  const webp = posterFor(model, state);
  const avif = withExt(webp, 'avif');

  return (
    // `block h-full w-full` on the <picture>: it is an inline element by
    // default, so without this the <img>'s `h-full` resolves against an
    // auto-height inline box and the poster renders at intrinsic size
    // instead of filling the tile.
    <picture className="block h-full w-full">
      <source srcSet={avif} type="image/avif" />
      <source srcSet={webp} type="image/webp" />
      {/* Plain <img>: the site is a static export with no image optimiser,
          and these are already 3–8 KB AVIF. `bg-graphite` matches the
          render's own clear colour, so the box is seamless before the
          bytes land and wherever `contain` letterboxes. */}
      <img
        src={webp}
        alt={alt}
        width={POSTER_SIZE.width}
        height={POSTER_SIZE.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn(
          'h-full w-full bg-graphite',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          className,
        )}
      />
    </picture>
  );
}

export { PartPoster };
