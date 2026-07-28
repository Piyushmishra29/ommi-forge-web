'use client';

import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  MODELS,
  MODEL_PRIORITY,
  clamp,
  lerp,
  useModelGeometry,
  useScenePose,
} from '@/components/three3/scene';
import ForgeStage from '@/components/three/ForgeStage';
import { MACHINED } from '@/lib/three/materialStates';

/**
 * The 3D half of `/about` — heritage as a material state change (§5.2).
 *
 * One part, `trunnion-85000103`, held on a sticky stage while the four
 * heritage chapters scroll past it. Across them it makes a single 180°
 * INDEX on one axis and its material lerps from `AS_FORGED` to `MACHINED`.
 *
 * That lerp is the entire idea of the page: **surface finish is time.** The
 * company has been making numbered parts for fifty-one years, and the part
 * you are looking at gets visibly better made as you read about it. There is
 * no heat anywhere on this page — emissive is a hard zero from top to
 * bottom, because this is a story about craft, not about a press stroke.
 *
 * Loaded through `dynamicScene()`; never import it from a page or section.
 */

/* -------------------------------------------------------------------------- */
/*  The two material states this page travels between (§3.2 / §5.2)           */
/* -------------------------------------------------------------------------- */

/** State A — mill scale, straight off the hammer. 1975. */
const AS_FORGED = {
  color: '#43474B',
  /** §5.2 gives 0.72 here rather than §3.2's general 0.58 — the far end of
   *  the ramp has to be rough enough that the arrival at 0.24 reads. */
  roughness: 0.72,
  envMapIntensity: 1,
} as const;

/**
 * State B — the finished faces, bright and directional. Today.
 *
 * Imported from the shared `stage-rig` rather than re-stating §3.2, and the
 * difference matters: the rig carries `roughness: 0.42`, not §3.2's 0.24.
 * §3.2's number assumes §3.3's twin roof softboxes, and the environment this
 * site actually ships has one narrow raking strip against a dark shell —
 * under which a 0.24 surface renders as mirror-polished chrome, which is the
 * thing §6.11 exists to prevent. Sharing the constant also means this page's
 * destination is the exact material the posters were rendered in, so the
 * still and the canvas finally agree.
 */

/** §4.3 INDEX: one axis, and 180° total across the whole page. */
const INDEX_RADIANS = Math.PI;

/** §3.3's normalised rig: part at bounding radius 1, camera at z 4.2, fov 32. */
const CAMERA_DISTANCE = 4.2;
const CAMERA_FOV = 32;
/** Headroom around the part's bounding sphere. */
const FIT_MARGIN = 1.08;

/**
 * How far back the camera has to sit for a unit-radius part to fit THIS
 * slot's aspect ratio.
 *
 * `fov` is vertical, and this stage is a tall column — roughly 407×576 at the
 * desktop container — so the horizontal half-angle is much tighter than the
 * vertical one and §3.3's 4.2 would slice the part off at both sides. Take
 * whichever axis is tighter, never closer than the spec'd distance.
 */
function fitDistance(camera: THREE.PerspectiveCamera): number {
  const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  return Math.max(CAMERA_DISTANCE, FIT_MARGIN / Math.sin(Math.min(vHalf, hHalf)));
}

export type HeritageSceneProps = {
  /**
   * 0–1 across the four chapters, written by `useScrollProgress` on the DOM
   * side. A ref rather than state: it updates every scroll frame, and
   * re-rendering an R3F subtree at 120 Hz is how a 3D site becomes the lag
   * complaint this project already shipped once.
   */
  progress: RefObject<number>;
};

export default function HeritageScene({ progress }: HeritageSceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const spinRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Two fixed endpoints plus one scratch colour, allocated once. A
  // `new THREE.Color()` per frame would churn the GC on the scroll-hot path
  // for no reason — `lerpColors` writes into the scratch in place.
  const palette = useMemo(
    () => ({
      from: new THREE.Color(AS_FORGED.color),
      to: new THREE.Color(MACHINED.color),
      scratch: new THREE.Color(AS_FORGED.color),
    }),
    [],
  );

  // `creased` rather than `smooth`: this is the one part on the site the
  // visitor is invited to *look at* for a whole page, and creased normals are
  // what make the arrival at MACHINED read as machined instead of merely
  // paler. It costs ~3x the GPU vertex buffer, which is affordable exactly
  // once — for a single part in a single slot on a page with no other 3D.
  const { geometry } = useModelGeometry(MODELS.trunnion.url, {
    priority: MODEL_PRIORITY.hero,
    targetRadius: 1,
    shading: 'creased',
  });

  useScenePose(() => {
    const spin = spinRef.current;
    const material = materialRef.current;
    const camera = cameraRef.current;
    if (!spin || !material || !camera) return;

    // Re-fit every frame rather than once: `SceneSlot` boxes are measured
    // from live layout, so a resize (or the mobile URL bar) changes the
    // aspect under us without remounting anything.
    camera.position.set(0, 0.5, fitDistance(camera));
    camera.lookAt(0, 0, 0);

    const t = clamp(progress.current, 0, 1);

    // Linear, not eased. This is an inspection turntable driven by the
    // visitor's own scrolling, and easing it would make the part appear to
    // hesitate between chapters — which reads as a stutter, not as weight.
    spin.rotation.y = t * INDEX_RADIANS;

    material.roughness = lerp(AS_FORGED.roughness, MACHINED.roughness, t);
    material.envMapIntensity = lerp(
      AS_FORGED.envMapIntensity,
      MACHINED.envMapIntensity,
      t,
    );
    material.color.copy(
      palette.scratch.lerpColors(palette.from, palette.to, t),
    );
  });

  return (
    <>
      {/* `makeDefault` scopes this camera to this slot's portal, so it frames
          this stage without touching any other slot. Position and aim are
          set every frame in the pose above — slightly above the part and
          looking back down at it, the angle you take when you pick a forging
          up off the bench. */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={CAMERA_FOV}
        near={0.1}
        far={100}
        position={[0, 0.5, CAMERA_DISTANCE]}
      />

      {/* The shared rig — §3.3's four lights at §3.3's temperatures, over an
          environment whose shell actually sits at graphite. See the note in
          `MethodsScene` for what the engine's defaults get wrong; the short
          version is that they render the steel bronze and hollow out the
          faces that do not face a panel. */}
      <ForgeStage />

      {/* Static parent carries the framing tilt so the animated rotation
          below is a single principal axis (§4.3 forbids two at once). */}
      <group rotation={[0.18, 0, 0]}>
        <group ref={spinRef}>
          {geometry && (
            // Cache-owned geometry — `dispose={null}` keeps R3F's unmount
            // cleanup away from a buffer other slots may share.
            <mesh geometry={geometry.geometry} dispose={null}>
              {/* Raw material rather than <ForgedSteelMaterial> because
                  every uniform below is animated per frame on the scrub;
                  the shared component takes its state as React props, and
                  driving those would reconcile the subtree on every scroll
                  frame. Same feature set, so the same compiled program —
                  `PERF_BUDGET.maxPrograms` is unaffected. */}
              <meshStandardMaterial
                ref={materialRef}
                color={AS_FORGED.color}
                metalness={1}
                roughness={AS_FORGED.roughness}
                envMapIntensity={AS_FORGED.envMapIntensity}
                // Hard zero, and it never moves. §5.2: no heat on this page.
                emissiveIntensity={0}
              />
            </mesh>
          )}
        </group>
      </group>
    </>
  );
}
