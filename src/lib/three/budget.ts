/**
 * The performance contract for every v3 3D scene.
 *
 * Why this file exists
 * --------------------
 * This project already shipped one lag regression that the client
 * complained about; the fix was cutting the payload 43 MB → 10 MB, and
 * three.js was deleted from the homepage outright. Re-introducing it is
 * only defensible if "fast enough" is a number four different scene
 * authors can check themselves against, not a vibe. Every constant below
 * is an assertable ceiling — `assertSceneBudget()` warns in dev when a
 * scene crosses one, so the cost shows up while the scene is being built
 * rather than in a client email.
 *
 * These are ceilings, not targets. A scene that sits at half of each is
 * the goal.
 */

/** Total bytes a first desktop visit to `/` may transfer. Hard brief limit. */
const MAX_ROUTE_TRANSFER_BYTES = 12 * 1024 * 1024;

export const PERF_BUDGET = {
  /**
   * Total transfer for a first visit to a route, HTML + JS + CSS + fonts +
   * images + any GLB that loads without user scroll. Measure with a cold
   * cache, not by adding up file sizes on disk.
   */
  maxRouteTransferBytes: MAX_ROUTE_TRANSFER_BYTES,

  /**
   * Models allowed to load before the user scrolls. Zero — deliberately.
   * The hero model is fetched *after* first paint via
   * `useModelGeometry({ priority: MODEL_PRIORITY.hero })`, so LCP is a
   * DOM/text paint and the GLB never blocks it.
   */
  maxModelsOnFirstPaint: 0,

  /**
   * Parallel GLB fetches. Meshopt decode is synchronous WebAssembly on the
   * main thread (~20–50 ms for a 1 MB part), so three in flight means three
   * decodes landing in the same frame and a visible hitch. Two keeps the
   * connection busy without stacking decodes.
   */
  maxConcurrentModelLoads: 2,

  /**
   * Device pixel ratio clamp passed to `<Canvas dpr>`. 1 is the floor
   * (below it the brushed-metal specular aliases badly); 2 is the ceiling
   * (3x on a modern phone quadruples fill cost for no perceptible gain on
   * a 5" screen). `SceneCanvas` walks *within* this range under load.
   */
  dpr: [1, 2] as [min: number, max: number],

  /**
   * Frame budget in milliseconds. 16.7 ms is 60 fps; the adaptive DPR
   * controller starts shedding resolution when the rolling average
   * crosses it.
   */
  targetFrameMs: 1000 / 60,

  /**
   * Triangles drawn per frame across *all* visible slots combined. The
   * forged parts are dense CAD tessellations — `part-i` alone is ~1 MB
   * compressed — so two of them on screen at once is already most of this.
   */
  maxTrianglesPerFrame: 900_000,

  /**
   * Draw calls per frame across all visible slots. Each `<SceneSlot>` is a
   * separate `gl.render()` pass, so slots are not free: budget ~20 calls
   * per visible slot and no more than 4 visible slots.
   */
  maxDrawCallsPerFrame: 120,

  /** Slots allowed to be on screen (and therefore rendering) at once. */
  maxVisibleSlots: 4,

  /**
   * Live `WebGLProgram`s. Every distinct material configuration compiles a
   * shader, and compilation is a main-thread stall of several ms. Scenes
   * should share `<ForgedSteelMaterial>` rather than hand-rolling variants.
   */
  maxPrograms: 24,

  /**
   * Triangles allowed to stay resident in the geometry cache across a whole
   * session, summed over every prepared geometry whether or not it is on
   * screen.
   *
   * A **residency** ceiling, not a per-frame one — `geometryCache` evicts
   * least-recently-used entries above it. It exists because the cache is
   * module-global and survives SPA navigation: unbounded, a visitor
   * wandering `/ → /solutions → /renders → /renders/a → /about` accumulates
   * every part they have scrolled past for the rest of the session.
   *
   * V3-DIRECTION §3.5 asks for "3 loaded GLBs live at any moment". That
   * number is deliberately NOT what is implemented: `/solutions` alone holds
   * four parts (263k triangles measured), so a hard cap of 3 would dispose
   * and re-parse a 1 MB GLB every time the visitor scrolled back up a
   * section — trading a memory problem nobody has for a main-thread hitch
   * everybody would feel. 1.5M triangles is roughly six typical parts;
   * measured residency on the heaviest route today is ~18% of it. Lower this
   * one constant if a real device ever runs short.
   *
   * Eviction NEVER touches geometry a mounted mesh is still using — see the
   * reference counting in `geometryCache`.
   */
  maxCachedTriangles: 1_500_000,

  /**
   * How long a geometry must sit at zero references before it may be
   * evicted, in milliseconds.
   *
   * Two jobs. It stops a scrub that swaps parts back and forth from
   * thrashing the cache (a §4.3 HANDOFF completes in 420 ms). And it removes
   * the disposal hazard: a scene may hold the previous geometry in a ref for
   * a frame or two after React has unmounted its mesh — `StageScene` does
   * exactly that across a handoff — and nothing can be disposed inside that
   * window.
   */
  geometryEvictionGraceMs: 5_000,
} as const;

/** Shape of `WebGLRenderer.info` we care about, narrowed for the assertion. */
export type SceneCostSample = {
  triangles: number;
  drawCalls: number;
  programs: number;
  visibleSlots: number;
};

/**
 * Dev-only budget check. Call it with a `gl.info` sample; it warns once per
 * violated key so a busy frame doesn't flood the console. Returns the list
 * of violated keys so a caller (the stats overlay) can surface them
 * visually too.
 *
 * No-ops in production — the string building alone is not worth shipping.
 */
const warned = new Set<string>();

export function assertSceneBudget(sample: SceneCostSample): string[] {
  const violations: string[] = [];
  if (sample.triangles > PERF_BUDGET.maxTrianglesPerFrame) {
    violations.push(
      `triangles ${sample.triangles.toLocaleString()} > ${PERF_BUDGET.maxTrianglesPerFrame.toLocaleString()}`,
    );
  }
  if (sample.drawCalls > PERF_BUDGET.maxDrawCallsPerFrame) {
    violations.push(
      `drawCalls ${sample.drawCalls} > ${PERF_BUDGET.maxDrawCallsPerFrame}`,
    );
  }
  if (sample.programs > PERF_BUDGET.maxPrograms) {
    violations.push(`programs ${sample.programs} > ${PERF_BUDGET.maxPrograms}`);
  }
  if (sample.visibleSlots > PERF_BUDGET.maxVisibleSlots) {
    violations.push(
      `visibleSlots ${sample.visibleSlots} > ${PERF_BUDGET.maxVisibleSlots}`,
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    for (const v of violations) {
      const key = v.split(' ')[0];
      if (warned.has(key)) continue;
      warned.add(key);
      console.warn(
        `[three3] scene over budget: ${v}. See PERF_BUDGET in src/lib/three/budget.ts.`,
      );
    }
  }

  return violations;
}
