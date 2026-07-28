"use client";

import {
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useProgress } from "@react-three/drei";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { configureGltfLoader, extractGeometry } from "./glb";
import { BRAND_HEX } from "@/lib/brand";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";

type OrbitControlsHandle = React.ComponentRef<typeof OrbitControls>;

export type StlViewerProps = {
  src: string;
  title?: string;
  productName?: string;
  /** Longer text description of the part (e.g. the render's blurb). Used
   *  as the a11y description for the whole viewer via `aria-describedby`
   *  — a `<canvas>` has nothing for assistive tech to read on its own. */
  description?: string;
  /** Byte size of `src`, if known, so the toolbar download control can
   *  disclose format + size instead of a bare "Download". Purely cosmetic
   *  (label text) — omit if the caller doesn't have it handy. */
  modelSizeBytes?: number;
  autoRotate?: boolean;
  className?: string;
};

/** `2.1 MB` — binary MiB, matching how file managers/browsers show size. */
function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Auto-frames the loaded STL into a roughly 100-unit viewbox and re-centers it.
 * Caches per src so we don't recompute the bounding sphere on every re-render.
 */
function StlModel({ src }: { src: string }) {
  const gltf = useLoader(GLTFLoader, src, configureGltfLoader);

  const geometry = useMemo(() => {
    const geom = extractGeometry(gltf);
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    // Center the part around the origin.
    if (geom.boundingBox) {
      const center = new THREE.Vector3();
      geom.boundingBox.getCenter(center);
      geom.translate(-center.x, -center.y, -center.z);
    }

    // Re-compute after translation, then normalize scale so the part fits
    // a viewbox ~100 units across (the camera at z=200 with fov 35 will see it).
    geom.computeBoundingSphere();
    if (geom.boundingSphere && geom.boundingSphere.radius > 0) {
      const targetRadius = 50; // viewbox of ~100 across
      const scale = targetRadius / geom.boundingSphere.radius;
      geom.scale(scale, scale, scale);
    }

    geom.computeVertexNormals();
    return geom;
  }, [gltf]);

  // Dispose the cloned geometry on unmount / src change so we don't
  // leak GPU buffers across navigations.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={BRAND_HEX.mesh}
        metalness={0.7}
        roughness={0.35}
        envMapIntensity={1}
      />
    </mesh>
  );
}

/**
 * Placeholder shown while the STL streams in: two crossed thin torus rings
 * holding the brand mesh color. Cheap, on-brand, no external assets.
 */
function AnvilWireframe() {
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
 * Static fallback swapped in for the entire `<Canvas>` by
 * `CanvasErrorBoundary` when WebGL context creation itself fails (GPU
 * disabled, too many live contexts, ancient/locked-down browser). Reuses
 * the wireframe motif so it reads as "part unavailable to preview", not
 * "site broken" — plain DOM/SVG, safe here because it renders *outside*
 * the R3F reconciler, unlike `AnvilWireframe` above.
 */
function WebglUnavailable() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <svg
        width="72"
        height="72"
        viewBox="0 0 100 100"
        className="text-mesh opacity-70"
        aria-hidden="true"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="34"
          ry="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="12"
          ry="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <p className="max-w-[26ch] font-eyebrow text-[11px] uppercase leading-relaxed tracking-[0.15em] text-steel">
        3D preview isn&apos;t available in this browser — use the download
        button to get the model file instead.
      </p>
    </div>
  );
}

/**
 * Real load progress for the meshopt GLB. `useProgress` reads three's
 * DefaultLoadingManager (which `useLoader` feeds), so this DOM overlay tracks
 * the actual byte/decoder progress rather than the old frozen wireframe-only
 * wait. Rendered as a sibling of the Canvas — the `AnvilWireframe` Suspense
 * fallback stays behind it while the geometry streams in.
 */
function LoadProgress() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-10 sm:items-center sm:pb-0">
      <span className="inline-flex items-center gap-2 bg-snow/70 px-4 py-2 font-eyebrow text-[10px] uppercase tracking-[0.3em] text-graphite backdrop-blur">
        Loading
        {/* The chip is bg-snow/70 over the near-white render stage, so it
            composites to ≈#F4F4F4–#FFFFFF. saffron measures 1.9–2.1:1
            there — this is the one accent on the site sitting on an
            almost-white surface, and the percentage is real information,
            not decoration. ember is 4.9–5.4:1 across that range. */}
        <span className="text-ember">{Math.round(progress)}%</span>
      </span>
    </div>
  );
}

type IconProps = { className?: string };

const RotateIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </svg>
);

const ResetIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const FullscreenIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 9V4h5" />
    <path d="M20 9V4h-5" />
    <path d="M4 15v5h5" />
    <path d="M20 15v5h-5" />
  </svg>
);

const DownloadIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

export function StlViewer({
  src,
  title,
  productName,
  description,
  modelSizeBytes,
  autoRotate = true,
  className,
}: StlViewerProps) {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const descId = useId();

  // Set by `CanvasErrorBoundary` if WebGL context creation throws. Drives
  // both the fallback panel and hiding the now-nonfunctional
  // rotate/reset/fullscreen/tap-to-activate controls — only Download stays,
  // since it works regardless of whether the canvas ever rendered.
  const [canvasFailed, setCanvasFailed] = useState(false);

  // The effective auto-rotate value is derived from the prop + the user's
  // reduced-motion preference; we never mirror this into state, which keeps
  // us free of the `react-hooks/set-state-in-effect` rule.
  const effectiveAutoRotate = autoRotate && !prefersReducedMotion;

  // The toolbar toggle stores a manual override (`true`/`false`) that wins
  // over the derived value. `null` means "follow the derived value", so
  // changes to the OS reduced-motion preference flow through naturally
  // until the user clicks the toggle for the first time.
  const [manualRotate, setManualRotate] = useState<boolean | null>(null);
  const rotating = manualRotate ?? effectiveAutoRotate;

  // Tap-to-activate gate. On touch devices the OrbitControls drag handler
  // would otherwise swallow vertical swipes, trapping page scroll. Until the
  // user explicitly taps the stage we leave the canvas `pointer-events-none`,
  // so swipes pass straight through to the page (Lenis) and the model just
  // auto-rotates. Once active, the canvas takes pointer events, OrbitControls
  // drives drag/zoom, and `data-lenis-prevent` keeps Lenis from fighting it.
  const [active, setActive] = useState(false);

  const downloadName = src.split("/").pop() ?? "render.glb";

  const handleToggleRotate = () => setManualRotate(!rotating);

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const stageBackground = `radial-gradient(circle at center, ${BRAND_HEX.snow} 0%, ${BRAND_HEX.renderBg} 70%)`;

  // Accessible name + (optional) description for the whole widget. A
  // `<canvas>` is opaque to assistive tech and the toolbar buttons only
  // label themselves individually, so the group as a whole needs its own
  // name — this is what a screen reader announces on entering the region.
  const viewerLabel = [title, productName].filter(Boolean).join(" — ") || "3D model viewer";
  const downloadLabel = modelSizeBytes
    ? `Download 3D model (.glb, ${formatFileSize(modelSizeBytes)})`
    : "Download 3D model (.glb)";

  return (
    <div
      ref={wrapperRef}
      role="group"
      aria-label={viewerLabel}
      aria-describedby={description ? descId : undefined}
      // `data-lenis-prevent` only while active so Lenis stops intercepting
      // wheel/touch and lets OrbitControls own the gesture during inspection.
      {...(active ? { "data-lenis-prevent": "" } : {})}
      className={[
        "relative isolate h-full w-full overflow-hidden",
        className ?? "",
      ].join(" ")}
      style={{ background: stageBackground }}
    >
      {description && (
        <p id={descId} className="sr-only">
          {description}
        </p>
      )}

      <CanvasErrorBoundary
        fallback={<WebglUnavailable />}
        onError={() => setCanvasFailed(true)}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 200], fov: 35 }}
          shadows
          // Inactive: canvas ignores pointers so vertical swipes scroll the
          // page. Active: it captures gestures and `touch-action: none` keeps
          // the browser from hijacking the drag for native scroll.
          className={active ? "pointer-events-auto" : "pointer-events-none"}
          style={{ touchAction: active ? "none" : "pan-y" }}
        >
          <color attach="background" args={[BRAND_HEX.renderBg]} />
          {/*
            Hand-rolled three-point lighting (was: HDRI Environment). The
            previous `<Environment files="/assets/hdr/empty_warehouse_01_1k.hdr">`
            added ~1.6 MB to every /renders/[slug] mount just for image-
            based lighting on the metalness shader. Three explicit lights
            give the model a clean, slightly more dramatic read — a strong
            key from upper-right, a peach warm fill from front-left, and a
            cool rim from behind — without the HDR payload.
          */}
          <ambientLight intensity={0.85} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.6}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight
            position={[-15, 8, 8]}
            intensity={0.55}
            color={BRAND_HEX.peach}
          />
          <directionalLight
            position={[0, 6, -18]}
            intensity={0.35}
            color="#A8C0D6"
          />
          <Suspense fallback={<AnvilWireframe />}>
            <StlModel src={src} />
          </Suspense>
          <ContactShadows
            position={[0, -50, 0]}
            opacity={0.6}
            scale={150}
            blur={2.5}
            far={50}
          />
          <OrbitControls
            ref={controlsRef}
            enabled={active}
            enablePan={false}
            enableZoom
            autoRotate={rotating}
            autoRotateSpeed={1.2}
            minDistance={80}
            maxDistance={350}
          />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Real streaming progress over the wireframe fallback. */}
      {!canvasFailed && <LoadProgress />}

      {/* Tap-to-activate gate. While inactive this transparent button sits
          over the (pointer-events-none) canvas; a tap flips `active` so the
          canvas takes over. It is itself swipe-friendly via `touch-action`
          so a vertical drag scrolls the page instead of activating. Hidden
          once the canvas has failed — there's nothing left to activate. */}
      {!active && !canvasFailed && (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Tap to interact with the 3D model of ${title ?? productName ?? "this part"}`}
          style={{ touchAction: "pan-y" }}
          className="absolute inset-0 z-10 flex items-end justify-center pb-6 sm:items-center sm:pb-0"
        >
          <span className="pointer-events-none inline-flex items-center gap-2 bg-graphite/80 px-4 py-2 font-eyebrow text-[10px] uppercase tracking-[0.25em] text-snow backdrop-blur">
            <RotateIcon className="h-4 w-4" />
            Tap to interact
          </span>
        </button>
      )}

      {/* Exit affordance + caption while inspecting. */}
      {active && !canvasFailed && (
        <button
          type="button"
          onClick={() => setActive(false)}
          className="pointer-events-auto absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-graphite/80 px-4 py-2 font-eyebrow text-[10px] uppercase tracking-[0.22em] text-snow backdrop-blur transition hover:bg-graphite"
        >
          Drag to rotate · tap here to scroll
        </button>
      )}

      {/* Toolbar overlay. Rotate/reset/fullscreen only matter once the
          canvas exists — Download stays either way, since it doesn't
          depend on WebGL at all (it's a plain <a download>). */}
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col gap-2">
        {!canvasFailed && (
          <>
            <ToolbarButton
              label={rotating ? "Pause rotation" : "Auto-rotate"}
              onClick={handleToggleRotate}
            >
              <RotateIcon />
            </ToolbarButton>
            <ToolbarButton label="Reset view" onClick={handleReset}>
              <ResetIcon />
            </ToolbarButton>
            <ToolbarButton label="Fullscreen" onClick={handleFullscreen}>
              <FullscreenIcon />
            </ToolbarButton>
          </>
        )}
        <a
          href={src}
          download={downloadName}
          // `before:` extends the hit area to ~44×44 (the visual 36×36
          // circle stays compact) without changing how the toolbar looks —
          // see quick-reference.md §2 `touch-target-size`.
          className="pointer-events-auto group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-snow/70 text-graphite shadow-sm backdrop-blur transition before:absolute before:-inset-1 before:content-[''] hover:bg-snow"
          aria-label={downloadLabel}
        >
          <DownloadIcon />
          <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded bg-graphite px-2 py-1 font-eyebrow text-[10px] uppercase tracking-wider text-snow opacity-0 transition group-hover:opacity-100">
            {downloadLabel}
          </span>
        </a>
      </div>

      {/* Text overlay */}
      {(title || productName) && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-xs bg-snow/55 px-4 py-3 backdrop-blur-md">
          <div className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
            Render
          </div>
          {title && (
            <div className="mt-1 font-display text-lg uppercase tracking-wide text-graphite">
              {title}
            </div>
          )}
          {productName && (
            <div className="font-display text-sm text-steel">
              {productName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // See the download link's comment above — same 44×44 hit-area
      // extension via an invisible `::before`, visual size unchanged.
      className="pointer-events-auto group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-snow/70 text-graphite shadow-sm backdrop-blur transition before:absolute before:-inset-1 before:content-[''] hover:bg-snow"
    >
      {children}
      <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded bg-graphite px-2 py-1 font-eyebrow text-[10px] uppercase tracking-wider text-snow opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export default StlViewer;
