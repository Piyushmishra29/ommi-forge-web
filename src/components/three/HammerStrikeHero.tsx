"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * The hero accepts EITHER a raw number OR a React ref carrying a
 * number. The ref form lets the parent mutate `progress` every frame
 * (via PinnedSection's `useScrollProgressRef`) without re-rendering us.
 */
export type HammerStrikeProgress = number | { readonly current: number };

export type HammerStrikeHeroProps = {
  /** 0..1 scrubbed by the parent (e.g. GSAP ScrollTrigger). */
  progress: HammerStrikeProgress;
  className?: string;
};

function readProgress(p: HammerStrikeProgress): number {
  return typeof p === "number" ? p : (p.current ?? 0);
}

/**
 * V1 — the original basic R3F hammer + anvil scene the user asked to
 * restore. Stretched-box anvil + smaller anvil base + a hammer made of
 * a box head and cylinder handle. Two directional lights (key + warm
 * peach back-rim) + ContactShadows + a radial gradient stage.
 *
 * On strike (progress > 0.95) the key light brightens to 2.2 and the
 * camera tilts ~1.5° via a 350 ms decay envelope.
 */
function Scene({ progress }: { progress: HammerStrikeProgress }) {
  const hammerRef = useRef<THREE.Group>(null);
  const cameraTilt = useRef(0);
  const impactPulse = useRef(0);

  useFrame(({ camera }, rawDelta) => {
    // Cap delta so paused-tab unfreezes don't snap the scene.
    const delta = Math.min(rawDelta, 1 / 30);
    const clamped = Math.min(1, Math.max(0, readProgress(progress)));
    const struck = clamped > 0.95;

    if (hammerRef.current) {
      // Hammer descends linearly from +80 → 0 over the full progress range.
      const targetY = 80 * (1 - clamped);
      hammerRef.current.position.y +=
        (targetY - hammerRef.current.position.y) * Math.min(1, delta * 12);
    }

    // Impact pulse: bump camera 1.5° y-rotation briefly when struck.
    if (struck && impactPulse.current <= 0) {
      impactPulse.current = 0.35; // 350ms decay window
    }
    if (impactPulse.current > 0) {
      cameraTilt.current = (impactPulse.current / 0.35) * ((1.5 * Math.PI) / 180);
      impactPulse.current = Math.max(0, impactPulse.current - delta);
    } else {
      cameraTilt.current *= 1 - Math.min(1, delta * 4);
    }
    camera.rotation.y = cameraTilt.current;
  });

  const anvilMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1F2124",
        metalness: 0.5,
        roughness: 0.6,
      }),
    [],
  );
  const hammerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2A2C30",
        metalness: 0.65,
        roughness: 0.5,
      }),
    [],
  );

  const clampedNow = Math.min(1, Math.max(0, readProgress(progress)));
  const struckNow = clampedNow > 0.95;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[12, 22, 8]}
        intensity={struckNow ? 2.2 : 1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-14, 6, -10]}
        intensity={0.45}
        color="#FFBC7D"
      />

      {/* Anvil — stretched box */}
      <mesh
        position={[0, -10, 0]}
        castShadow
        receiveShadow
        material={anvilMaterial}
      >
        <boxGeometry args={[40, 14, 18]} />
      </mesh>
      {/* Anvil base */}
      <mesh position={[0, -22, 0]} receiveShadow material={anvilMaterial}>
        <boxGeometry args={[26, 10, 14]} />
      </mesh>

      {/* Hammer */}
      <group ref={hammerRef} position={[0, 80, 0]}>
        {/* Hammer head */}
        <mesh castShadow material={hammerMaterial}>
          <boxGeometry args={[16, 10, 10]} />
        </mesh>
        {/* Hammer handle */}
        <mesh position={[0, 26, 0]} castShadow material={hammerMaterial}>
          <cylinderGeometry args={[2, 2, 40, 16]} />
        </mesh>
      </group>

      <ContactShadows
        position={[0, -28, 0]}
        opacity={0.5}
        scale={120}
        blur={2.5}
        far={40}
      />
    </>
  );
}

export function HammerStrikeHero({
  progress,
  className,
}: HammerStrikeHeroProps) {
  return (
    <div
      className={[
        "relative h-full w-full",
        "bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#D9D9D9_70%)]",
        className ?? "",
      ].join(" ")}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 10, 90], fov: 38 }}
        shadows
      >
        <Scene progress={progress} />
      </Canvas>
    </div>
  );
}

export default HammerStrikeHero;
