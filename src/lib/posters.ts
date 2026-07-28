/**
 * Poster stills for the forged parts (V3-DIRECTION §5.9).
 *
 * Every 3D beat on the site needs a still, and it is not a nice-to-have:
 * it is what a crawler indexes, what a no-WebGL browser keeps, what a
 * reduced-motion visitor sees instead of a scrubbed act, and what the live
 * canvas fades in over. One image, four jobs.
 *
 * The files are rendered offline from the *same rig* as the live scene —
 * `scripts/build-posters.py` drives `scripts/posters/poster.html` in a
 * headless Chromium, `scripts/encode-posters.mjs` encodes the pair. That
 * shared rig is why the canvas fade-in is invisible rather than a visible
 * pop from "photo" to "render".
 *
 * ONE SQUARE MASTER PER PART, deliberately. The same still has to sit in a
 * 1:1 grid tile, a 16:9 stage and a 3:4 catalogue tile. Because the render's
 * background is `graphite` — the exact page ground — `object-contain` in a
 * wide box shows no letterbox and `object-cover` in a tall box shows no
 * seam. The part is framed to ~62% of the frame so it survives the 75% safe
 * area of any of those crops.
 */

const POSTER_DIR = '/assets/posters';

/**
 * §3.2 material state a poster was baked in.
 *
 * Two sets exist because §3.2 assigns different states to different surfaces,
 * and a still in the wrong state is exactly the pop §3.6 says the shared rig
 * exists to prevent — the poster would be brighter and smoother than the
 * canvas fading in over it.
 *
 * `machined` (§3.2 B) is the default and is what this lane's pages use: §5.6
 * puts the `/renders` hub stage in machined, §5.7 the detail viewer, and the
 * `/products` catalogue follows them. `as-forged` (§3.2 A) is baked for the
 * surfaces §3.2 assigns it to — `/solutions` and the home hero's first beat —
 * which live in other lanes.
 */
export type PosterState = 'machined' | 'as-forged';

/**
 * Poster URL for a GLB. Returns the **WebP**; callers that render a
 * `<picture>` derive the AVIF sibling with `withExt(src, 'avif')`, matching
 * the convention `scripts/optimize-images.mjs` set for photography.
 *
 * @example
 * posterFor('/assets/models/part-g.glb')
 * // '/assets/posters/part-g.webp'
 * posterFor('/assets/models/part-g.glb', 'as-forged')
 * // '/assets/posters/part-g--as-forged.webp'
 */
export function posterFor(
  modelUrl: string,
  state: PosterState = 'machined',
): string {
  const file = modelUrl.split('/').pop() ?? '';
  const stem = file.replace(/\.glb$/i, '');
  // `machined` is unsuffixed: it is the default, and suffixing it would have
  // renamed every poster already referenced across the site.
  const suffix = state === 'machined' ? '' : `--${state}`;
  return `${POSTER_DIR}/${stem}${suffix}.webp`;
}

/**
 * Intrinsic dimensions of every poster. Declared so `<img width/height>` can
 * reserve the box and the grid never shifts while the images decode — the
 * same reason `ProductsGallery` carries `aspectSize`.
 */
export const POSTER_SIZE = { width: 1000, height: 1000 } as const;
