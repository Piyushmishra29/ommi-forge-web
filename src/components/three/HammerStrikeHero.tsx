"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { BRAND_HEX } from "@/lib/brand";

/**
 * The hero accepts EITHER a raw number OR a React ref carrying a
 * number. The ref form is preferred for scroll-driven usage because it
 * lets the parent mutate the value every frame without re-rendering the
 * R3F subtree — `useFrame` reads `ref.current` on each tick.
 */
export type HammerStrikeProgress = number | { readonly current: number };

export type HammerStrikeHeroProps = {
  /** 0..1 scrubbed by the parent (e.g. GSAP ScrollTrigger). */
  progress: HammerStrikeProgress;
  className?: string;
};

function readProgress(p: HammerStrikeProgress): number {
  return typeof p === 'number' ? p : (p.current ?? 0);
}

/**
 * Industrial belt drop-hammer scene driven entirely by an external
 * `progress` prop. Modelled on the friction/belt drop hammers built by
 * makers like NKH (Ludhiana) — tall vertical guide slides, a long drop
 * rod extending up from the tup between two grooved drum pulleys with
 * a belt that grips it. No steam cylinder; this is a gravity drop.
 *
 * Composition:
 *  - Foundation: broad concrete-tone slab.
 *  - Anvil: stepped cast-iron block, polished bottom die on top.
 *  - Hot work-piece: emissive saffron billet that squishes on impact.
 *  - H-frame: two tall vertical guide posts + horizontal cross-head.
 *  - Tup (ram): heavy block + polished top die + long drop rod.
 *  - Belt mechanism: two horizontal drum pulleys at the top with a
 *    looped belt running between them; the drop rod passes through.
 *  - Side drive: small flywheel pulley off to the side connected by a
 *    diagonal belt (visual sugar — purely decorative).
 *  - Lights: ambient + key + fill + peach rim + saffron strike flash.
 *  - Sparks on strike; heat-glow ambient on the billet.
 */
function Scene({
  progress,
  reduced,
}: {
  progress: HammerStrikeProgress;
  reduced: boolean;
}) {
  const tupRef = useRef<THREE.Group>(null);
  const billetRef = useRef<THREE.Mesh>(null);
  const beltLeftRef = useRef<THREE.Mesh>(null);
  const beltRightRef = useRef<THREE.Mesh>(null);
  const pulleyTopLeftRef = useRef<THREE.Mesh>(null);
  const pulleyTopRightRef = useRef<THREE.Mesh>(null);
  const driveWheelRef = useRef<THREE.Mesh>(null);
  const cameraShake = useRef(0);
  const impactPulse = useRef(0);
  const heatRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.DirectionalLight>(null);
  const sparkleGroupRef = useRef<THREE.Group>(null);
  const sparkOpacity = useRef(0);
  const wasStruck = useRef(false);

  // Tup parking position (top of stroke) vs strike position (just kissing
  // the work-piece on top of the anvil).
  const TUP_TOP = 38;
  const TUP_HIT = 4.5;

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    // Resolve the progress source EVERY frame so a parent that passes
    // a ref (mutated by the PinnedSection scroll subscriber) keeps
    // driving us without re-rendering the React subtree.
    const rawProgress = readProgress(progress);
    const clamped = Math.min(1, Math.max(0, rawProgress));
    const struck = clamped > 0.95;

    if (tupRef.current) {
      const targetY = TUP_TOP - (TUP_TOP - TUP_HIT) * clamped;
      tupRef.current.position.y +=
        (targetY - tupRef.current.position.y) * Math.min(1, delta * 14);
    }

    if (billetRef.current) {
      const targetScale = struck ? 0.78 : 1;
      billetRef.current.scale.y +=
        (targetScale - billetRef.current.scale.y) * Math.min(1, delta * 10);
    }

    // Belt wraps continuously around the two drums — visually, the belt
    // strips slide along the Y axis at a rate proportional to the drum
    // rotation. Drums spin slower while parked, faster as the tup falls.
    const beltSpeed = 0.8 + clamped * 1.8;
    if (pulleyTopLeftRef.current) pulleyTopLeftRef.current.rotation.x += delta * beltSpeed * 5;
    if (pulleyTopRightRef.current) pulleyTopRightRef.current.rotation.x += delta * beltSpeed * 5;
    if (driveWheelRef.current) driveWheelRef.current.rotation.x += delta * beltSpeed * 3.5;
    if (beltLeftRef.current) {
      beltLeftRef.current.position.y += delta * beltSpeed * 4;
      if (beltLeftRef.current.position.y > 4) beltLeftRef.current.position.y -= 8;
    }
    if (beltRightRef.current) {
      beltRightRef.current.position.y -= delta * beltSpeed * 4;
      if (beltRightRef.current.position.y < -4) beltRightRef.current.position.y += 8;
    }

    if (!reduced && struck && !wasStruck.current) {
      impactPulse.current = 0.5;
      sparkOpacity.current = 1.2;
    }
    wasStruck.current = struck;

    const baseTilt = (1.5 * Math.PI) / 180;
    camera.rotation.y = -baseTilt * (clamped - 0.5);

    if (!reduced && impactPulse.current > 0) {
      const decay = impactPulse.current / 0.5;
      cameraShake.current = Math.sin(performance.now() * 0.04) * 0.02 * decay;
      impactPulse.current = Math.max(0, impactPulse.current - delta);
    } else {
      cameraShake.current *= 1 - Math.min(1, delta * 6);
    }
    camera.rotation.z = cameraShake.current;

    if (heatRef.current) {
      if (reduced) {
        heatRef.current.intensity = struck ? 2 : 0.6;
      } else {
        const t = sparkOpacity.current;
        const triangle =
          t <= 0
            ? 0.6
            : t > 0.8
              ? ((1.2 - t) / 0.4) * 4
              : (t / 0.8) * 4;
        heatRef.current.intensity = triangle;
      }
    }

    if (flashRef.current) {
      if (reduced) {
        flashRef.current.intensity = struck ? 1.8 : 0;
      } else {
        const t = sparkOpacity.current;
        flashRef.current.intensity = t > 0.95 ? 1.8 : 0;
      }
    }

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

  const ironMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.7,
        roughness: 0.55,
      }),
    [],
  );
  const steelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRAND_HEX.graphite,
        metalness: 0.85,
        roughness: 0.4,
      }),
    [],
  );
  const polishedMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a3f44",
        metalness: 0.95,
        roughness: 0.22,
      }),
    [],
  );
  const foundationMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2c30",
        metalness: 0.3,
        roughness: 0.85,
      }),
    [],
  );
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
  /** Worn leather belt — warm brown-ish, very matte. */
  const beltMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3d2a1c",
        metalness: 0.0,
        roughness: 0.95,
      }),
    [],
  );

  // ----- geometries -----------------------------------------------------

  const foundationGeom = useMemo(() => new THREE.BoxGeometry(78, 6, 32), []);
  const anvilBottomGeom = useMemo(() => new THREE.BoxGeometry(36, 8, 22), []);
  const anvilMidGeom = useMemo(() => new THREE.BoxGeometry(28, 6, 18), []);
  const anvilTopGeom = useMemo(() => new THREE.BoxGeometry(22, 4, 14), []);
  const anvilDieGeom = useMemo(() => new THREE.BoxGeometry(18, 1.5, 12), []);

  // Tall H-frame guide posts — these are the vertical slides the tup
  // rides between. Drop-hammer posts are typically 4–6× the anvil's
  // depth tall.
  const postGeom = useMemo(() => new THREE.BoxGeometry(5, 84, 6), []);
  const crossheadGeom = useMemo(() => new THREE.BoxGeometry(58, 8, 14), []);
  const crossheadCapGeom = useMemo(() => new THREE.BoxGeometry(62, 3, 16), []);

  // Tup + dies + drop rod
  const tupGeom = useMemo(() => new THREE.BoxGeometry(16, 14, 12), []);
  const tupDieGeom = useMemo(() => new THREE.BoxGeometry(16, 1.5, 12), []);
  // Drop rod — long thin steel rod extending UP from the tup, gripped
  // by the belt mechanism above. This is the visual signature of a
  // belt drop hammer.
  const dropRodGeom = useMemo(
    () => new THREE.CylinderGeometry(1.2, 1.2, 56, 16),
    [],
  );
  const dropRodCapGeom = useMemo(
    () => new THREE.CylinderGeometry(2.2, 2.2, 2.5, 16),
    [],
  );

  // Twin drum pulleys at the top — these are the friction wheels that
  // grip the drop rod. Cylinder rotated 90° so its axis is horizontal.
  const pulleyGeom = useMemo(
    () => new THREE.CylinderGeometry(5, 5, 9, 24),
    [],
  );
  const pulleyHubGeom = useMemo(
    () => new THREE.CylinderGeometry(1.5, 1.5, 11, 16),
    [],
  );

  // Belt strips — two flat vertical bands wrapping between the pulleys.
  const beltStripGeom = useMemo(() => new THREE.BoxGeometry(1.2, 8, 7), []);

  // Side drive flywheel — a bigger pulley off to one side, connected
  // by a diagonal drive belt.
  const driveWheelGeom = useMemo(
    () => new THREE.CylinderGeometry(8, 8, 4, 24),
    [],
  );
  const driveBeltGeom = useMemo(() => new THREE.BoxGeometry(0.6, 32, 1.5), []);

  // Foot pedal — operator pulls a rope/pedal to clutch the belt
  const pedalGeom = useMemo(() => new THREE.BoxGeometry(8, 1.2, 3), []);
  const pedalRodGeom = useMemo(
    () => new THREE.CylinderGeometry(0.5, 0.5, 18, 8),
    [],
  );

  // Tie-rods + bolts for industrial detail
  const tieRodGeom = useMemo(
    () => new THREE.CylinderGeometry(0.7, 0.7, 78, 12),
    [],
  );
  const boltGeom = useMemo(
    () => new THREE.CylinderGeometry(1.3, 1.3, 1, 16),
    [],
  );
  const billetGeom = useMemo(() => new THREE.BoxGeometry(7, 5, 6), []);

  const tupEdges = useMemo(() => new THREE.EdgesGeometry(tupGeom), [tupGeom]);
  const crossheadEdges = useMemo(
    () => new THREE.EdgesGeometry(crossheadGeom),
    [crossheadGeom],
  );

  // ----- positions ------------------------------------------------------
  const FOUNDATION_Y = -32;
  const ANVIL_BOTTOM_Y = -22;
  const ANVIL_MID_Y = -15;
  const ANVIL_TOP_Y = -10;
  const ANVIL_DIE_Y = -7.25;
  const POST_Y = 9; // posts (height 84) centered at +9 so they span -33..+51
  const CROSSHEAD_Y = 48;
  const CROSSHEAD_CAP_Y = 53.5;
  const PULLEY_Y = 56;
  const DRIVE_WHEEL_Y = 42;
  const BILLET_Y = -5.5;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[16, 28, 12]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color={BRAND_HEX.snow}
      />
      <directionalLight
        position={[22, 4, 18]}
        intensity={0.5}
        color={BRAND_HEX.snow}
      />
      <directionalLight
        position={[-18, 10, -12]}
        intensity={0.55}
        color={BRAND_HEX.peach}
      />
      <directionalLight
        ref={flashRef}
        position={[0, 36, 0]}
        intensity={0}
        color={BRAND_HEX.saffron}
      />
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

      {/* Anvil — stacked tiers + polished bottom die */}
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
      <mesh
        position={[0, ANVIL_DIE_Y, 0]}
        castShadow
        receiveShadow
        material={polishedMat}
      >
        <primitive object={anvilDieGeom} attach="geometry" />
      </mesh>

      {/* Hot saffron billet */}
      <mesh
        ref={billetRef}
        position={[0, BILLET_Y, 0]}
        castShadow
        material={billetMat}
      >
        <primitive object={billetGeom} attach="geometry" />
      </mesh>

      {/* Tall H-frame guide posts */}
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

      {/* Tie-rods in front of each post */}
      {[-26, 26].map((x) => (
        <mesh
          key={`tie-${x}`}
          position={[x, POST_Y, 7.2]}
          material={steelMat}
        >
          <primitive object={tieRodGeom} attach="geometry" />
        </mesh>
      ))}

      {/* Cross-head — heavy beam connecting the post tops */}
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
      {/* Cap plate above the cross-head */}
      <mesh
        position={[0, CROSSHEAD_CAP_Y, 0]}
        castShadow
        material={polishedMat}
      >
        <primitive object={crossheadCapGeom} attach="geometry" />
      </mesh>

      {/* Bolt heads on the cross-head corners */}
      {[
        [-24, CROSSHEAD_CAP_Y + 2, 7.5],
        [24, CROSSHEAD_CAP_Y + 2, 7.5],
        [-24, CROSSHEAD_CAP_Y + 2, -7.5],
        [24, CROSSHEAD_CAP_Y + 2, -7.5],
      ].map(([x, y, z], i) => (
        <mesh
          key={`bolt-${i}`}
          position={[x, y, z]}
          material={polishedMat}
        >
          <primitive object={boltGeom} attach="geometry" />
        </mesh>
      ))}

      {/* Twin drum pulleys at the top — the friction wheels that grip
          the drop rod. Cylinder rotated so its axis runs left↔right. */}
      <mesh
        ref={pulleyTopLeftRef}
        position={[-4, PULLEY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        material={polishedMat}
      >
        <primitive object={pulleyGeom} attach="geometry" />
      </mesh>
      <mesh
        position={[-4, PULLEY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={steelMat}
      >
        <primitive object={pulleyHubGeom} attach="geometry" />
      </mesh>
      <mesh
        ref={pulleyTopRightRef}
        position={[4, PULLEY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        material={polishedMat}
      >
        <primitive object={pulleyGeom} attach="geometry" />
      </mesh>
      <mesh
        position={[4, PULLEY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={steelMat}
      >
        <primitive object={pulleyHubGeom} attach="geometry" />
      </mesh>

      {/* Belt strips — two flat bands looping between the drum pulleys.
          We animate their Y position to fake belt scroll. The belt
          actually pinches the drop rod between the two pulleys. */}
      <mesh
        ref={beltLeftRef}
        position={[-5.7, PULLEY_Y, 0]}
        castShadow
        material={beltMat}
      >
        <primitive object={beltStripGeom} attach="geometry" />
      </mesh>
      <mesh
        ref={beltRightRef}
        position={[5.7, PULLEY_Y, 0]}
        castShadow
        material={beltMat}
      >
        <primitive object={beltStripGeom} attach="geometry" />
      </mesh>

      {/* Side drive flywheel + diagonal drive belt running to the
          drum pulleys. Visual sugar — sells the "powered" feel. */}
      <mesh
        ref={driveWheelRef}
        position={[34, DRIVE_WHEEL_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        material={polishedMat}
      >
        <primitive object={driveWheelGeom} attach="geometry" />
      </mesh>
      <mesh
        position={[34, DRIVE_WHEEL_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={steelMat}
      >
        <primitive object={pulleyHubGeom} attach="geometry" />
      </mesh>
      {/* Diagonal drive belt connecting flywheel → drum (angled) */}
      <mesh
        position={[19, (DRIVE_WHEEL_Y + PULLEY_Y) / 2, 2]}
        rotation={[0, 0, -Math.atan2(PULLEY_Y - DRIVE_WHEEL_Y, 30)]}
        material={beltMat}
      >
        <primitive object={driveBeltGeom} attach="geometry" />
      </mesh>

      {/* Operator pedal + linkage rod (right-front corner) */}
      <mesh position={[20, FOUNDATION_Y + 4.5, 14]} material={steelMat}>
        <primitive object={pedalGeom} attach="geometry" />
      </mesh>
      <mesh position={[20, FOUNDATION_Y + 14, 12.5]} material={steelMat}>
        <primitive object={pedalRodGeom} attach="geometry" />
      </mesh>

      {/* Tup (ram) + die + drop rod — all move together vertically.
          The drop rod is the signature of a belt drop hammer: a long
          thin steel rod sticking up from the tup, gripped between the
          two drum pulleys above. */}
      <group ref={tupRef} position={[0, TUP_TOP, 0]}>
        {/* Tup body */}
        <mesh castShadow material={steelMat}>
          <primitive object={tupGeom} attach="geometry" />
        </mesh>
        <lineSegments>
          <primitive object={tupEdges} attach="geometry" />
          <lineBasicMaterial
            color={BRAND_HEX.saffron}
            transparent
            opacity={0.6}
          />
        </lineSegments>
        {/* Top die */}
        <mesh position={[0, -7.75, 0]} castShadow material={polishedMat}>
          <primitive object={tupDieGeom} attach="geometry" />
        </mesh>
        {/* Drop rod — long thin rod extending up between the drum
            pulleys. Centered at +35 above the tup's origin so its top
            sits just below the pulleys at +56. */}
        <mesh position={[0, 35, 0]} castShadow material={polishedMat}>
          <primitive object={dropRodGeom} attach="geometry" />
        </mesh>
        {/* Small cap on the very top of the rod */}
        <mesh position={[0, 63, 0]} castShadow material={polishedMat}>
          <primitive object={dropRodCapGeom} attach="geometry" />
        </mesh>
      </group>

      {/* Sparks on strike — emit at billet level */}
      <group
        ref={sparkleGroupRef}
        position={[0, BILLET_Y + 1, 0]}
        visible={false}
      >
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

export function HammerStrikeHero({
  progress,
  className,
}: HammerStrikeHeroProps) {
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
      {/* Pulled back further + framed taller to fit the post + drop-rod */}
      <Canvas dpr={[1, 2]} camera={{ position: [4, 20, 130], fov: 32 }} shadows>
        <Scene progress={progress} reduced={reduced} />
      </Canvas>
    </div>
  );
}

export default HammerStrikeHero;
