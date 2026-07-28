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
import { useReducedMotion } from "@/lib/use-reduced-motion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { configureGltfLoader, extractGeometry } from "./glb";
import { BRAND_HEX } from "@/lib/brand";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";

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
  const gltf = useLoader(GLTFLoader, src, configureGltfLoader);
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geom = extractGeometry(gltf);
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
  }, [gltf]);

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

/**
 * R3F-primitive placeholder shown while the model streams in — crossed
 * wireframe torus rings, same shape language as `StlViewer`'s
 * `AnvilWireframe` (duplicated here rather than shared, matching this
 * file's existing pattern of standalone R3F setup). Must be built from
 * three.js primitives, not DOM/SVG: this renders as a child of `<Canvas>`,
 * whose custom reconciler only understands scene-graph nodes.
 */
function PreviewWireframe() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[40, 1.2, 16, 80]} />
        <meshBasicMaterial color={BRAND_HEX.mesh} wireframe />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[40, 1.2, 16, 80]} />
        <meshBasicMaterial color={BRAND_HEX.mesh} wireframe />
      </mesh>
    </group>
  );
}

/**
 * Cheap on-brand placeholder for the WebGL-unavailable fallback — a static
 * crossed-ring wireframe rendered as plain SVG/DOM (this one sits *outside*
 * `<Canvas>`, swapped in by `CanvasErrorBoundary`, so regular DOM is fine
 * here unlike `PreviewWireframe` above). No new image assets.
 */
function TilePlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full p-8 text-mesh opacity-60"
      aria-hidden="true"
    >
      <ellipse
        cx="50"
        cy="50"
        rx="34"
        ry="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="12"
        ry="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/**
 * Shown in place of the canvas when WebGL itself is unavailable (GPU
 * disabled, too many live contexts, ancient browser) — a real static
 * fallback rather than a blank tile, per `CanvasErrorBoundary`.
 */
function WebglUnavailable() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
      <TilePlaceholder />
      <span className="relative font-eyebrow text-[9px] uppercase tracking-[0.2em] text-steel">
        Preview unavailable
      </span>
    </div>
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

  // `ariaLabel` is only meaningful when this tile is the sole description
  // of the part (e.g. MethodsPinned's sample-part callout). When a caller
  // wraps the tile in a `<Link>`/container that already carries the same
  // info as visible text (the /renders grid does — title + product name
  // sit right below it), repeating it here as a second `role="img"`
  // accessible name just makes screen readers announce it twice. So:
  // labelled + exposed when a label is passed, decorative + hidden when
  // it isn't — callers opt in per usage instead of this component guessing.
  const hasLabel = Boolean(ariaLabel);

  return (
    <div
      ref={setRefAndObserve}
      role={hasLabel ? "img" : undefined}
      aria-label={hasLabel ? ariaLabel : undefined}
      aria-hidden={hasLabel ? undefined : true}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "relative aspect-square w-full overflow-hidden",
        className ?? "",
      ].join(" ")}
      style={{ background: stageBackground }}
    >
      {inView && (
        <CanvasErrorBoundary fallback={<WebglUnavailable />}>
          <Canvas
            // DPR capped at 1 — marquee tiles are 280×360 and rotating
            // gently, so super-sampling above device pixels burns GPU
            // for no visible win. Crucial when up to 8 of these mount
            // on viewport entry.
            dpr={[1, 1]}
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
            <Suspense fallback={<PreviewWireframe />}>
              <SpinningModel
                src={src}
                hovered={hovered}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      )}
    </div>
  );
}

export default StlPreview;
