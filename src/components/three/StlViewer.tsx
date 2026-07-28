'use client';

import { useId, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { BRAND_HEX } from '@/lib/brand';
import { cn } from '@/lib/cn';
import {
  ForgedSteelMaterial,
  MODEL_PRIORITY,
  useModelGeometry,
} from '@/components/three3/scene';
import { useModelProgress } from '@/components/three3/useModelProgress';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import ForgeStage from './ForgeStage';
import { STAGE_CAMERA, poseFor } from './stage-rig';

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
 * The part, framed and lit.
 *
 * Loading goes through `useModelGeometry` rather than v2's `useLoader`, for
 * the two reasons `three3/useModel` documents: Suspense can only say
 * "loading", and this viewer needs a real percentage on a multi-megabyte
 * part; and a suspending component unmounts its siblings' DOM while it
 * waits, which would tear down the toolbar mid-load. The geometry is
 * cache-owned and shared with the `/renders` hub stage — hence
 * `dispose={null}`, without which R3F's unmount cleanup would free a buffer
 * the hub is still drawing from.
 */
function PartMesh({ src }: { src: string }) {
  const { geometry } = useModelGeometry(src, {
    priority: MODEL_PRIORITY.hero,
    // The unit rig: bounding-sphere radius 1, so light positions and camera
    // distances are the same small numbers everywhere in this lane. (v2
    // normalised to 50 with the camera at 200; the two conventions must
    // never share a scene.)
    targetRadius: 1,
    shading: 'smooth',
  });

  const [rx, ry, rz] = poseFor(src);

  if (!geometry) return <AnvilWireframe />;

  return (
    <mesh geometry={geometry.geometry} dispose={null} rotation={[rx, ry, rz]}>
      {/* §3.2 state B, MACHINED — this is the one place on the site where
          the visitor's job is to *inspect*, so they get the bright, legible
          state rather than as-forged mill scale. The shared preset, not a
          local spread: per-lane material copies are how roughness drifted to
          0.24 in one place and 0.42 in another. */}
      <ForgedSteelMaterial state="machined" />
    </mesh>
  );
}

/**
 * Placeholder while the GLB streams in: two crossed thin torus rings in
 * saffron. Grandfathered by §6.7 as a deliberate anvil abstraction inside a
 * loading state — it is not a hero object, and nothing else on this site is
 * allowed to be a rotating primitive.
 *
 * Must be built from three.js primitives, not DOM: this renders as a child
 * of `<Canvas>`, whose reconciler only understands scene-graph nodes.
 */
function AnvilWireframe() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.02, 12, 64]} />
        <meshBasicMaterial color={BRAND_HEX.saffron} wireframe />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.8, 0.02, 12, 64]} />
        <meshBasicMaterial color={BRAND_HEX.saffron} wireframe />
      </mesh>
    </group>
  );
}

/**
 * Swapped in for the whole `<Canvas>` by `CanvasErrorBoundary` when WebGL
 * context creation throws — GPU disabled, context limit hit, locked-down
 * browser.
 *
 * §4.5: this is a designed state, not a fallback. The visitor loses the live
 * render and nothing else — they still get the part, rendered from the same
 * rig offline, and the download link beside it never needed WebGL anyway.
 */
function WebglUnavailable() {
  return (
    <p className="type-meta absolute inset-x-0 bottom-0 z-10 bg-graphite/80 px-6 py-3 text-center backdrop-blur">
      Live 3D isn&apos;t available in this browser. What you can see is a
      static render of the same part — the download is the real geometry.
    </p>
  );
}

/**
 * Byte-accurate load readout (§6.16 rejects a spinner: we have real progress
 * and a percentage is more honest).
 *
 * Reads the v3 model queue rather than drei's `useProgress`, which watches
 * three's `DefaultLoadingManager` — a manager `useModelGeometry` deliberately
 * does not go through. It lives outside the `<Canvas>` so it costs no
 * three.js and can be plain DOM.
 */
function LoadProgress({ active, progress }: { active: boolean; progress: number }) {
  if (!active) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-6"
    >
      {/* The one blur on the site (§6.2): a legibility scrim over a canvas,
          which is what blur is actually for. saffron on graphite/70 over the
          dark stage stays above 7:1. */}
      <span className="type-eyebrow inline-flex items-center gap-2 bg-graphite/70 px-4 py-2 backdrop-blur">
        Loading {Math.round(progress * 100)}%
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

/**
 * The inspection viewer (§5.7).
 *
 * Structurally unchanged from v2 — the tap-to-activate gate, the toolbar,
 * the download, the `aria-describedby` blurb and the `canvasFailed` handling
 * were all correct and are load-bearing. What changed is the register: the
 * stage is graphite rather than near-white, the material is the house
 * MACHINED steel under the shared forge rig instead of a hand-rolled
 * three-point setup, and the geometry comes from the shared cache.
 *
 * This is the **only** route where `OrbitControls` and auto-rotate exist
 * (§4.3): here the visitor's job is to look at the part from every side, so
 * a turntable is an inspection tool. Everywhere else, motion is scroll-driven.
 *
 * It keeps its own `<Canvas>` rather than joining the shared one — one
 * context per route either way, and orbit controls need a camera of their
 * own, which a scissored `<View>` does not have.
 */
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

  // Byte-accurate progress for this one model. Read here rather than only in
  // the readout because it also decides when the stage stops being
  // see-through — see the wrapper's background below.
  const { active: loading, progress } = useModelProgress([src]);
  const ready = progress >= 1;

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

  const downloadName = src.split('/').pop() ?? 'render.glb';

  const handleToggleRotate = () => setManualRotate(!rotating);

  const handleReset = () => {
    controlsRef.current?.reset();
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

  // Accessible name + (optional) description for the whole widget. A
  // `<canvas>` is opaque to assistive tech and the toolbar buttons only
  // label themselves individually, so the group as a whole needs its own
  // name — this is what a screen reader announces on entering the region.
  const viewerLabel =
    [title, productName].filter(Boolean).join(' — ') || '3D model viewer';
  const downloadLabel = modelSizeBytes
    ? `Download 3D model (.glb, ${formatFileSize(modelSizeBytes)})`
    : 'Download 3D model (.glb)';

  return (
    <div
      ref={wrapperRef}
      role="group"
      aria-label={viewerLabel}
      aria-describedby={description ? descId : undefined}
      // `data-lenis-prevent` only while active so Lenis stops intercepting
      // wheel/touch and lets OrbitControls own the gesture during inspection.
      {...(active ? { 'data-lenis-prevent': '' } : {})}
      // §3.6: the stage is graphite — the page colour — with no border, no
      // radius and no shadow, so there is no visible rectangle. Depth comes
      // from the vignette overlay below.
      //
      // The background is TRANSPARENT until the model has landed, and that is
      // load-bearing rather than cosmetic. The caller renders this part's
      // poster behind this box; the canvas clears to transparent, so what the
      // visitor sees while the GLB streams is the still — the same part, same
      // pose, same rig (§5.9). When the real geometry arrives it draws in
      // exactly that position and the ground fades up to graphite underneath
      // it, so the swap from image to canvas has nothing to see.
      className={cn(
        'relative isolate h-full w-full overflow-hidden transition-colors duration-500',
        ready && !canvasFailed ? 'bg-graphite' : 'bg-transparent',
        className,
      )}
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
          dpr={[1, 1.75]}
          // The unit rig from `stage-rig`, identical to the hub stage's
          // per-slot camera and to the offline poster renderer, so a part is
          // the same size whichever surface it appears on.
          camera={{
            position: [...STAGE_CAMERA.position],
            fov: STAGE_CAMERA.fov,
            near: STAGE_CAMERA.near,
            far: STAGE_CAMERA.far,
          }}
          // `alpha: true` so the poster behind this box shows through until
          // the part is drawn over it.
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          // Inactive: canvas ignores pointers so vertical swipes scroll the
          // page. Active: it captures gestures and `touch-action: none` keeps
          // the browser from hijacking the drag for native scroll.
          className={active ? 'pointer-events-auto' : 'pointer-events-none'}
          style={{ touchAction: active ? 'none' : 'pan-y' }}
        >
          <ForgeStage />
          <PartMesh src={src} />
          <OrbitControls
            ref={controlsRef}
            enabled={active}
            enablePan={false}
            enableZoom
            autoRotate={rotating}
            autoRotateSpeed={1.2}
            // Unit-rig distances. The part has a bounding-sphere radius of 1,
            // so 2.2 is as close as you can dolly before clipping into it and
            // 9 is far enough to see it whole with room around it.
            minDistance={2.2}
            maxDistance={9}
          />
        </Canvas>
      </CanvasErrorBoundary>

      {/* §3.6 — depth from a CSS vignette over the canvas, never from a
          different clear colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 45%, var(--color-graphite) 100%)',
        }}
      />

      {!canvasFailed && <LoadProgress active={loading} progress={progress} />}

      {/* Tap-to-activate gate. While inactive this transparent button sits
          over the (pointer-events-none) canvas; a tap flips `active` so the
          canvas takes over. It is itself swipe-friendly via `touch-action`
          so a vertical drag scrolls the page instead of activating. Hidden
          once the canvas has failed — there's nothing left to activate. */}
      {!active && !canvasFailed && (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Tap to interact with the 3D model of ${title ?? productName ?? 'this part'}`}
          style={{ touchAction: 'pan-y' }}
          // Bottom-aligned at every size: centred, the chip lands squarely on
          // the part it is inviting you to inspect.
          className="absolute inset-0 z-10 flex items-end justify-center pb-6"
        >
          <span className="type-eyebrow pointer-events-none inline-flex items-center gap-2 bg-graphite/70 px-4 py-2 backdrop-blur">
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
          className="type-eyebrow pointer-events-auto absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-graphite/70 px-4 py-2 backdrop-blur transition hover:bg-graphite"
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
              label={rotating ? 'Pause rotation' : 'Auto-rotate'}
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
          className="pointer-events-auto group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-graphite/70 text-snow backdrop-blur transition before:absolute before:-inset-1 before:content-[''] hover:bg-graphite hover:text-saffron"
          aria-label={downloadLabel}
        >
          <DownloadIcon />
          <span className="type-meta pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap bg-graphite px-2 py-1 uppercase tracking-wider text-snow opacity-0 transition group-hover:opacity-100">
            {downloadLabel}
          </span>
        </a>
      </div>

      {/* Text overlay */}
      {(title || productName) && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-xs bg-graphite/70 px-4 py-3 backdrop-blur">
          <p className="type-eyebrow">{title ?? 'Render'}</p>
          {productName && (
            <p className="type-display-s mt-2">{productName}</p>
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
      className="pointer-events-auto group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-graphite/70 text-snow backdrop-blur transition before:absolute before:-inset-1 before:content-[''] hover:bg-graphite hover:text-saffron"
    >
      {children}
      <span className="type-meta pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap bg-graphite px-2 py-1 uppercase tracking-wider text-snow opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export default StlViewer;
