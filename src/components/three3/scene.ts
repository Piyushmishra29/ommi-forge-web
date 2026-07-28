/**
 * Canvas-side API — everything that runs *inside* a `<SceneSlot>`.
 *
 * THIS MODULE PULLS THREE.JS, deliberately. Import it only from a scene body
 * that is itself lazily loaded via `dynamicScene()`; importing it from a page
 * component puts the renderer in that route's first-paint chunk and undoes
 * the engine's laziness. See the README's "Required pattern".
 *
 * The DOM-side half — provider, slot, progress readouts, preloading, maths —
 * is in `./index` and costs no three.js.
 */

/* --- Frame loop ----------------------------------------------------------- */
export {
  useSceneFrame,
  useScenePose,
  useSceneMotion,
  useSceneQuality,
  useRequestRender,
} from './useSceneFrame';
export type { SceneFrameCallback, SceneFrameOptions } from './useSceneFrame';

export { useSlot, useOptionalSlot } from './SlotContext';
export type { SlotApi } from './SlotContext';

/* --- Models --------------------------------------------------------------- */
export { useModelGeometry } from './useModel';
export type { UseModelOptions, UseModelResult } from './useModel';

export { ForgedPart } from './ForgedPart';
export type { ForgedPartProps } from './ForgedPart';

export {
  clearGeometryCache,
  getGeometryResidency,
  retainGeometry,
  releaseGeometry,
} from '@/lib/three/geometryCache';
export type {
  PreparedGeometry,
  PrepareOptions,
  ShadingMode,
} from '@/lib/three/geometryCache';

/* --- Look ----------------------------------------------------------------- */
export { ForgeEnvironment, getForgeEnvironment } from './ForgeEnvironment';
export type {
  ForgeEnvironmentProps,
  ForgeEnvironmentOptions,
} from './ForgeEnvironment';

export { ForgeLights } from './ForgeLights';
export type { ForgeLightsProps, ForgeLightPreset } from './ForgeLights';

export {
  ForgedSteelMaterial,
  AS_FORGED,
  MACHINED,
  SHIPPED,
  FORGED_STEEL,
} from './ForgedSteelMaterial';
export type {
  ForgedSteelMaterialProps,
  ForgedSteelState,
} from './ForgedSteelMaterial';

/* --- Re-exported for convenience inside scenes (no extra cost here) ------- */
export { MODELS, MODEL_PRIORITY } from '@/lib/three/modelManifest';
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
