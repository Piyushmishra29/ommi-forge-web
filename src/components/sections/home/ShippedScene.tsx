'use client';

import { useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  MODELS,
  MODEL_PRIORITY,
  mapRange,
  rad,
  useModelGeometry,
  useScenePose,
} from '@/components/three3/scene';
import { SHIPPED } from '@/lib/three/materialStates';
import { poseFor } from '@/components/three/stage-rig';
import { ForgeStage } from './homeStage';

/**
 * Beat 9 — the bookend.
 *
 * The same part the page opened on, one heat later: machined, oiled for
 * transit, and **cold**. `emissiveIntensity` is a hard zero here and there
 * is no core light in the rig at all, which is the concept's payoff — heat
 * is a position on a timeline and this is the end of it.
 *
 * Zero extra bytes: `part-g` was fetched for the act at the top of the page
 * and both the model and the prepared geometry are still cached.
 *
 * LAZILY LOADED. See `HeatActScene` for why this boundary matters.
 */

export type ShippedSceneProps = {
  /** Section scroll progress, 0–1, from `useScrollProgress`. */
  progress: RefObject<number>;
};

/** The same resting angle the poster for this part was rendered at. */
const [POSE_PITCH, POSE_YAW] = poseFor(MODELS.g.url);

export default function ShippedScene({ progress }: ShippedSceneProps) {
  const group = useRef<THREE.Group>(null);

  // `smooth`, not `creased`: this is the same URL the act loaded, but the
  // shading mode is part of the geometry cache key, so asking for `creased`
  // again here is free while asking for `smooth` would prepare a second
  // copy. Matching the act's options is what makes this beat cost nothing.
  const { geometry } = useModelGeometry(MODELS.g.url, {
    priority: MODEL_PRIORITY.approaching,
    shading: 'creased',
  });

  useScenePose(() => {
    const g = group.current;
    if (!g) return;
    // 40° total across the whole section — slow enough to read as a part
    // being turned over once, not as a turntable. Scroll-driven, so it stops
    // when the visitor stops.
    // Centred on the resting pose rather than starting from it, so the
    // angle the part was framed at is what most of the section shows.
    g.rotation.y = POSE_YAW + mapRange(progress.current, 0, 1, rad(-20), rad(20));
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={32} near={0.1} far={100} position={[0, 0, 3.9]} />
      <ForgeStage />
      <group ref={group} rotation={[POSE_PITCH, POSE_YAW, 0]}>
        {geometry ? (
          <mesh geometry={geometry.geometry} dispose={null}>
            <meshPhysicalMaterial {...SHIPPED} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
