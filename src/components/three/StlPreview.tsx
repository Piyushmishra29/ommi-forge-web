"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

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

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    const speed = hovered ? 1.2 : 0.4;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#FF5533"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export function StlPreview({ src, className, ariaLabel }: StlPreviewProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Native IntersectionObserver — only load the STL once the tile scrolls in.
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
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "relative aspect-square w-full overflow-hidden",
        "bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#D9D9D9_70%)]",
        className ?? "",
      ].join(" ")}
    >
      {inView && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 200], fov: 35 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#D9D9D9"]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[10, 18, 10]} intensity={1.2} />
          <directionalLight
            position={[-12, 6, -8]}
            intensity={0.35}
            color="#FFBC7D"
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
