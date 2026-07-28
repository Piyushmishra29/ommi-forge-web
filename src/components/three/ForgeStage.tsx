'use client';

import { ForgeEnvironment, ForgeLights } from '@/components/three3/scene';
import type { PosterState } from '@/lib/posters';
import { STAGE_ENV, STAGE_ENV_INTENSITY } from './stage-rig';

export type ForgeStageProps = {
  /** Master exposure over the analytic rig only. Rarely needed. */
  intensity?: number;
  /**
   * @deprecated NO LONGER DOES ANYTHING — safe to delete from your call.
   *
   * Both §3.2 states now share this rig; see the component doc for the two
   * fixes that collapsed the difference and the measurements behind them.
   * The prop is retained only so existing callers keep compiling, and it is
   * documented as a no-op rather than quietly honoured, because a prop that
   * looks like it changes the lighting and does not is worse than no prop.
   *
   * The material is what varies by state: `<ForgedSteelMaterial state=…>`.
   */
  state?: PosterState;
};

/**
 * Environment + analytic lights for a forged part, as one R3F node.
 *
 * CANVAS-SIDE. It imports `three3/scene`, which pulls three.js — so it may
 * only be rendered from a module that is itself lazily loaded (a
 * `dynamicScene()` body, or a component already behind `next/dynamic` like
 * `StlViewer`). Importing it from a page component would put the renderer in
 * that route's first-paint chunk.
 *
 * NO PER-STATE VARIANT, and that is the interesting part. This briefly took
 * a `state` prop that swapped in a doubled exposure and a rim at 0.4 for
 * as-forged parts. Two fixes elsewhere removed the need: `coolColor`
 * returning to a cool tone killed the orange cast at source (it was never an
 * as-forged problem — machined had it worse), and `AS_FORGED.metalness`
 * dropping to 0.75 restored the diffuse term that was making those parts
 * dark. Both §3.2 states now share one environment and one light rig and
 * differ only in their material, which is `<ForgedSteelMaterial state=…>`'s
 * job, not this component's. See `stage-rig.ts` for the measurements.
 *
 * `<ForgeLights>` with no props is §3.3's table verbatim.
 *
 * @example
 * <SceneSlot …>
 *   <ForgeStage />
 *   <ForgedPart url={MODELS.g.url} />
 * </SceneSlot>
 */
export function ForgeStage({ intensity = 1 }: ForgeStageProps) {
  // `state` is intentionally destructured nowhere — see its doc comment.
  return (
    <>
      <ForgeEnvironment {...STAGE_ENV} intensity={STAGE_ENV_INTENSITY} />
      <ForgeLights intensity={intensity} />
    </>
  );
}

export default ForgeStage;
