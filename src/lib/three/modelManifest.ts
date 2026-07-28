/**
 * Static manifest of every GLB in `public/assets/models/`, with its exact
 * on-disk size in bytes.
 *
 * Why the sizes are hard-coded
 * ----------------------------
 * Load progress has to be *determinate*. A spinner with no percentage reads
 * as broken on a multi-megabyte model, and `ProgressEvent.total` is 0
 * whenever the response arrives without a usable `Content-Length` — which is
 * exactly what happens behind a CDN that re-encodes, or on a range/206
 * response. Knowing the byte count up front means the percentage is real
 * from the first chunk, and the priority queue can report aggregate progress
 * across several models before a single header has come back.
 *
 * These are static build artefacts, so the numbers only change when the
 * models are re-exported. Regenerate with:
 *
 *   ls -l public/assets/models/*.glb | awk '{print $9, $5}'
 *
 * Total: 6,617,524 bytes (≈ 6.31 MiB) for all eleven. The route budget is
 * 12 MB (see PERF_BUDGET), so *at most a third of this set may load on any
 * one route* once HTML/JS/CSS/fonts/images are accounted for. Loading all
 * eleven anywhere is an automatic budget failure.
 */

export type ModelEntry = {
  /** Public URL, i.e. the exact string passed to the loader. */
  url: string;
  /** Exact byte length of the file on disk. */
  bytes: number;
};

const MODEL_DIR = '/assets/models';

function entry(name: string, bytes: number): ModelEntry {
  return { url: `${MODEL_DIR}/${name}.glb`, bytes };
}

/**
 * Keyed by the slug used in `src/data/renders.ts` (`a`–`i`) plus the two
 * named parts that have no `/renders` page.
 */
export const MODELS = {
  a: entry('part-a', 630_404),
  b: entry('part-b', 519_616),
  c: entry('part-c', 747_868),
  d: entry('part-d', 1_042_880),
  e: entry('part-e', 429_320),
  f: entry('part-f', 341_952),
  g: entry('part-g', 252_900),
  h: entry('part-h', 431_604),
  i: entry('part-i', 1_072_016),
  trunnion: entry('trunnion-85000103', 543_928),
  tvs1200: entry('tvs-1200', 605_036),
} as const satisfies Record<string, ModelEntry>;

export type ModelKey = keyof typeof MODELS;

/** Reverse index: url → bytes, for the loader's progress maths. */
const BYTES_BY_URL: Record<string, number> = Object.fromEntries(
  Object.values(MODELS).map((m) => [m.url, m.bytes]),
);

/**
 * Expected transfer size for a model URL, or 0 if it isn't in the manifest.
 * The loader falls back to `ProgressEvent.total` when this returns 0, so an
 * unlisted URL still works — it just can't report progress before the first
 * chunk.
 */
export function modelBytes(url: string): number {
  return BYTES_BY_URL[url] ?? 0;
}

/** Sum of the manifest, for budget assertions and the stats overlay. */
export const ALL_MODELS_BYTES = Object.values(MODELS).reduce(
  (sum, m) => sum + m.bytes,
  0,
);

/**
 * Load priorities for `useModelGeometry` / `preloadModel`. Higher wins.
 *
 * The queue only runs `PERF_BUDGET.maxConcurrentModelLoads` fetches at a
 * time, so these decide what the user sees first when four scenes all want
 * a model during one fast scroll. Use the named constants — a scene that
 * invents its own `priority={7}` has silently outranked the hero.
 */
export const MODEL_PRIORITY = {
  /** The one part the hero section is built around. Nothing outranks it. */
  hero: 100,
  /** The section the user is actively scrolling into. */
  approaching: 50,
  /** Speculative: hovered thumbnail, next slide in a showroom. */
  intent: 25,
  /** Idle warm-up, only after everything above has settled. */
  idle: 1,
} as const;

export type ModelPriority =
  (typeof MODEL_PRIORITY)[keyof typeof MODEL_PRIORITY];
