'use client';

import { useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { Color } from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  MODELS,
  MODEL_PRIORITY,
  mapRange,
  useModelGeometry,
  useScenePose,
} from '@/components/three3/scene';
import { AS_FORGED } from '@/lib/three/materialStates';
import { INDEX_SWEEP_RAD, poseFor } from '@/components/three/stage-rig';
import {
  BEATS,
  ForgeStage,
  HEAT_RAMP,
  MAX_CORE_LIGHT,
  MAX_EMISSIVE,
  heatCurve
} from './homeStage';

/**
 * Beats 0–3 of the home act: the part heats, is struck, takes its shape.
 *
 * LAZILY LOADED — `HeatAct.tsx` holds only a reference to this module via
 * `dynamicScene()`, so three.js is fetched on the frame the slot arms, not
 * on first paint. Everything three-flavoured on this page lives below this
 * boundary.
 *
 * The whole scene is posed from one number: the act's scroll progress,
 * handed in as a ref. Nothing here animates on its own — there is no idle
 * rotation, no drift, no loop. If the visitor stops scrolling, the part
 * stops, which is the correct behaviour for a conveyor.
 */

export type HeatActSceneProps = {
  /**
   * Act progress, 0–1, written by the pin's scrubbed tween. A ref rather
   * than state: this updates on every scroll frame and a `setState` here
   * would reconcile the entire R3F tree at 120 Hz.
   */
  progress: RefObject<number>;
};

/** Camera dolly, §5.1 beats 0→1. It travels once and then holds. */
const CAM_Z_NEAR = 3.4;
const CAM_Z_FAR = 4.2;

/**
 * Resting pose, shared with the offline poster renderer via `poseFor` — the
 * poster for this part is rendered at exactly this angle, which is half of
 * what makes the still-to-canvas hand-off invisible (the other half is the
 * rig). Chosen there by eye: this part's long axis runs along X after
 * normalisation (measured 110 × 31 × 32 before scaling), so a three-quarter
 * yaw with a downward tilt shows its depth rather than presenting it as a bar.
 */
const [BASE_PITCH, BASE_YAW] = poseFor(MODELS.i.url);

/** Module scope: two colours allocated once, not one per frame. */
const HEAT_COLD = new Color(HEAT_RAMP.cold);
const HEAT_HOT = new Color(HEAT_RAMP.hot);

/**
 * How far right of centre the part sits on a landscape viewport, in
 * part-radii. The headline owns the left of the frame at every beat — the
 * copy and the part share the stage rather than stacking, which is what
 * keeps `display-xl` legible without a scrim over the whole canvas.
 *
 * Below an aspect of ~1 there is no room to move it: at portrait widths the
 * frame is barely wider than the part, so it centres and the copy reads over
 * it against the vignette instead.
 */
const OFFSET_X = 1.05;

/** Dropped below the headline's optical centre so the two do not fight. */
const OFFSET_Y = -0.34;

export default function HeatActScene({ progress }: HeatActSceneProps) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const core = useRef<THREE.PointLight>(null);
  const camera = useRef<THREE.PerspectiveCamera>(null);

  // `creased` splits hard edges so they catch the strip lights like machined
  // steel. It de-indexes the buffer (~3× GPU memory) — worth it for the one
  // part the page is built around, wasteful for a thumbnail. 24,578 tris, so
  // even tripled this is a rounding error against the 900k/frame budget.
  const { geometry } = useModelGeometry(MODELS.i.url, {
    priority: MODEL_PRIORITY.hero,
    shading: 'creased',
  });

  useScenePose((state) => {
    const p = progress.current;

    // DOLLY — "you are walking up to the part". Once, over beat 1, then it
    // holds for the rest of the act (§4.3: max one dolly per page).
    const cam = camera.current;
    if (cam) {
      cam.position.z = mapRange(p, 0, BEATS.heatFull, CAM_Z_FAR, CAM_Z_NEAR);
    }

    const g = group.current;
    if (g) {
      // Read the slot's own box, not the window: the scene is drawn into a
      // scissored rectangle whose aspect is the section's, and that is what
      // decides whether there is room beside the headline.
      const wide = state.size.width > state.size.height;
      g.position.set(wide ? OFFSET_X : 0, wide ? OFFSET_Y : 0, 0);
      // Nothing is drawn while the footage covers the canvas. The slot is
      // still scissored and cleared, but the part costs no draw call — and
      // the material keeps cooling underneath, so it comes back at the right
      // temperature instead of jumping.
      g.visible = p < BEATS.strikeIn || p > BEATS.strikeOut;

      // INDEX — one axis, beat 3 only, and **centred on the resting pose**
      // rather than starting from it.
      //
      // §5.1 asks for 200° "on its ring axis", which assumes a radially
      // symmetric disc. This part is a long forging (110 × 31 × 32 before
      // normalisation) whose long axis is X, so a sweep that starts at the
      // framed angle swings that axis toward the camera and the part turns
      // edge-on. Measured on the exported build at 200°: silhouette coverage
      // fell 38.5% → 14.3% and the bounding box narrowed from 664px to
      // 208px around p=0.84 — most of the beat spent showing the narrow end
      // of the part the beat exists to show.
      //
      // `INDEX_SWEEP_RAD` (96°, centred) is the shared correction the
      // showroom lane already made for the same reason on the same class of
      // part; ±48° reads the depth of a forging without ever approaching the
      // 90° that flattens it. Well inside §4.3's 220° ceiling either way.
      const local = p <= BEATS.forgeIn ? 0 : mapRange(p, BEATS.forgeIn, 1, 0, 1);
      g.rotation.set(
        BASE_PITCH,
        BASE_YAW + (local - 0.5) * INDEX_SWEEP_RAD,
        0,
      );
    }

    // Heat is two signals in lockstep, never one (§3.4). The material floor
    // is uniform and low; the core light is what makes it non-uniform.
    const heat = heatCurve(p);
    if (material.current) {
      // Colour ramps with temperature, not just level: dull oxide red at the
      // bottom of the curve, forge orange at the top. Squared so the glow
      // stays out of the way until the scene really means it.
      material.current.emissive.copy(HEAT_COLD).lerp(HEAT_HOT, heat);
      material.current.emissiveIntensity = heat * heat * MAX_EMISSIVE;
    }
    if (core.current) {
      core.current.intensity = heat * MAX_CORE_LIGHT;
    }
  });

  return (
    <>
      {/* fov 32 at z 4.2 (§3.3's normalised rig) rather than the canvas
          default of 35/5 — a slightly longer lens, which flattens the
          perspective distortion a wide part picks up at close range. */}
      <PerspectiveCamera
        ref={camera}
        makeDefault
        fov={32}
        near={0.1}
        far={100}
        position={[0, 0, CAM_Z_FAR]}
      />

      <ForgeStage coreRef={core} />

      {/* 0.62: the part is a presence at the cold open, not a co-star. The
          dolly is what brings it forward once the heat comes up. */}
      <group ref={group} scale={0.62} rotation={[BASE_PITCH, BASE_YAW, 0]}>
        {geometry ? (
          // `dispose={null}`: the geometry is cache-owned and shared with
          // the closing-CTA slot, which shows this same part cold. R3F's
          // unmount cleanup would otherwise free a buffer still in use.
          <mesh geometry={geometry.geometry} dispose={null}>
            <meshStandardMaterial ref={material} {...AS_FORGED} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
