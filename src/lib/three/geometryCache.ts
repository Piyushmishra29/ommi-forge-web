/**
 * Shared, normalised `BufferGeometry` cache built on top of `modelCache`.
 *
 * Why this file exists
 * --------------------
 * `extractGeometry()` is not cheap: it dequantizes every vertex out of the
 * KHR_mesh_quantization int16 buffer into float32, bakes the node matrix,
 * then the caller centres, rescales and recomputes normals. That is a
 * multi-millisecond main-thread pass on a 1 MB CAD part. In v2 it ran once
 * per `<StlPreview>` mount, which was fine for one viewer per page and is
 * not fine when a hero, a showroom and a transition all want the same part.
 *
 * Here it runs exactly once per (url, options) pair and every consumer gets
 * the *same* `BufferGeometry` instance — one GPU upload, shared by every
 * mesh that references it.
 *
 * OWNERSHIP: geometry returned from here belongs to the cache, not to you.
 *   - Never call `.dispose()` on it.
 *   - Pass `dispose={null}` on any `<mesh geometry={…}>` that uses it, so
 *     R3F's unmount cleanup leaves it alone.
 *   - Free the whole cache with `clearGeometryCache()` on a route change
 *     that shares no models.
 *
 * RESIDENCY: the cache is module-global and survives SPA navigation, so it
 * is bounded by `PERF_BUDGET.maxCachedTriangles` and evicts least-recently-
 * used entries above that. Eviction is reference-counted and cannot free
 * geometry that a mounted mesh is still drawing:
 *
 *   - `useModelGeometry` retains on mount and releases on unmount, and it is
 *     the only acquisition path any scene uses.
 *   - An entry is only a candidate once its reference count reaches zero AND
 *     it has stayed there for `PERF_BUDGET.geometryEvictionGraceMs`. That
 *     grace window is what makes it safe for a scene to hold the outgoing
 *     geometry in a ref for a few frames across a part handoff.
 *   - Calling `prepareGeometry` directly, outside the hook, gives you an
 *     entry at zero references: hold it beyond the grace window and you must
 *     call `retainGeometry(prepared.key)` yourself. No scene does this today;
 *     use the hook.
 */

import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
// dequantize() lives inside extractGeometry and is the reason every model on
// this site renders at all — reuse, never reimplement.
import { extractGeometry } from '@/components/three/glb';
import { rad } from './math';
import { PERF_BUDGET } from './budget';

export type ShadingMode =
  /**
   * Indexed geometry, averaged vertex normals. Cheapest — no vertex
   * duplication — but sharp machined edges read as slightly rounded because
   * the two faces meeting at an edge share (and therefore average) their
   * normals. The default.
   */
  | 'smooth'
  /**
   * Creased normals at `creaseAngleDeg`: edges sharper than the threshold
   * get split, everything smoother stays welded. This is what makes a
   * forged part look *machined* under a hard key light instead of soapy.
   *
   * COST: `toCreasedNormals` returns NON-INDEXED geometry, so vertex count
   * jumps to 3 × triangle count. On a 200k-triangle part that is ~14 MB of
   * GPU buffer instead of ~5 MB. Worth it for one hero part; not for eight
   * showroom thumbnails.
   */
  | 'creased';

export type PrepareOptions = {
  /**
   * Bounding-sphere radius the part is rescaled to. Default 1 — unit scale
   * keeps camera distances, light positions and damping rates as small
   * readable numbers across every scene. (v2's viewers used 50; do not mix
   * the two conventions in one scene.)
   */
  targetRadius?: number;
  shading?: ShadingMode;
  /** Crease threshold in degrees. Only used when `shading: 'creased'`. */
  creaseAngleDeg?: number;
};

export type PreparedGeometry = {
  /**
   * Cache identity for this (url, options) pair. `useModelGeometry` uses it
   * to retain and release the entry; scenes should not need it.
   */
  key: string;
  /** Centred on the origin, rescaled to `targetRadius`. Cache-owned. */
  geometry: THREE.BufferGeometry;
  /** The radius it was normalised to — i.e. `options.targetRadius`. */
  radius: number;
  /**
   * Axis-aligned extents AFTER normalisation. Scenes use this to lay a part
   * out (e.g. sit it on a floor plane at `-size.y / 2`) without measuring
   * the bounding box themselves.
   */
  size: THREE.Vector3;
  /** Triangle count, for `assertSceneBudget`. */
  triangles: number;
};

const DEFAULTS = {
  targetRadius: 1,
  shading: 'smooth' as ShadingMode,
  creaseAngleDeg: 40,
};

/**
 * Residency bookkeeping, kept alongside the geometry rather than inside it
 * so `PreparedGeometry` stays a plain value scenes can hold.
 *
 * `refs` starts at **0**, not 1. `useModelGeometry` both builds the entry and
 * then retains it from an effect, so seeding at 1 would leave every entry
 * permanently at 1 after unmount and nothing would ever be evictable.
 *
 * The window between "built" and "retained by the effect" is covered by
 * seeding `releasedAt` to the creation time: a brand-new entry is inside its
 * full grace window, so an `evict()` triggered by some other model loading in
 * that gap cannot take it.
 */
type Entry = {
  prepared: PreparedGeometry;
  refs: number;
  /** `performance.now()` when refs last hit zero; 0 while referenced. */
  releasedAt: number;
  /** `performance.now()` of the last retain — the LRU ordering key. */
  usedAt: number;
};

const cache = new Map<string, Entry>();

const now = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

function cacheKey(url: string, o: Required<PrepareOptions>): string {
  return `${url}|r${o.targetRadius}|${o.shading}|${o.creaseAngleDeg}`;
}

/**
 * Take a reference. Safe to call for a key that has already been evicted —
 * it is a no-op, and the caller will simply rebuild on its next render.
 */
export function retainGeometry(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  entry.refs += 1;
  entry.releasedAt = 0;
  entry.usedAt = now();
}

/** Give a reference back. Never disposes immediately — see the grace window. */
export function releaseGeometry(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs === 0) entry.releasedAt = now();
}

/**
 * Drop least-recently-used entries until residency is back under
 * `PERF_BUDGET.maxCachedTriangles`.
 *
 * Only entries at zero references and past the grace window are candidates,
 * so this can never free a buffer a mounted mesh is drawing from. If nothing
 * is evictable the cache is simply allowed to run over budget — stalling or
 * corrupting a live scene to hit a number would be the worse failure.
 */
function evict(): void {
  let total = 0;
  for (const entry of cache.values()) total += entry.prepared.triangles;
  if (total <= PERF_BUDGET.maxCachedTriangles) return;

  const t = now();
  const candidates = [...cache.entries()]
    .filter(
      ([, e]) =>
        e.refs === 0 && t - e.releasedAt >= PERF_BUDGET.geometryEvictionGraceMs,
    )
    // Oldest use first.
    .sort((a, b) => a[1].usedAt - b[1].usedAt);

  for (const [key, entry] of candidates) {
    if (total <= PERF_BUDGET.maxCachedTriangles) break;
    entry.prepared.geometry.dispose();
    cache.delete(key);
    total -= entry.prepared.triangles;
  }
}

/**
 * Normalise a loaded GLTF into a shared, origin-centred geometry.
 *
 * `url` is only used as the cache key — pass the same string you passed to
 * `loadModel`, or two scenes will each build their own copy.
 */
export function prepareGeometry(
  url: string,
  gltf: GLTF,
  options: PrepareOptions = {},
): PreparedGeometry {
  // Resolve each key explicitly rather than spreading: a caller that
  // destructures optional props passes `undefined`, and object spread lets an
  // explicit `undefined` overwrite a default. That exact mistake produced a
  // NaN environment map elsewhere in this layer; not repeating it here.
  const opts: Required<PrepareOptions> = {
    targetRadius: options.targetRadius ?? DEFAULTS.targetRadius,
    shading: options.shading ?? DEFAULTS.shading,
    creaseAngleDeg: options.creaseAngleDeg ?? DEFAULTS.creaseAngleDeg,
  };
  const key = cacheKey(url, opts);
  const hit = cache.get(key);
  if (hit) {
    hit.usedAt = now();
    return hit.prepared;
  }

  let geom = extractGeometry(gltf);

  // Centre on the origin before scaling, so the scale is about the part's
  // own centroid and not about wherever CAD happened to put the origin.
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    const centre = new THREE.Vector3();
    geom.boundingBox.getCenter(centre);
    geom.translate(-centre.x, -centre.y, -centre.z);
  }

  geom.computeBoundingSphere();
  if (geom.boundingSphere && geom.boundingSphere.radius > 0) {
    const s = opts.targetRadius / geom.boundingSphere.radius;
    geom.scale(s, s, s);
  }

  if (opts.shading === 'creased') {
    // Must run on a geometry that already has positions in final scale;
    // toCreasedNormals returns a new non-indexed geometry, so the original
    // is dead weight from here on.
    const creased = toCreasedNormals(geom, rad(opts.creaseAngleDeg));
    geom.dispose();
    geom = creased;
  } else {
    geom.computeVertexNormals();
  }

  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const size = new THREE.Vector3();
  geom.boundingBox?.getSize(size);

  const index = geom.getIndex();
  const triangles = index
    ? index.count / 3
    : geom.attributes.position.count / 3;

  const prepared: PreparedGeometry = {
    key,
    geometry: geom,
    radius: opts.targetRadius,
    size,
    triangles,
  };

  if (process.env.NODE_ENV !== 'production' && opts.shading === 'creased' && triangles > 200_000) {
    console.warn(
      `[three3] ${url} has ${Math.round(triangles).toLocaleString()} triangles and was prepared with shading:"creased", ` +
        `which de-indexes it (~3x the GPU buffer). Consider shading:"smooth" for anything that is not the hero part.`,
    );
  }

  const t = now();
  cache.set(key, { prepared, refs: 0, releasedAt: t, usedAt: t });
  // Only ever runs on a miss, so the LRU sweep costs nothing on the hot path.
  evict();
  return prepared;
}

/** Total triangles currently held in the cache — dev stats overlay. */
export function getCachedTriangleCount(): number {
  let n = 0;
  for (const e of cache.values()) n += e.prepared.triangles;
  return n;
}

/** Residency snapshot for the dev stats overlay and for tests. */
export function getGeometryResidency(): {
  entries: number;
  referenced: number;
  triangles: number;
  cap: number;
} {
  let referenced = 0;
  let triangles = 0;
  for (const e of cache.values()) {
    if (e.refs > 0) referenced += 1;
    triangles += e.prepared.triangles;
  }
  return {
    entries: cache.size,
    referenced,
    triangles,
    cap: PERF_BUDGET.maxCachedTriangles,
  };
}

/**
 * Dispose every cached geometry and empty the cache. Only safe once no mesh
 * still references them — call it from a route-change effect, after the
 * scene tree has unmounted.
 */
export function clearGeometryCache(): void {
  for (const e of cache.values()) e.prepared.geometry.dispose();
  cache.clear();
}
