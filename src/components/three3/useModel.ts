'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  getModelSnapshot,
  getModelsServerVersion,
  getModelsVersion,
  loadModel,
  subscribeModels,
  type ModelStatus,
} from '@/lib/three/modelCache';
import {
  prepareGeometry,
  releaseGeometry,
  retainGeometry,
  type PreparedGeometry,
  type ShadingMode,
} from '@/lib/three/geometryCache';
import { MODEL_PRIORITY } from '@/lib/three/modelManifest';

/**
 * React bindings for the model + geometry caches.
 *
 * Deliberately NOT Suspense-based, unlike v2's `useLoader`. Two reasons:
 *
 *   - Suspense gives you "loading" and nothing else. The brief calls for
 *     determinate progress, because a spinner with no percentage reads as
 *     broken on a multi-megabyte model, and you cannot render a percentage
 *     from inside a suspended tree.
 *   - A suspending component unmounts its siblings' DOM while it waits,
 *     which on a scroll-pinned section means the pin measurement changes
 *     mid-scroll. Returning a status lets the scene keep its layout and
 *     swap only the mesh.
 *
 * Every hook here reads through `useSyncExternalStore`, so nothing ever
 * calls `setState` from an effect.
 */

export type UseModelOptions = {
  /**
   * Queue position. Use `MODEL_PRIORITY.*` rather than a bare number — the
   * named tiers are what keep four independent scenes from all declaring
   * themselves most important.
   */
  priority?: number;
  /**
   * Set `false` to hold the request. The usual pattern is to leave it true
   * and rely on `<SceneSlot>` only mounting its children on approach.
   */
  enabled?: boolean;
  /** See `PrepareOptions.targetRadius`. Default 1 (unit scale). */
  targetRadius?: number;
  /** See `ShadingMode`. Default `'smooth'`. */
  shading?: ShadingMode;
  /** Crease threshold in degrees when `shading: 'creased'`. Default 40. */
  creaseAngleDeg?: number;
};

export type UseModelResult = {
  /**
   * Cache-owned, origin-centred, normalised geometry — `null` until ready.
   *
   * OWNERSHIP: do not dispose it, and pass `dispose={null}` on the `<mesh>`
   * that consumes it so R3F's unmount cleanup leaves it alone. Several
   * scenes may be sharing this exact instance.
   */
  geometry: PreparedGeometry | null;
  status: ModelStatus | 'idle';
  /** 0–1, byte-accurate from the first chunk. Reaches 1 only when parsed. */
  progress: number;
  error: Error | null;
};

/**
 * Load a GLB and get back a shared, normalised `BufferGeometry`.
 *
 * The URL is fetched at most once per page load no matter how many scenes
 * ask for it, and the expensive dequantize/centre/rescale/normals pass runs
 * at most once per (url, options) pair.
 *
 * @example
 * const { geometry, progress, status } = useModelGeometry(MODELS.i.url, {
 *   priority: MODEL_PRIORITY.hero,
 *   shading: 'creased',
 * });
 *
 * if (!geometry) return <LoadingStandIn progress={progress} />;
 * return (
 *   <mesh geometry={geometry.geometry} dispose={null}>
 *     <ForgedSteelMaterial />
 *   </mesh>
 * );
 */
export function useModelGeometry(
  url: string | null,
  options: UseModelOptions = {},
): UseModelResult {
  const {
    priority = MODEL_PRIORITY.approaching,
    enabled = true,
    targetRadius = 1,
    shading = 'smooth',
    creaseAngleDeg = 40,
  } = options;

  const version = useSyncExternalStore(
    subscribeModels,
    getModelsVersion,
    getModelsServerVersion,
  );

  // Enqueueing is a side effect, not a state update — safe in an effect, and
  // idempotent, so a re-render with the same URL costs nothing.
  useEffect(() => {
    if (!enabled || !url) return;
    void loadModel(url, priority);
  }, [url, enabled, priority]);

  const snapshot = useMemo(
    () => getModelSnapshot(url),
    // `version` is the store's change signal; the lint rule cannot see that
    // it is what makes this recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, version],
  );

  const geometry = useMemo(() => {
    if (!url || !snapshot.gltf) return null;
    return prepareGeometry(url, snapshot.gltf, {
      targetRadius,
      shading,
      creaseAngleDeg,
    });
  }, [url, snapshot.gltf, targetRadius, shading, creaseAngleDeg]);

  // Residency reference. This hook is the only path any scene uses to obtain
  // geometry, which is what makes the cache's LRU eviction safe: an entry can
  // only be freed once every component that mounted it has unmounted, and
  // only after the grace window on top of that.
  const key = geometry?.key;
  useEffect(() => {
    if (!key) return;
    retainGeometry(key);
    return () => releaseGeometry(key);
  }, [key]);

  return {
    geometry,
    status: snapshot.status,
    progress: snapshot.progress,
    error: snapshot.error,
  };
}

