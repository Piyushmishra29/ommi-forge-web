'use client';

import { useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  ForgedSteelMaterial,
  MODEL_PRIORITY,
  clamp,
  damp,
  useModelGeometry,
  useScenePose,
  useSceneMotion,
} from '@/components/three3/scene';
import ForgeStage from '@/components/three/ForgeStage';
import {
  HANDOFF_TRAVEL,
  INDEX_SWEEP_RAD,
  STAGE_CAMERA,
  poseFor,
} from '@/components/three/stage-rig';

export type StageSceneProps = {
  /** GLB currently on the stage. Changing it is a HANDOFF, not a swap. */
  modelUrl: string;
  /**
   * True while the outgoing part is travelling off-frame. The DOM side owns
   * this timing (see `RendersShowroom`) so the geometry swap can be timed to
   * land while the part is out of shot.
   */
  exiting: boolean;
  /** 0–1 scroll position of the section, from `useScrollProgress`. */
  progress: RefObject<number>;
};

/**
 * The `/renders` hub stage (§5.6) — **one** part, in **one** canvas, behind
 * a grid of nine static posters.
 *
 * Nine `<Canvas>` tiles would be nine WebGL contexts, which is instant
 * context loss on the browser's 8–16 context cap and the exact regression
 * this project already shipped once. So the grid is images and this is the
 * only live 3D on the route.
 *
 * Two verbs, both from §4.3, and nothing else:
 *
 * **INDEX** — the part turns about its Y axis, scroll-mapped, over a sweep
 * centred on its resting pose (see `INDEX_SWEEP_RAD` for the angle and why
 * it is not the full 220°). It runs in `useScenePose`, not `useSceneFrame`,
 * so a reduced-motion visitor gets a correctly-posed part rather than a
 * scene frozen at frame one — the bug class the v2 pass found twice.
 *
 * **HANDOFF** — the outgoing part exits +X, the geometry is swapped while it
 * is off-frame, the incoming part enters from −X. Never a crossfade: two
 * parts at 50% opacity is the tell of a fake transition (§6.20).
 */
export default function StageScene({ modelUrl, exiting, progress }: StageSceneProps) {
  /** Outer: travels along X for the handoff, and carries the INDEX sweep. */
  const spin = useRef<THREE.Group>(null);
  const motion = useSceneMotion();

  const { geometry } = useModelGeometry(modelUrl, {
    priority: MODEL_PRIORITY.hero,
    // 'smooth', not 'creased'. Creased de-indexes the geometry for ~3x the
    // GPU buffer, and the visitor can promote any of nine parts onto this
    // stage — paying that nine times over a session is not worth the edge
    // definition on a part this size. It also keeps the stage identical to
    // the offline poster, which is rendered smooth.
    shading: 'smooth',
  });

  /** Signed X offset. Damped toward its target every posed frame. */
  const offset = useRef(0);
  /** Geometry identity we last saw, so an arrival can be detected. */
  const lastGeometry = useRef<THREE.BufferGeometry | null>(null);

  useScenePose((_, delta) => {
    const node = spin.current;
    if (!node) return;

    // A new part exists: put it off-frame on the far side so it *enters*
    // rather than materialising in place. Keyed on geometry rather than on
    // the URL because the URL changes the moment the visitor dwells, while
    // the mesh only exists once the GLB has landed — sometimes several
    // hundred milliseconds later.
    if (geometry && lastGeometry.current !== geometry.geometry) {
      lastGeometry.current = geometry.geometry;
      offset.current = -HANDOFF_TRAVEL;
    }

    const target = exiting ? HANDOFF_TRAVEL : 0;
    // Snap when the visitor asked for no motion — the part must still be
    // in the right place, it just does not travel there.
    offset.current = motion ? damp(offset.current, target, 7, delta) : target;
    node.position.x = offset.current;

    // INDEX about WORLD Y, on the parent of the framing pose — never added
    // into the pose's own Euler. `rotation.set(px, py + index, pz)` composes
    // as Rx·Ry·Rz, so the Y term turns about the part's *tilted* axis: the
    // part wobbles instead of turning, swelling and flattening as it goes.
    // Measured across this sweep, presented height varied by ~46px per part
    // that way and by ~7px this way; the Steam Manifold swung 85px to 219px,
    // a 2.6x change in apparent size. A parent rotated about world Y is
    // literally §4.3's "part on an inspection turntable".
    //
    // Centred on the resting pose, so the middle of the section shows the
    // part exactly as its poster framed it and the sweep runs ±half either
    // side. See INDEX_SWEEP_RAD for why the range is not the full 220°.
    node.rotation.y = (clamp(progress.current, 0, 1) - 0.5) * INDEX_SWEEP_RAD;
  });

  const pose = poseFor(modelUrl);

  return (
    <>
      {/* Per-slot camera at §3.3's fov 32, rather than inheriting the shared
          canvas's 35. drei's `<View>` portals its own R3F store, so
          `makeDefault` scopes to this slot and cannot reach another section's
          viewport — which is what lets `/solutions` and `/about` each run
          their own camera move on the same canvas. Matching their fov is what
          makes a part the same size across the whole site. */}
      <PerspectiveCamera
        makeDefault
        fov={STAGE_CAMERA.fov}
        position={[...STAGE_CAMERA.position]}
        near={STAGE_CAMERA.near}
        far={STAGE_CAMERA.far}
      />
      <ForgeStage />
      {/* Outer group: world-Y turntable + handoff travel. */}
      <group ref={spin}>
        {/* Inner group: the part's framing pose, fixed. Nesting it INSIDE the
            spin is what makes the sweep a turntable rather than a wobble. */}
        <group rotation={[pose[0], pose[1], pose[2]]}>
          {geometry ? (
            // `dispose={null}`: the geometry belongs to the shared cache, and
            // R3F's unmount cleanup would otherwise dispose a buffer the next
            // part's arrival still expects to find there.
            <mesh geometry={geometry.geometry} dispose={null}>
              {/* The shared §3.2 preset, not a local copy — per-lane copies
                  are how roughness drifted to 0.24 in one place and 0.42 in
                  another. §5.6 specifies MACHINED for this stage. */}
              <ForgedSteelMaterial state="machined" />
            </mesh>
          ) : null}
        </group>
      </group>
    </>
  );
}
