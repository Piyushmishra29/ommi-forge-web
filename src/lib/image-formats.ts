/**
 * image-formats
 *
 * Small helpers for swapping image extensions and emitting CSS
 * `image-set()` strings. We pre-generate AVIF + WebP siblings for every
 * source JPG/PNG under `public/assets/images/` via
 * `scripts/optimize-images.mjs`; the consumers (next-image-free
 * components and CSS backgrounds) reference them via these helpers so
 * the extension swap lives in exactly one place.
 *
 * If you add a new optimised format, extend `OptimisedFormat` and the
 * `image-set()` order in `cssImageSet` — and make sure the optimise
 * script emits the sibling.
 */

export type OptimisedFormat = 'avif' | 'webp' | 'jpg' | 'jpeg' | 'png';

/**
 * Swap the extension of an image URL. Works on absolute (`/foo/bar.jpg`)
 * and relative (`bar.jpg`) paths. Returns the input unchanged if no
 * extension is detected — better to fall back to the original than to
 * 404.
 */
export function withExt(src: string, ext: OptimisedFormat): string {
  const lastDot = src.lastIndexOf('.');
  const lastSlash = src.lastIndexOf('/');
  // Bail if there's no dot, or the dot is in a directory segment.
  if (lastDot === -1 || lastDot < lastSlash) return src;
  return `${src.slice(0, lastDot)}.${ext}`;
}

/**
 * Returns a CSS `image-set(...)` value suitable for inline
 * `style.backgroundImage`. Browsers walk the list in order and pick the
 * first format they decode — modern Chrome/Safari/Firefox pick AVIF,
 * older browsers fall through to WebP, ancient browsers to the source.
 */
export function cssImageSet(src: string): string {
  const avif = withExt(src, 'avif');
  const webp = withExt(src, 'webp');
  // `type(...)` is the modern spec syntax (CSS Images Module 4) and is
  // supported across all evergreen browsers. We deliberately omit the
  // older `format(...)` variant because every browser that supports
  // image-set() at all supports `type(...)`.
  return `image-set(url('${avif}') type('image/avif'), url('${webp}') type('image/webp'), url('${src}') type('image/jpeg'))`;
}
