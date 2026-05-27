"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { BRAND_HEX } from "@/lib/brand";

export type HammerStrikeHeroProps = {
  /** 0..1 scrubbed by the parent (e.g. GSAP ScrollTrigger). */
  progress: number;
  className?: string;
};

/**
 * Hammer + anvil scene driven entirely by an external `progress` prop.
 * The component does NOT subscribe to scroll — the parent owns that.
 *
 * Composition:
 *  - Anvil: 3-box body (main + horn + step) with subtle mesh-orange edges.
 *  - Hammer: cylinder handle + box head with saffron rim edges.
 *  - Lights: ambient + key + peach rim + transient saffron flash on strike.
 *  - Sparks: <Sparkles> burst on strike, fades 0.4s in / 0.8s out.
 *  - Heat glow: mesh-orange pointLight whose intensity pulses 0→4→0.
 *  - Camera: progress-driven y tilt + 0.5s decaying shake on strike.
 *  - Reduced-motion: static struck pose, no sparks/glow/shake.
 */
function Scene({
  progress,
  reduced,
}: {
  progress: number;
  reduced: boolean;
}) {
  const hammerRef = useRef<THREE.Group>(null);
  const cameraShake = useRef(0);
  const impactPulse = useRef(0);
  const heatRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.DirectionalLight>(null);
  const sparkleGroupRef = useRef<THREE.Group>(null);
  const sparkOpacity = useRef(0);
  const wasStruck = useRef(false);

  // Clamp once per render.
  const clamped = Math.min(1, Math.max(0, progress));
  const struck = clamped > 0.95;

  useFrame(({ camera }, rawDelta) => {
    // Cap delta so paused-tab unfreezes don't snap the scene.
    const delta = Math.min(rawDelta, 1 / 30);

    if (hammerRef.current) {
      // Hammer descends linearly from +80 → 0 over the full progress range.
      const targetY = 80 * (1 - clamped);
      hammerRef.current.position.y +=
        (targetY - hammerRef.current.position.y) * Math.min(1, delta * 12);
    }

    // Trigger impact pulse on rising edge of `struck`.
    if (!reduced && struck && !wasStruck.current) {
      impactPulse.current = 0.5;
      sparkOpacity.current = 1.2; // total visible window (0.4 in + 0.8 out)
    }
    wasStruck.current = struck;

    // Camera y tilt from progress (subtle).
    const baseTilt = (1.5 * Math.PI) / 180;
    camera.rotation.y = -baseTilt * (clamped - 0.5);

    // Camera shake — sin-modulated decay over 0.5s.
    if (!reduced && impactPulse.current > 0) {
      const decay = impactPulse.current / 0.5;
      cameraShake.current = Math.sin(performance.now() * 0.04) * 0.02 * decay;
      impactPulse.current = Math.max(0, impactPulse.current - delta);
    } else {
      cameraShake.current *= 1 - Math.min(1, delta * 6);
    }
    camera.rotation.z = cameraShake.current;

    // Heat glow pulse — 0 → 4 → 0 across the spark window.
    if (heatRef.current) {
      if (reduced) {
        heatRef.current.intensity = struck ? 2 : 0;
      } else {
        const t = sparkOpacity.current;
        // t starts at 1.2 and falls to 0; map → triangle 0→4→0
        const triangle =
          t <= 0
            ? 0
            : t > 0.8
              ? ((1.2 - t) / 0.4) * 4 // ramp up (0 → 4) over the first 0.4s
              : (t / 0.8) * 4; // ramp down (4 → 0) over the next 0.8s
        heatRef.current.intensity = triangle;
      }
    }

    // Strike flash directional light — match the sparkle ramp window.
    if (flashRef.current) {
      if (reduced) {
        flashRef.current.intensity = struck ? 1.8 : 0;
      } else {
        // Only burns for the first ~250ms of the spark window.
        const t = sparkOpacity.current;
        flashRef.current.intensity = t > 0.95 ? 1.8 : 0;
      }
    }

    // Sparkle group opacity (sync with sparkOpacity counter).
    if (sparkleGroupRef.current) {
      if (reduced) {
        sparkleGroupRef.current.visible = false;
      } else {
        const t = sparkOpacity.current;
        const vis = t > 0 ? Math.min(1, t > 0.8 ? (1.2 - t) / 0.4 : t / 0.8) : 0;
        sparkleGroupRef.current.visible = vis > 0.01;
        sparkleGroupRef.current.scale.setScalar(vis);
        sparkOpacity.current = Math.max(0, sparkOpacity.current - delta);
      }
    }
  });

  const anvilMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.8,
        roughness: 0.45,
      }),
    [],
  );
  const hammerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.8,
        roughness: 0.45,
      }),
    [],
  );

  // Edge-overlay geometries (mesh-orange tech-drawing accent).
  const anvilBodyGeom = useMemo(() => new THREE.BoxGeometry(40, 14, 18), []);
  const anvilHornGeom = useMemo(() => new THREE.BoxGeometry(14, 8, 12), []);
  const anvilStepGeom = useMemo(() => new THREE.BoxGeometry(28, 4, 14), []);
  const anvilBaseGeom = useMemo(() => new THREE.BoxGeometry(26, 10, 14), []);
  const hammerHeadGeom = useMemo(() => new THREE.BoxGeometry(18, 12, 12), []);

  const anvilBodyEdges = useMemo(
    () => new THREE.EdgesGeometry(anvilBodyGeom),
    [anvilBodyGeom],
  );
  const anvilStepEdges = useMemo(
    () => new THREE.EdgesGeometry(anvilStepGeom),
    [anvilStepGeom],
  );
  const anvilHornEdges = useMemo(
    () => new THREE.EdgesGeometry(anvilHornGeom),
    [anvilHornGeom],
  );
  const hammerHeadEdges = useMemo(
    () => new THREE.EdgesGeometry(hammerHeadGeom),
    [hammerHeadGeom],
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      {/* Key directional */}
      <directionalLight
        position={[12, 22, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color={BRAND_HEX.snow}
      />
      {/* Peach rim from back-left */}
      <directionalLight
        position={[-14, 6, -10]}
        intensity={0.4}
        color={BRAND_HEX.peach}
      />
      {/* Saffron strike flash from directly above */}
      <directionalLight
        ref={flashRef}
        position={[0, 30, 0]}
        intensity={0}
        color={BRAND_HEX.saffron}
      />
      {/* Heat glow pointLight on anvil top */}
      <pointLight
        ref={heatRef}
        position={[0, -2, 0]}
        intensity={0}
        color={BRAND_HEX.mesh}
        distance={60}
        decay={2}
      />

      {/* Anvil — main body */}
      <mesh position={[0, -10, 0]} castShadow receiveShadow material={anvilMaterial}>
        <primitive object={anvilBodyGeom} attach="geometry" />
      </mesh>
      <lineSegments position={[0, -10, 0]}>
        <primitive object={anvilBodyEdges} attach="geometry" />
        <lineBasicMaterial color={BRAND_HEX.mesh} transparent opacity={0.15} />
      </lineSegments>

      {/* Anvil — step (top plate) */}
      <mesh position={[0, -1, 0]} castShadow receiveShadow material={anvilMaterial}>
        <primitive object={anvilStepGeom} attach="geometry" />
      </mesh>
      <lineSegments position={[0, -1, 0]}>
        <primitive object={anvilStepEdges} attach="geometry" />
        <lineBasicMaterial color={BRAND_HEX.mesh} transparent opacity={0.15} />
      </lineSegments>

      {/* Anvil — horn (one side) */}
      <mesh position={[24, -7, 0]} castShadow receiveShadow material={anvilMaterial}>
        <primitive object={anvilHornGeom} attach="geometry" />
      </mesh>
      <lineSegments position={[24, -7, 0]}>
        <primitive object={anvilHornEdges} attach="geometry" />
        <lineBasicMaterial color={BRAND_HEX.mesh} transparent opacity={0.15} />
      </lineSegments>

      {/* Anvil base */}
      <mesh position={[0, -22, 0]} receiveShadow material={anvilMaterial}>
        <primitive object={anvilBaseGeom} attach="geometry" />
      </mesh>

      {/* Hammer */}
      <group ref={hammerRef} position={[0, 80, 0]}>
        {/* Hammer head — boxy, larger */}
        <mesh castShadow material={hammerMaterial}>
          <primitive object={hammerHeadGeom} attach="geometry" />
        </mesh>
        {/* Saffron outline edge on head only */}
        <lineSegments>
          <primitive object={hammerHeadEdges} attach="geometry" />
          <lineBasicMaterial color={BRAND_HEX.saffron} transparent opacity={0.55} />
        </lineSegments>
        {/* Hammer handle — longer cylinder */}
        <mesh position={[0, 30, 0]} castShadow material={hammerMaterial}>
          <cylinderGeometry args={[1.8, 1.8, 48, 16]} />
        </mesh>
      </group>

      {/* Sparks on strike */}
      <group ref={sparkleGroupRef} position={[0, -1, 0]} visible={false}>
        <Sparkles
          count={60}
          size={6}
          speed={0.6}
          scale={[40, 14, 18]}
          color={BRAND_HEX.saffron}
        />
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

export function HammerStrikeHero({ progress, className }: HammerStrikeHeroProps) {
  const stageBackground = `radial-gradient(circle at center, ${BRAND_HEX.snow} 0%, ${BRAND_HEX.renderBg} 70%)`;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className={["relative h-full w-full", className ?? ""].join(" ")}
      style={{ background: stageBackground }}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 10, 90], fov: 38 }} shadows>
        <Scene progress={progress} reduced={reduced} />
      </Canvas>
    </div>
  );
}

export default HammerStrikeHero;
