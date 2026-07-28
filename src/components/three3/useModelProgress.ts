'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  getAggregateSnapshot,
  getModelsServerVersion,
  getModelsVersion,
  preloadModel,
  subscribeModels,
} from '@/lib/three/modelCache';
import { MODEL_PRIORITY } from '@/lib/three/modelManifest';

/**
 * The two model hooks a *DOM* component needs: a progress readout, and a
 * preload trigger.
 *
 * Split out of `useModel.ts` because that file pulls the geometry cache and
 * therefore three.js. A percentage under a hero headline, or a hover handler
 * that warms the next part, must not cost the visitor a renderer download —
 * so these two live here, where the only dependency is the (three-free)
 * model queue.
 */

const NO_URLS: readonly string[] = [];

/**
 * Byte-weighted aggregate progress across several models — what a section's
 * "42%" readout should bind to.
 *
 * Weighted by bytes rather than by count, so a 1 MB part finishing does not
 * report the same as a 250 KB one and the bar neither stalls nor jumps.
 * `progress` is meaningful from the very first chunk because the expected
 * sizes come from `modelManifest`, not from a `Content-Length` that may not
 * be there.
 *
 * @example
 * const { active, progress } = useModelProgress([MODELS.a.url]);
 * {active && <span className="text-ember">{Math.round(progress * 100)}%</span>}
 */
export function useModelProgress(urls: readonly string[] = NO_URLS) {
  const version = useSyncExternalStore(
    subscribeModels,
    getModelsVersion,
    getModelsServerVersion,
  );
  const key = urls.join('|');
  return useMemo(
    () => getAggregateSnapshot(urls),
    // `version` is the store's change signal and `key` stands in for the
    // array's identity; the exhaustive-deps rule can see neither.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, version],
  );
}

/**
 * Warm the cache on intent.
 *
 * Call with `when: true` at the moment the visitor signals where they are
 * going — a thumbnail hover, a slot entering its approach margin, a carousel
 * arming its next slide. Never with `when: true` on mount for something
 * below the fold; that is eager loading with extra steps.
 *
 * @example
 * const [hovered, setHovered] = useState(false);
 * usePreloadModels([MODELS.c.url], { when: hovered });
 */
export function usePreloadModels(
  urls: readonly string[],
  { when = true, priority = MODEL_PRIORITY.intent } = {},
): void {
  const key = urls.join('|');
  useEffect(() => {
    if (!when || !key) return;
    for (const url of key.split('|')) preloadModel(url, priority);
  }, [key, when, priority]);
}
