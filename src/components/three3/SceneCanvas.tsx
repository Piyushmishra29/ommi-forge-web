'use client';

import { useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, View } from '@react-three/drei';
import { gsap } from '@/lib/gsap';
import { CanvasErrorBoundary } from '@/components/three/CanvasErrorBoundary';
import { PERF_BUDGET } from '@/lib/three/budget';
import { FRAME_PRIORITY } from '@/lib/three/framePriority';
import { getCachedTriangleCount } from '@/lib/three/geometryCache';
import {
  getLoadedBytes,
  getReadyModelCount,
  subscribeModels,
} from '@/lib/three/modelCache';
import { clamp, lerp } from '@/lib/three/math';
import type { SceneStore } from '@/lib/three/sceneStore';
import { useScene3D } from './Scene3DProvider';
import { publishStats } from './SceneStats';

/* -------------------------------------------------------------------------- */
/*  Frame prologue                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Clears the drawing buffer once per frame and restores full-viewport state.
 *
 * drei's `<View>` sets `autoClear = false` and a scissor rect around each of
 * its draws and never clears the canvas as a whole, so without this the
 * previous frame's pixels persist wherever no slot is currently painting —
 * a smear trailing behind anything that moves. It also leaves the GL
 * viewport set to the last slot's box, which would give a stray root-scene
 * render the wrong dimensions.
 *
 * `gl.info.reset()` moves here too: `info` normally resets itself at the
 * start of every `render()` call, so with N slots the numbers would only
 * ever describe the last one. With `autoReset = false` (set in `onCreated`)
 * and a manual reset here, the counters accumulate across all slots and
 * describe the whole frame.
 */
function FramePrologue() {
  useFrame((state) => {
    state.gl.info.reset();
    state.gl.setScissorTest(false);
    state.gl.setViewport(0, 0, state.size.width, state.size.height);
    state.gl.clear(true, true, true);
  }, FRAME_PRIORITY.prologue);
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Frame driver                                                              */
/* -------------------------------------------------------------------------- */

type DriverProps = { store: SceneStore; motion: boolean };

/**
 * The single reason `frameloop="never"` is safe: this drives every frame by
 * hand, from GSAP's ticker.
 *
 * Two things fall out of that, both of them requirements rather than
 * niceties:
 *
 * 1. **Nothing renders while nothing is visible.** No slot on screen, or a
 *    hidden tab, means `advance()` is simply not called — zero WebGL work,
 *    zero scene callbacks, no `requestAnimationFrame` of our own. This is
 *    the failure mode that produced the lag complaint on this project once
 *    already, so it is enforced at the driver rather than trusted to each
 *    scene.
 * 2. **Scroll and scene share one frame.** Lenis already runs on GSAP's
 *    ticker (`LenisProvider`), and ScrollTrigger updates from Lenis' scroll
 *    event. Advancing three from the same ticker, appended after those,
 *    means each slot's scissor rectangle is measured from a layout that has
 *    already absorbed this frame's scroll — instead of trailing it by one
 *    frame, which reads as the 3D "sliding" against the page.
 *
 * Under reduced motion the loop is demand-driven instead: it advances only
 * when something actually changed (a model finished, the viewport resized,
 * the user scrolled and the slot rectangles moved). The scene is still
 * fully rendered and fully present — it just does not animate.
 */
function FrameDriver({ store, motion }: DriverProps) {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    const tick = (time: number) => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (store.getVisibleCount() === 0) return;
      if (!motion && !store.consumeRenderRequest()) return;
      // GSAP hands out seconds; R3F wants a monotonic millisecond stamp.
      advance(time * 1000);
    };

    // Appended (not prioritised) so it runs after Lenis' raf and
    // ScrollTrigger.update for this tick.
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [advance, motion, store]);

  // In demand mode the rectangles still move whenever the page scrolls or
  // resizes, so those events have to ask for a frame. Passive listeners:
  // they must never delay the scroll itself.
  useEffect(() => {
    if (motion) return;
    const request = () => store.requestRender();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, [motion, store]);

  // The single most important demand-mode trigger: a model finishing.
  // Without this, a reduced-motion visitor gets the frames that fire while
  // the slot is appearing — all of them before the GLB has arrived — and
  // then an idle loop forever. The part loads, nothing repaints, and the
  // section is a blank rectangle. That is precisely the "reduced-motion
  // users lose content" failure the v2 pass hit twice, so it is wired here
  // in the engine rather than left to each scene to remember.
  useEffect(() => subscribeModels(() => store.requestRender()), [store]);

  // A tab returning to the foreground needs a frame to repaint what the
  // (cleared) buffer lost while we were idle.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) store.requestRender();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [store]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Adaptive quality                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Walks device pixel ratio down when frames start costing more than
 * `PERF_BUDGET.targetFrameMs`, and back up when they stop.
 *
 * DPR is the right first lever because fill rate is what a metal shader with
 * an environment map actually spends its time on, and because dropping it is
 * invisible in motion and instantly reversible — unlike shedding geometry.
 * Steps are quantised to 0.25 so a borderline machine doesn't thrash the
 * renderer's resize path every few frames.
 *
 * Only mounted when motion is enabled: in demand-driven (reduced-motion)
 * mode frames are minutes apart, and a monitor sampling that would read it
 * as 0 fps and bottom out the quality for no reason.
 */
function AdaptiveQuality({ store }: { store: SceneStore }) {
  const setDpr = useThree((s) => s.setDpr);
  const [min, max] = PERF_BUDGET.dpr;

  const apply = (factor: number) => {
    const ceiling = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      max,
    );
    const raw = lerp(min, ceiling, clamp(factor, 0, 1));
    const next = Math.round(raw * 4) / 4;
    if (next === store.getDpr()) return;
    store.setDpr(next);
    store.setQuality(factor >= 0.75 ? 'high' : factor >= 0.4 ? 'medium' : 'low');
    setDpr(next);
  };

  return (
    <PerformanceMonitor
      // Start at full quality and only come down if measurements say so;
      // drei's default of 0.5 would ship every visitor a soft first frame.
      factor={1}
      bounds={(refreshRate) => [
        // Lower bound: the frame budget. Upper: 90% of the display's own
        // refresh rate, so a 120 Hz panel isn't judged against 60.
        1000 / PERF_BUDGET.targetFrameMs - 6,
        Math.max(refreshRate * 0.9, 55),
      ]}
      onChange={({ factor }) => apply(factor)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats + context guard                                                     */
/* -------------------------------------------------------------------------- */

function StatsCollector({ store }: { store: SceneStore }) {
  useFrame((state) => {
    publishStats({
      triangles: state.gl.info.render.triangles,
      drawCalls: state.gl.info.render.calls,
      programs: state.gl.info.programs?.length ?? 0,
      geometries: state.gl.info.memory.geometries,
      textures: state.gl.info.memory.textures,
      visibleSlots: store.getVisibleCount(),
      dpr: store.getDpr(),
      quality: store.getQuality(),
      modelBytes: getLoadedBytes(),
      modelsReady: getReadyModelCount(),
      cachedTriangles: getCachedTriangleCount(),
    });
  }, FRAME_PRIORITY.epilogue);
  return null;
}

/**
 * Turns raw `webglcontextlost` / `webglcontextrestored` into provider state.
 *
 * `preventDefault()` on the loss event is what makes restoration possible at
 * all — without it the browser never fires `webglcontextrestored` and the
 * page is permanently dead. Context loss is not exotic: a GPU driver reset,
 * a laptop switching graphics, or simply opening too many WebGL tabs will do
 * it, and the page has to come back rather than sit on a blank rectangle.
 *
 * `THREE.WebGLRenderer: Context Lost.` in the console on SPA nav away from a
 * 3D route is NOT this, and is not a defect. R3F's
 * `unmountComponentAtNode` deliberately calls `gl.forceContextLoss()` while
 * disposing a root (`@react-three/fiber` dist, in the `setTimeout` after
 * `reconciler.updateContainer(null, …)`), and three logs that from its own
 * internal `webglcontextlost` handler. It fires exactly once per canvas
 * unmount. The listener below is already removed by then — React runs this
 * effect's cleanup during `updateContainer`, before the deferred
 * `forceContextLoss` — so a teardown never flips the provider to `lost` and
 * never shows a fallback. One log per unmount, zero on mount, one canvas per
 * route: expected teardown noise.
 */
function ContextGuard() {
  const gl = useThree((s) => s.gl);
  const { reportContextLost, reportContextRestored } = useScene3D();

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      reportContextLost();
    };
    const onRestored = () => reportContextRestored();
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl, reportContextLost, reportContextRestored]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Host                                                                      */
/* -------------------------------------------------------------------------- */

export type SceneCanvasProps = {
  store: SceneStore;
  motion: boolean;
  zIndex: number;
};

/**
 * The one `<Canvas>` for the route.
 *
 * It is fixed to the viewport and never scrolls; slots do not each get a
 * canvas, they get a *rectangle of this one*. That is the whole reason the
 * v3 site can show 3D in five places without five WebGL contexts (and
 * without the context-limit eviction that produces on Safari).
 *
 * Rendered only by `<Scene3DProvider>`. Scene authors never mount this.
 */
export function SceneCanvas({ store, motion, zIndex }: SceneCanvasProps) {
  const { reportCanvasError } = useScene3D();

  return (
    <CanvasErrorBoundary fallback={null} onError={reportCanvasError}>
      <div
        // Inert to assistive tech and to the pointer. Every accessible name,
        // description and interactive control belongs to the DOM slot boxes,
        // which sit in normal document flow where AT can find them.
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ zIndex }}
      >
        <Canvas
          // Hand-driven: see <FrameDriver>. Nothing renders unless a slot is
          // on screen and the tab is visible.
          frameloop="never"
          dpr={PERF_BUDGET.dpr}
          // Enables `gl.shadowMap` so `<ForgeLights shadows>` is a real prop
          // rather than a silent no-op — v3-showroom found it was the latter
          // and had to document the workaround. Costs nothing while no light
          // casts: three skips the shadow pass entirely when there are no
          // shadow-casting lights, and materials only compile `USE_SHADOWMAP`
          // once one exists. Opt-in per scene, and still discouraged with
          // several slots on screen (one shadow pass per slot that draws).
          shadows="soft"
          // Transparent so the canvas only paints where a slot draws; the
          // rest of the page shows through untouched.
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            // The page is a static export served over a CDN; there is no
            // canvas read-back anywhere, so we let the browser discard the
            // buffer after compositing.
            preserveDrawingBuffer: false,
          }}
          camera={{ position: [0, 0, 5], fov: 35, near: 0.1, far: 100 }}
          // R3F wraps the canvas in its own div and hard-sets
          // `pointer-events: auto` on it, which overrides the
          // `pointer-events-none` on the fixed parent — the canvas would then
          // sit over the entire page swallowing every click. Setting it here
          // puts it on R3F's own wrapper. Slots still get pointer events,
          // because drei's `<View>` rebinds the event source to each tracked
          // DOM element rather than to the canvas.
          style={{ pointerEvents: 'none' }}
          onCreated={(state) => {
            state.gl.setClearAlpha(0);
            // Accumulate `info` across every slot's draw — reset by hand in
            // <FramePrologue>.
            state.gl.info.autoReset = false;
            store.setDpr(state.viewport.dpr);
          }}
        >
          <FramePrologue />
          <ContextGuard />
          <FrameDriver store={store} motion={motion} />
          {motion && <AdaptiveQuality store={store} />}
          <StatsCollector store={store} />
          {/* Every <SceneSlot>'s 3D children land here. */}
          <View.Port />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}

export default SceneCanvas;
