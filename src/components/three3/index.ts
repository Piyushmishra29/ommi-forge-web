/**
 * DOM-side API of the v3 3D engine — the half a page component imports.
 *
 * THIS MODULE PULLS NO THREE.JS. That is a hard invariant, not a happy
 * accident: `<Scene3DProvider>` and `<SceneSlot>` are rendered by every page
 * that shows 3D, so anything they import lands in the first-paint chunk. The
 * renderer, drei and the scene primitives are all behind dynamic imports,
 * which is what makes "nothing 3D on first paint" true at the bundle level
 * and not merely on the network.
 *
 * The canvas-side primitives (materials, lights, environment, frame hooks)
 * live in `./scene`, which DOES pull three. Import them only from a module
 * that is itself lazily loaded — see the README's "Required pattern".
 *
 * If you add an export here, check what it drags in first.
 */

/* --- Canvas host ---------------------------------------------------------- */
export { Scene3DProvider, useScene3D } from './Scene3DProvider';
export type {
  Scene3DProviderProps,
  Scene3DContextValue,
  WebGLState,
} from './Scene3DProvider';

export { SceneSlot } from './SceneSlot';
export type { SceneSlotProps } from './SceneSlot';

export { dynamicScene } from './dynamicScene';

/* --- Scroll bridge (gsap only, no three) ---------------------------------- */
export { useScrollProgress } from './useScrollProgress';
export type { ScrollProgressOptions } from './useScrollProgress';

/* --- Model queue (loader is dynamically imported inside) ------------------ */
export {
  MODELS,
  MODEL_PRIORITY,
  ALL_MODELS_BYTES,
  modelBytes,
} from '@/lib/three/modelManifest';
export type { ModelKey, ModelEntry } from '@/lib/three/modelManifest';

export { loadModel, preloadModel, clearModelCache } from '@/lib/three/modelCache';
export type { ModelStatus } from '@/lib/three/modelCache';

export { useModelProgress, usePreloadModels } from './useModelProgress';

/* --- Material states (pure data, no three.js) ----------------------------- */
export {
  AS_FORGED,
  MACHINED,
  SHIPPED,
  MATERIAL_STATES,
} from '@/lib/three/materialStates';
export type { ForgedSteelState } from '@/lib/three/materialStates';

/* --- Budget + maths (pure) ------------------------------------------------ */
export { PERF_BUDGET, assertSceneBudget } from '@/lib/three/budget';
export { FRAME_PRIORITY, MAX_FRAME_DELTA } from '@/lib/three/framePriority';
export {
  clamp,
  damp,
  damp3,
  lerp,
  mapRange,
  rad,
  saturate,
  smoothstep,
} from '@/lib/three/math';
export type { QualityTier, SceneStore } from '@/lib/three/sceneStore';
