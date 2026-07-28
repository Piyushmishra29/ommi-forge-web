'use client';

import { useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  MODEL_PRIORITY,
  clamp,
  lerp,
  useModelGeometry,
  useScenePose,
} from '@/components/three3/scene';
import ForgeStage from '@/components/three/ForgeStage';
import { AS_FORGED } from '@/lib/three/materialStates';
import { METHOD_SHOTS, PANEL_COUNT, type CameraMove } from './methodShots';

/**
 * The 3D half of the `/solutions` act: one part on a dark stage, four
 * camera moves, handed off along a travel axis as the pin scrubs.
 *
 * Loaded through `dynamicScene()` from `MethodsPinned`, which is what keeps
 * three.js out of the `/solutions` first-paint chunk — this module imports
 * `three3/scene` and therefore pulls the whole renderer. Never import it
 * from a page or a section component directly.
 *
 * There is exactly ONE mesh here for all four methods. It is not an
 * optimisation, it is the §4.3 HANDOFF rule made structural: two parts can
 * never occupy the same space at 50% opacity because there is only ever one
 * part. The geometry swaps while the mesh is parked off-frame.
 */

/* -------------------------------------------------------------------------- */
/*  Material — §3.2 state A, AS_FORGED                                        */
/* -------------------------------------------------------------------------- */

/**
 * Every part on this page is straight off the hammer, so all four panels
 * share §3.2's `AS_FORGED` state — taken from the shared rig rather than
 * restated, so this page, the home hero's first beat, the `/renders` hub and
 * the offline poster renderer cannot drift apart.
 *
 * The one local addition is `emissive`: §3.2 gives `AS_FORGED` a mesh
 * emissive at intensity 0, and `/solutions` is the only surface on the site
 * that ever drives it above zero (§5.4's single closed-die heat pulse). It
 * stays here rather than in the shared constant because nothing else needs
 * it, and a shared emissive is an invitation to glow.
 *
 * Applied as a raw `<meshStandardMaterial>` rather than the house
 * `<ForgedSteelMaterial>` for one reason: the closed-die panel animates
 * `emissiveIntensity` per frame on the scrub, and the shared component takes
 * heat as a React prop — driving it would reconcile the whole R3F subtree on
 * every scroll frame, which is precisely what `useScenePose` and the
 * ref-backed progress bridge exist to avoid. The configuration compiles to
 * the same `WebGLProgram` either way (no maps), so `PERF_BUDGET.maxPrograms`
 * is unaffected — observed at 1 / 24.
 */
const HEAT_EMISSIVE = '#FF5533';

/* -------------------------------------------------------------------------- */
/*  Motion constants                                                          */
/* -------------------------------------------------------------------------- */

/** Fraction of a panel spent entering, and the same spent exiting. */
const HANDOFF_BAND = 0.13;

/** §5.4: the one permitted heat pulse on this page, on panel 01 only. */
const HEAT_PEAK = 0.35;
/** §4.2 `cool` band — 2200 ms, and it only ever falls (§3.4). */
const HEAT_DECAY_S = 2.2;
/** Local progress at which the closed-die stroke bottoms out. */
const HEAT_TRIGGER_U = 0.68;

/**
 * `mass` — power2.inOut, §4.1. Anything moving under its own weight.
 * Hand-rolled rather than pulled from GSAP because this runs inside the
 * frame loop where a tween would be the wrong tool: we are sampling a
 * curve at a scroll position, not playing one.
 */
function mass(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) * (-2 * t + 2)) / 2;
}

/** `cool` decay, §3.4: exponential, never linear. Cooling steel is not a fade. */
function coolCurve(t: number): number {
  const k = 1 - clamp(t, 0, 1);
  return k * k * k;
}

/* -------------------------------------------------------------------------- */
/*  Camera moves — "the motion is the method"                                 */
/* -------------------------------------------------------------------------- */

/** Headroom left around the part's unit bounding sphere. */
const FIT_MARGIN = 1.03;

/**
 * Closest the camera gets to the origin during each move, at the distances
 * the §5.4 numbers are authored in. Used to normalise the whole move so its
 * TIGHTEST frame is the one that exactly fits — see `fitScale`.
 */
const MOVE_MIN_DISTANCE: Record<CameraMove, number> = {
  push: 3.21, // (0, 0.3, 3.2) at the bottom of the stroke
  arc: 4.07, // constant radius
  index: 4.11, // held
  dolly: 2.42, // (0, 0.35, 2.4) at the end of the dolly
};

/**
 * Multiplier that keeps a unit-radius part inside the frame at this slot's
 * aspect ratio.
 *
 * Load-bearing, not polish. `fov` is VERTICAL, and these stages are much
 * taller than they are wide — at the desktop 5-column stage the box is about
 * 407×560, so the horizontal half-angle is a little over 12° while the
 * vertical one is 16°. Measured before this existed: the upset panel's
 * `z 4.2 → 2.4` dolly ended with the connecting rod sliced off by hard
 * vertical edges at the slot boundary.
 *
 * Normalising by the move's own MINIMUM distance rather than by a shared
 * constant is what keeps all four panels at a consistent scale: each move's
 * closest approach lands exactly on the fit distance, so the part is the
 * same size at the tightest frame of every panel, and each move still
 * travels its authored *ratio* — the dolly is as dramatic as it was, just
 * further out.
 */
function fitScale(camera: THREE.PerspectiveCamera, move: CameraMove): number {
  const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const needed = FIT_MARGIN / Math.sin(Math.min(vHalf, hHalf));
  return needed / MOVE_MIN_DISTANCE[move];
}

/**
 * Position the panel's camera for local progress `u`.
 *
 * All four keep the part at the origin and never roll (§4.3 bans camera
 * roll outright), so `lookAt(0, 0, 0)` is the whole orientation model.
 */
function poseCamera(
  camera: THREE.PerspectiveCamera,
  move: CameraMove,
  u: number,
): void {
  const e = mass(u);

  switch (move) {
    // 01 Closed Die — straight down the die axis, y 2.4 → 0.3. The camera
    // is the top die coming down.
    case 'push':
      camera.position.set(0, lerp(2.4, 0.3, e), 3.2);
      break;

    // 02 Open Die — a 90° arc about the world Y axis at a held radius. The
    // shop's answer to "shafts up to 2000 mm": you walk its length.
    case 'arc': {
      const a = lerp(-0.87, 0.68, e); // ≈ −50° → +39°, 89° swept
      camera.position.set(Math.sin(a) * 4.0, 0.75, Math.cos(a) * 4.0);
      break;
    }

    // 03 Ring Rolling — the camera holds. The PART turns (see poseGroup).
    case 'index':
      camera.position.set(0.4, 0.9, 4.0);
      break;

    // 04 Upset — end-on down the shaft, z 4.2 → 2.4. You look down the
    // barrel of the upset end.
    case 'dolly':
      camera.position.set(0, 0.35, lerp(4.2, 2.4, e));
      break;
  }

  camera.position.multiplyScalar(fitScale(camera, move));
  camera.lookAt(0, 0, 0);
}

/**
 * Smallest |x| at which a unit-radius part is fully outside the frustum,
 * measured from the camera's *current* position.
 *
 * Computed rather than constant because the frame width changes with both
 * the camera distance (four different moves) and the slot's aspect (a tall
 * desktop column, a wide mobile band). A fixed number that clears one of
 * those combinations lets the outgoing part linger visibly on screen in
 * another — and a HANDOFF whose swap you can see is just a crossfade with
 * extra steps (§4.3).
 */
function offFrameX(camera: THREE.PerspectiveCamera): number {
  const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const halfWidth =
    Math.tan(vHalf) * camera.aspect * camera.position.length();
  return halfWidth + 1 + 0.4;
}

/**
 * Travel along X for the handoff, as a −1…1 factor scaled by `offFrameX`.
 * Panel 0 never enters and the last panel never exits — the stage must not
 * be empty on the frame the pin engages, nor on the frame it releases.
 */
function travelFactor(index: number, u: number): number {
  if (index > 0 && u < HANDOFF_BAND) {
    return lerp(-1, 0, mass(u / HANDOFF_BAND));
  }
  if (index < PANEL_COUNT - 1 && u > 1 - HANDOFF_BAND) {
    return lerp(0, 1, mass((u - (1 - HANDOFF_BAND)) / HANDOFF_BAND));
  }
  return 0;
}

/**
 * Single-axis rotation of the part inside its base orientation.
 *
 * Only Ring Rolling uses it, and it is the one place on the site where a
 * near-full revolution is correct: rolling a ring *is* rotation. 220°, per
 * §4.3 — a full 360° reads as an idle spinner.
 */
function spinY(move: CameraMove, u: number): number {
  return move === 'index' ? mass(u) * THREE.MathUtils.degToRad(220) : 0;
}

/* -------------------------------------------------------------------------- */
/*  Scene                                                                     */
/* -------------------------------------------------------------------------- */

export type MethodsSceneProps = {
  /**
   * 0–1 across the whole four-panel act, written by the pin's scrubbed
   * tween. A ref, not state: this updates every scroll frame and reading it
   * inside the frame loop costs one property read instead of a full R3F
   * reconciliation.
   */
  progress: RefObject<number>;
  /**
   * Which panel owns the stage right now. Comes from React state on the DOM
   * side so the geometry swap is a real render; the pose below derives its
   * local `u` against this same index, so a one-frame lag between the two
   * simply clamps `u` to 0 or 1 — i.e. parks the part off-frame, which is
   * exactly where a handoff wants it.
   */
  activeIndex: number;
};

export default function MethodsScene({
  progress,
  activeIndex,
}: MethodsSceneProps) {
  const shot = METHOD_SHOTS[activeIndex] ?? METHOD_SHOTS[0];

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const travelRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  // Heat is a one-shot event with a tail, not a function of scroll position,
  // so it needs its own clock. `armed` latches on the forward crossing of
  // the stroke and re-arms only after the visitor scrolls back above it —
  // heat never fades in, never pulses, never loops (§3.4).
  const armed = useRef(false);
  const heatClock = useRef(0);

  // `shading: 'smooth'` for all four. Creasing de-indexes the geometry for
  // ~3x the GPU buffer, and it buys sharp machined edges — which is the
  // wrong read here: every part on this page is AS_FORGED, straight off the
  // hammer, at roughness 0.58. The environment carries the surface.
  const { geometry } = useModelGeometry(shot.modelUrl, {
    priority: MODEL_PRIORITY.approaching,
    targetRadius: 1,
    shading: 'smooth',
  });

  useScenePose((_, delta) => {
    const camera = cameraRef.current;
    const travel = travelRef.current;
    const spin = spinRef.current;
    if (!camera || !travel || !spin) return;

    const raw = progress.current * PANEL_COUNT;
    // Clamped against the React-side index rather than recomputed from
    // scratch — see `activeIndex` above for why the clamp is the feature.
    const u = clamp(raw - activeIndex, 0, 1);

    poseCamera(camera, shot.move, u);
    travel.position.x = travelFactor(activeIndex, u) * offFrameX(camera);
    spin.rotation.y = spinY(shot.move, u);

    /* --- Heat, panel 01 only (§3.4, §5.4) --- */
    const material = materialRef.current;
    const core = coreLightRef.current;
    if (!material || !core) return;

    const isHeatPanel = activeIndex === 0;
    if (!isHeatPanel) {
      armed.current = false;
      heatClock.current = 0;
    } else if (!armed.current && u >= HEAT_TRIGGER_U) {
      armed.current = true;
      heatClock.current = 0;
    } else if (armed.current && u < HEAT_TRIGGER_U - 0.08) {
      // Scrolled back above the stroke: re-arm so the beat plays again on
      // the way down. The hysteresis keeps a jittery scrub from retriggering
      // it every other frame.
      armed.current = false;
    }

    if (armed.current) heatClock.current += delta;

    const heat = armed.current
      ? HEAT_PEAK * coolCurve(heatClock.current / HEAT_DECAY_S)
      : 0;

    // Two of §3.4's three signals move together. `emissiveIntensity` is the
    // uniform floor; the core light is what makes the glow non-uniform, by
    // lighting the part's own webs and undercuts from inside.
    material.emissiveIntensity = heat;
    core.intensity = (heat / HEAT_PEAK) * 2.2;
  });

  return (
    <>
      {/* Per-slot camera. drei's `makeDefault` writes into the View's own
          portal store, so this camera belongs to this stage alone and does
          not disturb any other slot's framing. fov 32 is §3.3's normalised
          rig, which is what makes the part-radius-1 distances above read as
          real numbers. */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={32}
        near={0.1}
        far={100}
        position={[0, 2.4, 3.2]}
      />

      {/* The shared rig, at the as-forged calibration. `state` picks the
          environment, the exposure and the per-light levels together — they
          are calibrated as a set, and it also has to match the state the
          poster standing in for this canvas was rendered in.

          This replaces a local copy of the same numbers. `stage-rig` now
          carries the as-forged exposure (2.3) and the saffron rim pulled to
          0.4 that I had measured here, plus one correction to my version:
          its cool rear panel is `#8FA6BC`, the fill temperature, where mine
          was `#A8C0D6` — a more saturated blue, and §6.1 says nothing on the
          site may be cooler than the fill light. Theirs is right.

          `<ForgeLights>` is back in play because its inverted fill/rim
          temperatures are fixed at source and it now takes per-light level
          multipliers, which is what lets this page pull one light down
          without forking §3.3's table. */}
      <ForgeStage state="as-forged" />

      <group ref={travelRef}>
        {/* The animated spin is the PARENT of the static framing pose, not
            its child — i.e. the part turns about world Y, which is what §4.3
            means by "like a part on an inspection turntable". Still exactly
            one axis; §4.3 forbids tumbling on two.

            Nested the other way round the spin runs about the model's own
            native Y, which for `part-h` is not its ring axis: measured, the
            hub's silhouette collapsed from 306×363 px at the start of the
            220° sweep to 158×44 px near the end — the part turned edge-on
            and read as a line for the last stretch of the panel. A turntable
            can't do that, because the pose the part was framed in stays
            broadside to the camera the whole way round. Same class of
            problem `stage-rig` documents for its own INDEX sweep on flat
            catalogue parts. */}
        <group ref={spinRef}>
          <group rotation={shot.baseRotation}>
            {geometry && (
              // `dispose={null}`: the geometry belongs to the shared cache,
              // and another slot may still be drawing from it.
              <mesh geometry={geometry.geometry} dispose={null}>
                <meshStandardMaterial
                  ref={materialRef}
                  {...AS_FORGED}
                  emissive={HEAT_EMISSIVE}
                  emissiveIntensity={0}
                />
              </mesh>
            )}
          </group>
        </group>

        {/* §3.4 signal 2 — the core heat light. Always mounted (a light
            appearing and disappearing recompiles the shader) and driven to
            zero at rest, so it costs nothing on the three cold panels. */}
        <pointLight
          ref={coreLightRef}
          color="#FF7A2B"
          intensity={0}
          distance={2.5}
          decay={2}
        />
      </group>
    </>
  );
}
