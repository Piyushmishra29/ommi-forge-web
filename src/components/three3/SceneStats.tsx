'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  PERF_BUDGET,
  assertSceneBudget,
  type SceneCostSample,
} from '@/lib/three/budget';
import type { QualityTier } from '@/lib/three/sceneStore';

/**
 * Dev-only cost readout for the shared canvas.
 *
 * Why this exists
 * ---------------
 * Four people are building scenes on top of one renderer and one frame
 * budget. Without a number on screen, "my section feels fine on my machine"
 * is the only available signal, and the sum of four such judgements is how a
 * 43 MB homepage happens. This puts triangles, draw calls, DPR and
 * transferred bytes where the person writing the scene can see them, and
 * turns them red the moment they cross `PERF_BUDGET`.
 *
 * Enabling it (it is off by default, everywhere):
 *   - append `?stats=1` to any URL, or
 *   - set `NEXT_PUBLIC_SCENE_STATS=1` in `.env.local`.
 *
 * The overlay is never rendered without one of those, so the production
 * bundle carries only this file's ~2 KB and never mounts it.
 */

export type SceneStatsSample = SceneCostSample & {
  geometries: number;
  textures: number;
  dpr: number;
  quality: QualityTier;
  /** Bytes of GLB actually transferred so far. */
  modelBytes: number;
  /** Models finished parsing. */
  modelsReady: number;
  /** Triangles held in the geometry cache (not necessarily all drawn). */
  cachedTriangles: number;
};

/**
 * NOTE: this file must stay free of any three.js import, direct or
 * transitive. It is rendered by `<Scene3DProvider>`, which every page mounts,
 * so a single `import … from 'three'` here would put the whole renderer in
 * the first-paint chunk. The model/geometry numbers are therefore *pushed*
 * in from `<StatsCollector>` (which is already inside the canvas) rather
 * than pulled from the caches.
 */

/**
 * Mutable sink written once per frame from inside the canvas. Deliberately
 * NOT React state: at 120 fps a `setState` per frame would cost more than
 * everything it is measuring.
 */
const latest: SceneStatsSample = {
  triangles: 0,
  drawCalls: 0,
  programs: 0,
  visibleSlots: 0,
  geometries: 0,
  textures: 0,
  dpr: 1,
  quality: 'high',
  modelBytes: 0,
  modelsReady: 0,
  cachedTriangles: 0,
};

let frameCount = 0;

/** Called from `<StatsCollector>` at the end of every rendered frame. */
export function publishStats(sample: SceneStatsSample): void {
  Object.assign(latest, sample);
  frameCount += 1;
}

/** True when the overlay should mount. Safe to call during render. */
function statsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_SCENE_STATS === '1') return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('stats') === '1';
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Row = { label: string; value: string; over: boolean };

/**
 * Fixed corner panel. Samples four times a second — fast enough to watch a
 * scroll transition, slow enough that the overlay is not itself the cost.
 */
const NO_SUBSCRIBE = () => () => {};

export function SceneStats() {
  // Reading `location` has to happen after mount or the static export and
  // the hydrated tree disagree — `useSyncExternalStore` gives exactly that
  // (server snapshot `false`, real value once hydrated) without a setState
  // inside an effect.
  const enabled = useSyncExternalStore(NO_SUBSCRIBE, statsEnabled, () => false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let lastTime = performance.now();
    let lastFrames = frameCount;

    const id = window.setInterval(() => {
      const now = performance.now();
      const measured = ((frameCount - lastFrames) * 1000) / (now - lastTime);
      lastTime = now;
      lastFrames = frameCount;
      setFps(Math.round(measured));

      const violations = assertSceneBudget(latest);
      const over = (key: string) => violations.some((v) => v.startsWith(key));

      setRows([
        {
          label: 'triangles',
          value: `${Math.round(latest.triangles).toLocaleString()} / ${PERF_BUDGET.maxTrianglesPerFrame.toLocaleString()}`,
          over: over('triangles'),
        },
        {
          label: 'draw calls',
          value: `${latest.drawCalls} / ${PERF_BUDGET.maxDrawCallsPerFrame}`,
          over: over('drawCalls'),
        },
        {
          label: 'programs',
          value: `${latest.programs} / ${PERF_BUDGET.maxPrograms}`,
          over: over('programs'),
        },
        {
          label: 'slots visible',
          value: `${latest.visibleSlots} / ${PERF_BUDGET.maxVisibleSlots}`,
          over: over('visibleSlots'),
        },
        { label: 'dpr', value: latest.dpr.toFixed(2), over: false },
        { label: 'quality', value: latest.quality, over: false },
        {
          label: 'geo / tex',
          value: `${latest.geometries} / ${latest.textures}`,
          over: false,
        },
        {
          label: 'models ready',
          value: String(latest.modelsReady),
          over: false,
        },
        {
          label: 'model bytes',
          value: formatMB(latest.modelBytes),
          over: latest.modelBytes > PERF_BUDGET.maxRouteTransferBytes,
        },
        {
          label: 'cached tris',
          value: Math.round(latest.cachedTriangles).toLocaleString(),
          over: false,
        },
      ]);
    }, 250);

    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 left-3 z-[1001] min-w-[220px] rounded bg-graphite/90 px-3 py-2 font-mono text-[10px] leading-[1.6] text-paper backdrop-blur"
    >
      <div className="mb-1 flex items-baseline justify-between border-b border-paper/20 pb-1 uppercase tracking-[0.18em]">
        <span>three3</span>
        <span className={fps > 0 && fps < 50 ? 'text-saffron' : ''}>
          {fps} fps
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4">
          <span className="opacity-60">{row.label}</span>
          <span className={row.over ? 'text-saffron' : ''}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export default SceneStats;
