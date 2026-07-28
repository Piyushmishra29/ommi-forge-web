'use client';

import { useRef, type RefObject } from 'react';
import type * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import {
  MODELS,
  MODEL_PRIORITY,
  clamp,
  mapRange,
  rad,
  useModelGeometry,
  useScenePose,
} from '@/components/three3/scene';
import { AS_FORGED } from '@/lib/three/materialStates';
import { poseFor } from '@/components/three/stage-rig';
import { ForgeStage } from './homeStage';

/**
 * Beat 4 — the line.
 *
 * Three real parts travel through one frame along one axis: the sprocket
 * from the act leaves to the left, a hub enters from the right behind it,
 * then a trunnion. This is the literal conveyor, and it is the site's
 * section-to-section verb (§4.3 HANDOFF).
 *
 * There is no crossfade anywhere in here, deliberately. Two parts at 50%
 * opacity occupying the same space is the tell of a fake transition (§6
 * rule 20); two parts at different positions on the same travel axis is
 * what a forge line actually looks like.
 *
 * All three are cold — `AS_FORGED`, emissive hard zero. Heat appears twice
 * on this page and this is neither of them.
 *
 * LAZILY LOADED. See `HeatActScene` for why this boundary matters.
 */

export type LineSceneProps = {
  /** Section scroll progress, 0–1, from `useScrollProgress`. */
  progress: RefObject<number>;
};

/**
 * Each part's window within the section, and where it sits when it is
 * dead-centre. Overlapping windows are the point: as one leaves the frame
 * the next is already entering, so the line never empties.
 */
const TRAVEL = [
  { url: MODELS.g.url, from: 0.0, to: 0.46, scale: 1 },
  { url: MODELS.h.url, from: 0.3, to: 0.78, scale: 0.92 },
  { url: MODELS.trunnion.url, from: 0.62, to: 1.0, scale: 0.95 },
] as const;

/** How far off-axis a part starts and ends, in part-radii. */
const ENTRY_X = 3.4;

function Part({
  url,
  from,
  to,
  scale,
  progress,
}: (typeof TRAVEL)[number] & { progress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  const { geometry } = useModelGeometry(url, {
    priority: MODEL_PRIORITY.approaching,
  });

  const [posePitch, poseYaw] = poseFor(url);

  useScenePose(() => {
    const g = group.current;
    if (!g) return;
    const local = clamp((progress.current - from) / (to - from), 0, 1);

    // Off-screen at both ends of its own window: cheaper than a visibility
    // test on the mesh, and it means a part is never half-drawn at the seam.
    g.visible = local > 0 && local < 1;
    g.position.x = mapRange(local, 0, 1, ENTRY_X, -ENTRY_X);
    // A slow quarter-turn as it passes — one axis, well inside §4.3's 220°
    // ceiling. Enough to show the part has depth, not enough to read as a
    // turntable.
    g.rotation.y = poseYaw + mapRange(local, 0, 1, rad(-30), rad(30));
  });

  if (!geometry) return null;

  return (
    <group ref={group} scale={scale} rotation={[posePitch, poseYaw, 0]}>
      {/* Cache-owned geometry — `dispose={null}` or R3F's unmount cleanup
          frees a buffer the other home slots are still drawing from. */}
      <mesh geometry={geometry.geometry} dispose={null}>
        <meshStandardMaterial {...AS_FORGED} />
      </mesh>
    </group>
  );
}

export default function LineScene({ progress }: LineSceneProps) {
  return (
    <>
      {/* Pulled back from the act's 4.2 so a part is fully in frame before it
          reaches centre — at 4.2 the entry and exit both clip. */}
      <PerspectiveCamera makeDefault fov={32} near={0.1} far={100} position={[0, 0, 5.4]} />
      {/* No `coreRef`: nothing on this beat is hot, so the core light is not
          mounted at all and every material here compiles one light shorter. */}
      <ForgeStage />
      {TRAVEL.map((part) => (
        <Part key={part.url} {...part} progress={progress} />
      ))}
    </>
  );
}
