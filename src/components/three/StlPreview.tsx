"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { BRAND_HEX } from "@/lib/brand";

export type StlPreviewProps = {
  src: string;
  className?: string;
  /** Optional aria label for the tile. */
  ariaLabel?: string;
};

/**
 * Renders the loaded STL with a slow spin. The parent passes `hovered` to
 * speed up rotation ~3x on hover.
 */
function SpinningModel({
  src,
  hovered,
  reducedMotion,
}: {
  src: string;
  hovered: boolean;
  reducedMotion: boolean;
}) {
  const rawGeometry = useLoader(STLLoader, src);
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geom = rawGeometry.clone();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    if (geom.boundingBox) {
      const center = new THREE.Vector3();
      geom.boundingBox.getCenter(center);
      geom.translate(-center.x, -center.y, -center.z);
    }

    geom.computeBoundingSphere();
    if (geom.boundingSphere && geom.boundingSphere.radius > 0) {
      const scale = 50 / geom.boundingSphere.radius;
      geom.scale(scale, scale, scale);
    }

    geom.computeVertexNormals();
    return geom;
  }, [rawGeometry]);

  // Dispose the cloned BufferGeometry when the model unmounts or the
  // underlying STL src changes, otherwise R3F keeps the GPU buffer alive.
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    const speed = hovered ? 1.2 : 0.4;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={BRAND_HEX.mesh}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export function StlPreview({ src, className, ariaLabel }: StlPreviewProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Callback ref that wires up an IntersectionObserver the moment the host
  // <div> mounts. By performing the `setInView(true)` from inside the
  // observer callback (which lives outside any effect), we sidestep the
  // `react-hooks/set-state-in-effect` rule entirely. The observer
  // self-disconnects after the first intersection so we never re-fire.
  const observerRef = useRef<IntersectionObserver | null>(null);
  const setRefAndObserve = useCallback((node: HTMLDivElement | null) => {
    // Tear down any previous observer first.
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    // SSR / non-browser bail-out — render immediately.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  const stageBackground = `radial-gradient(circle at center, ${BRAND_HEX.snow} 0%, ${BRAND_HEX.renderBg} 70%)`;

  return (
    <div
      ref={setRefAndObserve}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "relative aspect-square w-full overflow-hidden",
        className ?? "",
      ].join(" ")}
      style={{ background: stageBackground }}
    >
      {inView && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 200], fov: 35 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[BRAND_HEX.renderBg]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[10, 18, 10]} intensity={1.2} />
          <directionalLight
            position={[-12, 6, -8]}
            intensity={0.35}
            color={BRAND_HEX.peach}
          />
          <Suspense fallback={null}>
            <SpinningModel
              src={src}
              hovered={hovered}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default StlPreview;
