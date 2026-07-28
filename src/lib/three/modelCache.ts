/**
 * Priority-queued, deduplicated GLB loader with determinate progress.
 *
 * Why this file exists
 * --------------------
 * Four scenes on one route will each ask for a model, some of them for the
 * *same* model. `useLoader` (the v2 path) dedupes by URL but gives you no
 * control over ordering or concurrency: a fast scroll fires eleven parallel
 * fetches, three meshopt decodes land in the same frame, and the hero — the
 * one thing the user is actually looking at — finishes last. This module
 * makes the order explicit and the concurrency bounded.
 *
 * Three guarantees the scene layer depends on:
 *   1. A given URL is fetched and parsed exactly once per page load, no
 *      matter how many scenes ask for it or how often they re-render.
 *   2. At most `PERF_BUDGET.maxConcurrentModelLoads` are in flight, highest
 *      priority first, and a queued model's priority can be *raised* by a
 *      later request (scroll turns an `idle` preload into `approaching`).
 *   3. Progress is a real 0–1 from the first byte, because the expected
 *      size comes from `modelManifest`, not from a header that may be
 *      missing.
 *
 * Reads as an external store (`subscribe` + `getVersion`) so React consumers
 * can use `useSyncExternalStore` and never `setState` inside an effect —
 * the same reason `src/lib/use-reduced-motion.ts` is built that way.
 */

// TYPE-ONLY on purpose. This module is imported from the DOM side of the app
// (a section calls `preloadModel` from `onApproach`), and a value import of
// GLTFLoader here would drag three.js into the page's first-paint chunk —
// undoing the whole lazy-loading design. The loader is `await import()`ed on
// first use instead; see `getLoader`.
import type { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PERF_BUDGET } from './budget';
import { MODEL_PRIORITY, modelBytes } from './modelManifest';

export type ModelStatus = 'queued' | 'loading' | 'ready' | 'error';

interface Record_ {
  url: string;
  priority: number;
  status: ModelStatus;
  /** Bytes received so far. */
  loaded: number;
  /** Expected total: manifest size, else the header, else 0 (unknown). */
  total: number;
  gltf: GLTF | null;
  error: Error | null;
  /** One promise handed to every caller of `loadModel` for this URL. */
  promise: Promise<GLTF>;
  settleResolve: (gltf: GLTF) => void;
  settleReject: (err: Error) => void;
}

const records = new Map<string, Record_>();
let activeLoads = 0;
let version = 0;
const subscribers = new Set<() => void>();

/* -------------------------------------------------------------------------- */
/*  External-store plumbing                                                   */
/* -------------------------------------------------------------------------- */

let notifyScheduled = false;

/**
 * Coalesce notifications to one per frame. `onProgress` fires once per
 * network chunk — re-rendering every consumer on each of those turns a
 * 1 MB download into a few hundred React renders for a percentage that only
 * changes visibly ~60 times.
 */
function notify() {
  version += 1;
  if (notifyScheduled) return;
  notifyScheduled = true;
  const flush = () => {
    notifyScheduled = false;
    for (const cb of subscribers) cb();
  };
  if (typeof requestAnimationFrame === 'undefined') flush();
  else requestAnimationFrame(flush);
}

/** Subscribe to any change in load state. Returns an unsubscribe function. */
export function subscribeModels(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** Monotonic counter — the `getSnapshot` for `useSyncExternalStore`. */
export function getModelsVersion(): number {
  return version;
}

/** Server snapshot: nothing has loaded during SSR, by construction. */
export function getModelsServerVersion(): number {
  return 0;
}

/* -------------------------------------------------------------------------- */
/*  Loader                                                                    */
/* -------------------------------------------------------------------------- */

let loaderPromise: Promise<GLTFLoader> | null = null;

/**
 * One shared `GLTFLoader`, built on first use from a dynamic import.
 *
 * Two things fall out of doing it this way. It keeps three.js out of any
 * chunk that merely *mentions* loading a model, and it means importing this
 * module during the static export never touches the meshopt WebAssembly
 * (there is no `window` there, and the decoder instantiates from embedded
 * bytes — which is also why the CSP needs `'wasm-unsafe-eval'`; see
 * `public/_headers`).
 *
 * `configureGltfLoader` is the v2 meshopt wiring: proven, load-bearing, and
 * required by every `gltfpack -cc` GLB in this repo. Reused, never
 * re-derived.
 */
function getLoader(): Promise<GLTFLoader> {
  if (!loaderPromise) {
    loaderPromise = (async () => {
      const [{ GLTFLoader }, { configureGltfLoader }] = await Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('@/components/three/glb'),
      ]);
      const instance = new GLTFLoader();
      configureGltfLoader(instance);
      return instance;
    })();
  }
  return loaderPromise;
}

/**
 * Start the highest-priority queued model, up to the concurrency cap.
 * Called after every enqueue and after every settle.
 */
function pump() {
  while (activeLoads < PERF_BUDGET.maxConcurrentModelLoads) {
    let next: Record_ | null = null;
    for (const rec of records.values()) {
      if (rec.status !== 'queued') continue;
      if (!next || rec.priority > next.priority) next = rec;
    }
    if (!next) return;
    // `start` reserves its slot synchronously before its first await, so
    // this loop still terminates; the promise itself is settled through the
    // record, not by the caller.
    void start(next);
  }
}

async function start(rec: Record_) {
  // Reserve the slot before awaiting the loader, or a burst of enqueues
  // would all pass the concurrency check while the import is in flight.
  rec.status = 'loading';
  activeLoads += 1;
  notify();

  let loader: GLTFLoader;
  try {
    loader = await getLoader();
  } catch (err) {
    rec.error = err instanceof Error ? err : new Error('Failed to load three.js');
    rec.status = 'error';
    activeLoads -= 1;
    notify();
    rec.settleReject(rec.error);
    pump();
    return;
  }

  loader.load(
    rec.url,
    (gltf) => {
      rec.gltf = gltf;
      rec.status = 'ready';
      rec.loaded = rec.total || rec.loaded;
      activeLoads -= 1;
      notify();
      rec.settleResolve(gltf);
      pump();
    },
    (event) => {
      rec.loaded = event.loaded;
      // Prefer the manifest size: a gzip/br-re-encoded response reports the
      // *encoded* total, which would make the bar jump past 100%.
      if (!rec.total) rec.total = event.total || 0;
      notify();
    },
    (err) => {
      rec.error =
        err instanceof Error ? err : new Error(`Failed to load ${rec.url}`);
      rec.status = 'error';
      activeLoads -= 1;
      notify();
      rec.settleReject(rec.error);
      pump();
    },
  );
}

function createRecord(url: string, priority: number): Record_ {
  let settleResolve!: (gltf: GLTF) => void;
  let settleReject!: (err: Error) => void;
  const promise = new Promise<GLTF>((res, rej) => {
    settleResolve = res;
    settleReject = rej;
  });
  // A rejected promise nobody awaits is an unhandled rejection; `preloadModel`
  // is fire-and-forget by design, so absorb it here. Consumers still see the
  // error through `getModelRecord(url).error`.
  promise.catch(() => {});

  const rec: Record_ = {
    url,
    priority,
    status: 'queued',
    loaded: 0,
    total: modelBytes(url),
    gltf: null,
    error: null,
    promise,
    settleResolve,
    settleReject,
  };
  records.set(url, rec);
  return rec;
}

/**
 * Queue `url` and resolve with its parsed `GLTF`. Idempotent: calling it
 * again for a URL already loading or loaded returns the same promise and
 * never re-fetches.
 *
 * Passing a higher `priority` than a queued request already has raises it —
 * that is how a speculative `idle` preload gets promoted the moment the user
 * actually scrolls toward the section.
 */
export function loadModel(
  url: string,
  priority: number = MODEL_PRIORITY.approaching,
): Promise<GLTF> {
  const existing = records.get(url);
  if (existing) {
    if (existing.status === 'queued' && priority > existing.priority) {
      existing.priority = priority;
      notify();
    }
    return existing.promise;
  }
  const rec = createRecord(url, priority);
  notify();
  pump();
  return rec.promise;
}

/**
 * Fire-and-forget warm-up. Use on *intent* — a slot entering its approach
 * margin, a thumbnail hover — never on mount for something below the fold.
 */
export function preloadModel(
  url: string,
  priority: number = MODEL_PRIORITY.intent,
): void {
  void loadModel(url, priority);
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export type ModelSnapshot = {
  status: ModelStatus | 'idle';
  /** 0–1. Stays 0 while queued; reaches 1 only on `ready`. */
  progress: number;
  loaded: number;
  total: number;
  gltf: GLTF | null;
  error: Error | null;
};

const IDLE: ModelSnapshot = {
  status: 'idle',
  progress: 0,
  loaded: 0,
  total: 0,
  gltf: null,
  error: null,
};

/** Current state of one URL. Returns an `idle` snapshot if never requested. */
export function getModelSnapshot(url: string | null): ModelSnapshot {
  if (!url) return IDLE;
  const rec = records.get(url);
  if (!rec) return IDLE;
  return {
    status: rec.status,
    progress:
      rec.status === 'ready'
        ? 1
        : rec.total > 0
          ? Math.min(rec.loaded / rec.total, 0.999)
          : 0,
    loaded: rec.loaded,
    total: rec.total,
    gltf: rec.gltf,
    error: rec.error,
  };
}

export type AggregateSnapshot = {
  /** True while any of `urls` is still queued or loading. */
  active: boolean;
  /** Byte-weighted 0–1 across all `urls`. 1 when every one is ready. */
  progress: number;
  /** First error encountered, if any. */
  error: Error | null;
};

/**
 * Byte-weighted progress across several models — what a section's loading
 * readout should show. Weighting by bytes (not by count) means a 1 MB part
 * finishing does not read the same as a 250 KB one.
 */
export function getAggregateSnapshot(urls: readonly string[]): AggregateSnapshot {
  if (urls.length === 0) return { active: false, progress: 1, error: null };

  let loaded = 0;
  let total = 0;
  let active = false;
  let error: Error | null = null;

  for (const url of urls) {
    const rec = records.get(url);
    const expected = modelBytes(url) || rec?.total || 0;
    total += expected;
    if (!rec) continue;
    if (rec.status === 'ready') loaded += expected;
    else loaded += Math.min(rec.loaded, expected);
    if (rec.status === 'queued' || rec.status === 'loading') active = true;
    if (rec.error && !error) error = rec.error;
  }

  return {
    active,
    progress: total > 0 ? Math.min(loaded / total, 1) : active ? 0 : 1,
    error,
  };
}

/** Bytes actually transferred so far, for the dev stats overlay. */
export function getLoadedBytes(): number {
  let sum = 0;
  for (const rec of records.values()) sum += rec.loaded;
  return sum;
}

/** Number of models that have finished parsing — the first-paint assertion. */
export function getReadyModelCount(): number {
  let n = 0;
  for (const rec of records.values()) if (rec.status === 'ready') n += 1;
  return n;
}

/**
 * Drop every cached `GLTF`. Call on route change *only if* the next route
 * shares no models — re-parsing a 1 MB GLB costs more than the memory it
 * frees, and the browser cache makes a repeat fetch free anyway. Geometry
 * built on top of these lives in `geometryCache` and is cleared separately.
 */
export function clearModelCache(): void {
  records.clear();
  activeLoads = 0;
  notify();
}
