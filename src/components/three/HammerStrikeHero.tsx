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
 * Industrial drop-hammer scene driven entirely by an external `progress`
 * prop. The component does NOT subscribe to scroll — the parent owns that.
 *
 * Composition (modelled after a steam / pneumatic power hammer):
 *  - Foundation block: wide concrete-like base under the whole rig.
 *  - Anvil: stepped cast-iron block sitting on the foundation; flat top die.
 *  - H-frame: two vertical posts + horizontal cross-head connecting them.
 *  - Cylinder housing + piston rod: cylindrical steam-engine cap on top.
 *  - Tup (ram): heavy block + bottom die, slides down the frame between
 *    the posts on every strike. Driven by `progress` (0 = parked at top,
 *    1 = die kissing the work-piece).
 *  - Hot work-piece: glowing saffron billet sitting on the anvil — gets
 *    hit when the tup reaches bottom.
 *  - Lights: ambient + key + peach rim + saffron strike flash + heat glow.
 *  - Sparks: <Sparkles> burst on strike.
 *  - Camera: small progress tilt + 0.5s decaying shake on impact.
 *  - Reduced-motion: static struck pose, no sparks/glow/shake.
 */
function Scene({
  progress,
  reduced,
}: {
  progress: number;
  reduced: boolean;
}) {
  const tupRef = useRef<THREE.Group>(null);
  const billetRef = useRef<THREE.Mesh>(null);
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

  // Tup parking position (top of stroke) vs strike position (just kissing
  // the work-piece on top of the anvil).
  const TUP_TOP = 36;
  const TUP_HIT = 4.5;

  useFrame(({ camera }, rawDelta) => {
    // Cap delta so paused-tab unfreezes don't snap the scene.
    const delta = Math.min(rawDelta, 1 / 30);

    if (tupRef.current) {
      // Tup descends linearly with progress; smoothed lerp to feel weighty.
      const targetY = TUP_TOP - (TUP_TOP - TUP_HIT) * clamped;
      tupRef.current.position.y +=
        (targetY - tupRef.current.position.y) * Math.min(1, delta * 14);
    }

    // Billet "squish" on strike (very subtle scale-y compression).
    if (billetRef.current) {
      const targetScale = struck ? 0.78 : 1;
      billetRef.current.scale.y +=
        (targetScale - billetRef.current.scale.y) * Math.min(1, delta * 10);
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
        heatRef.current.intensity = struck ? 2 : 0.6; // ambient billet glow
      } else {
        const t = sparkOpacity.current;
        const triangle =
          t <= 0
            ? 0.6 // resting ambient glow on the billet
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

  // ----- materials ------------------------------------------------------

  /** Cast iron — slightly more matte than the rest. */
  const ironMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.7,
        roughness: 0.55,
      }),
    [],
  );
  /** Mid-finish steel for the frame/posts. */
  const steelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.85,
        roughness: 0.4,
      }),
    [],
  );
  /** Polished steel for the cylinder housing + dies. */
  const polishedMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a3f44",
        metalness: 0.95,
        roughness: 0.22,
      }),
    [],
  );
  /** Foundation — slightly lighter, almost grout. */
  const foundationMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2c30",
        metalness: 0.3,
        roughness: 0.85,
      }),
    [],
  );
  /** Glowing hot billet — emissive saffron. */
  const billetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.mesh,
        emissive: BRAND_HEX.saffron,
        emissiveIntensity: 1.4,
        metalness: 0.3,
        roughness: 0.6,
      }),
    [],
  );

  // ----- geometries (reused via primitive) ------------------------------

  // Foundation: broad low slab
  const foundationGeom = useMemo(
    () => new THREE.BoxGeometry(72, 6, 30),
    [],
  );
  // Anvil: stepped cast-iron block. Three stacked pieces give it the
  // classic narrowing silhouette.
  const anvilBottomGeom = useMemo(() => new THREE.BoxGeometry(36, 8, 22), []);
  const anvilMidGeom = useMemo(() => new THREE.BoxGeometry(28, 6, 18), []);
  const anvilTopGeom = useMemo(() => new THREE.BoxGeometry(22, 4, 14), []);
  const anvilDieGeom = useMemo(() => new THREE.BoxGeometry(18, 1.5, 12), []);
  // H-frame: two vertical posts + cross-head
  const postGeom = useMemo(() => new THREE.BoxGeometry(5, 70, 6), []);
  const crossheadGeom = useMemo(() => new THREE.BoxGeometry(58, 7, 14), []);
  // Cylinder housing — the steam/pneumatic cap on top
  const cylinderGeom = useMemo(
    () => new THREE.CylinderGeometry(11, 11, 18, 32),
    [],
  );
  const cylinderCapGeom = useMemo(
    () => new THREE.CylinderGeometry(13, 13, 3, 32),
    [],
  );
  // Tup (ram) — heavy block + bottom die
  const tupGeom = useMemo(() => new THREE.BoxGeometry(16, 14, 12), []);
  const tupDieGeom = useMemo(() => new THREE.BoxGeometry(16, 1.5, 12), []);
  // Piston rod going up into the cylinder housing
  const pistonRodGeom = useMemo(
    () => new THREE.CylinderGeometry(2.4, 2.4, 32, 16),
    [],
  );
  // Tie-rods (slender vertical bolts visible on real hammers)
  const tieRodGeom = useMemo(
    () => new THREE.CylinderGeometry(0.7, 0.7, 64, 12),
    [],
  );
  // Bolt heads — small flat cylinders
  const boltGeom = useMemo(
    () => new THREE.CylinderGeometry(1.3, 1.3, 1, 16),
    [],
  );
  // Hot work-piece
  const billetGeom = useMemo(() => new THREE.BoxGeometry(7, 5, 6), []);

  // Edge-overlay geometries for the saffron rim accents on the moving parts
  const tupEdges = useMemo(
    () => new THREE.EdgesGeometry(tupGeom),
    [tupGeom],
  );
  const cylinderEdges = useMemo(
    () => new THREE.EdgesGeometry(cylinderGeom),
    [cylinderGeom],
  );

  // Mesh-orange tech accent on the static frame
  const crossheadEdges = useMemo(
    () => new THREE.EdgesGeometry(crossheadGeom),
    [crossheadGeom],
  );

  // ----- positions ------------------------------------------------------
  // y=0 floor level
  const FOUNDATION_Y = -32;
  const ANVIL_BOTTOM_Y = -22;
  const ANVIL_MID_Y = -15;
  const ANVIL_TOP_Y = -10;
  const ANVIL_DIE_Y = -7.25;
  const POST_Y = 0; // posts centered around 0 (height 70 so span -35..+35)
  const CROSSHEAD_Y = 36; // top of posts
  const CYLINDER_Y = 49; // sits on cross-head
  const CYLINDER_CAP_Y = 60;
  const BILLET_Y = -5.5;

  return (
    <>
      <ambientLight intensity={0.55} />
      {/* Key directional */}
      <directionalLight
        position={[16, 28, 12]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color={BRAND_HEX.snow}
      />
      {/* Fill from camera-right */}
      <directionalLight
        position={[22, 4, 18]}
        intensity={0.5}
        color={BRAND_HEX.snow}
      />
      {/* Peach rim from back-left */}
      <directionalLight
        position={[-18, 10, -12]}
        intensity={0.55}
        color={BRAND_HEX.peach}
      />
      {/* Saffron strike flash from directly above */}
      <directionalLight
        ref={flashRef}
        position={[0, 36, 0]}
        intensity={0}
        color={BRAND_HEX.saffron}
      />
      {/* Heat glow pointLight on the billet */}
      <pointLight
        ref={heatRef}
        position={[0, BILLET_Y, 0]}
        intensity={0.6}
        color={BRAND_HEX.mesh}
        distance={70}
        decay={2}
      />

      {/* Foundation */}
      <mesh
        position={[0, FOUNDATION_Y, 0]}
        receiveShadow
        material={foundationMat}
      >
        <primitive object={foundationGeom} attach="geometry" />
      </mesh>

      {/* Anvil — three stacked tiers */}
      <mesh
        position={[0, ANVIL_BOTTOM_Y, 0]}
        castShadow
        receiveShadow
        material={ironMat}
      >
        <primitive object={anvilBottomGeom} attach="geometry" />
      </mesh>
      <mesh
        position={[0, ANVIL_MID_Y, 0]}
        castShadow
        receiveShadow
        material={ironMat}
      >
        <primitive object={anvilMidGeom} attach="geometry" />
      </mesh>
      <mesh
        position={[0, ANVIL_TOP_Y, 0]}
        castShadow
        receiveShadow
        material={ironMat}
      >
        <primitive object={anvilTopGeom} attach="geometry" />
      </mesh>
      {/* Anvil bottom die (polished plate) */}
      <mesh
        position={[0, ANVIL_DIE_Y, 0]}
        castShadow
        receiveShadow
        material={polishedMat}
      >
        <primitive object={anvilDieGeom} attach="geometry" />
      </mesh>

      {/* Hot billet sitting on the bottom die */}
      <mesh
        ref={billetRef}
        position={[0, BILLET_Y, 0]}
        castShadow
        material={billetMat}
      >
        <primitive object={billetGeom} attach="geometry" />
      </mesh>

      {/* H-frame posts — left & right */}
      {[-26, 26].map((x) => (
        <mesh
          key={`post-${x}`}
          position={[x, POST_Y, 0]}
          castShadow
          receiveShadow
          material={steelMat}
        >
          <primitive object={postGeom} attach="geometry" />
        </mesh>
      ))}

      {/* Tie rods (slender bolts) in front of each post */}
      {[-26, 26].map((x) => (
        <mesh
          key={`tie-${x}`}
          position={[x, POST_Y, 7.2]}
          material={steelMat}
        >
          <primitive object={tieRodGeom} attach="geometry" />
        </mesh>
      ))}

      {/* Cross-head connecting the post tops */}
      <mesh
        position={[0, CROSSHEAD_Y, 0]}
        castShadow
        receiveShadow
        material={steelMat}
      >
        <primitive object={crossheadGeom} attach="geometry" />
      </mesh>
      <lineSegments position={[0, CROSSHEAD_Y, 0]}>
        <primitive object={crossheadEdges} attach="geometry" />
        <lineBasicMaterial color={BRAND_HEX.mesh} transparent opacity={0.18} />
      </lineSegments>

      {/* Bolt heads on the cross-head corners */}
      {[
        [-24, CROSSHEAD_Y, 7.5],
        [24, CROSSHEAD_Y, 7.5],
        [-24, CROSSHEAD_Y, -7.5],
        [24, CROSSHEAD_Y, -7.5],
      ].map(([x, y, z], i) => (
        <mesh
          key={`bolt-${i}`}
          position={[x, y + 4, z]}
          rotation={[0, 0, 0]}
          material={polishedMat}
        >
          <primitive object={boltGeom} attach="geometry" />
        </mesh>
      ))}

      {/* Cylinder housing on top of the cross-head */}
      <mesh
        position={[0, CYLINDER_Y, 0]}
        castShadow
        receiveShadow
        material={polishedMat}
      >
        <primitive object={cylinderGeom} attach="geometry" />
      </mesh>
      <lineSegments position={[0, CYLINDER_Y, 0]}>
        <primitive object={cylinderEdges} attach="geometry" />
        <lineBasicMaterial color={BRAND_HEX.saffron} transparent opacity={0.4} />
      </lineSegments>
      <mesh position={[0, CYLINDER_CAP_Y, 0]} castShadow material={steelMat}>
        <primitive object={cylinderCapGeom} attach="geometry" />
      </mesh>

      {/* Tup (ram) — moves vertically. Wrap the head + die + piston rod
          in one group so they slide together. */}
      <group ref={tupRef} position={[0, TUP_TOP, 0]}>
        {/* Tup body */}
        <mesh castShadow material={steelMat}>
          <primitive object={tupGeom} attach="geometry" />
        </mesh>
        {/* Saffron rim on the tup so the moving part reads against the frame */}
        <lineSegments>
          <primitive object={tupEdges} attach="geometry" />
          <lineBasicMaterial color={BRAND_HEX.saffron} transparent opacity={0.6} />
        </lineSegments>
        {/* Top die (the polished face that hits the work-piece) */}
        <mesh position={[0, -7.75, 0]} castShadow material={polishedMat}>
          <primitive object={tupDieGeom} attach="geometry" />
        </mesh>
        {/* Piston rod going up into the cylinder housing */}
        <mesh position={[0, 23, 0]} castShadow material={polishedMat}>
          <primitive object={pistonRodGeom} attach="geometry" />
        </mesh>
      </group>

      {/* Sparks on strike — emit at billet level */}
      <group ref={sparkleGroupRef} position={[0, BILLET_Y + 1, 0]} visible={false}>
        <Sparkles
          count={80}
          size={6}
          speed={0.8}
          scale={[18, 8, 12]}
          color={BRAND_HEX.saffron}
        />
      </group>

      <ContactShadows
        position={[0, FOUNDATION_Y - 0.1, 0]}
        opacity={0.55}
        scale={140}
        blur={2.4}
        far={50}
      />
    </>
  );
}

export function HammerStrikeHero({ progress, className }: HammerStrikeHeroProps) {
  // Slight floor-ward gradient so the foundation has a place to sit; warm
  // saffron whisper near the bottom mirrors the heat coming off the billet.
  const stageBackground = `radial-gradient(120% 80% at 50% 35%, ${BRAND_HEX.snow} 0%, ${BRAND_HEX.renderBg} 55%, #c8c4c1 100%)`;
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
      <Canvas dpr={[1, 2]} camera={{ position: [0, 14, 110], fov: 35 }} shadows>
        <Scene progress={progress} reduced={reduced} />
      </Canvas>
    </div>
  );
}

export default HammerStrikeHero;
