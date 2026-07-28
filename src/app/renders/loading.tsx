/**
 * Skeletal anvil silhouette shown while the /renders route segment loads
 * (client-side navigation only — `loading.tsx` doesn't stream in static
 * export, so this never appears on a cold/direct HTML load, only on an
 * in-app Link transition into /renders or /renders/[slug]). The per-model
 * space reservation and real download progress live one level down, in
 * `StlViewerSkeleton`/`LoadProgress` (see `components/three/lazy.tsx` and
 * `StlViewer.tsx`) — this file only covers the brief route-transition gap.
 *
 * `role="status"` + `aria-live="polite"` so screen readers announce the
 * transition instead of going silent until content appears.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-[60vh] w-full items-center justify-center bg-[radial-gradient(circle_at_center,var(--color-snow)_0%,var(--color-render-bg)_70%)]"
    >
      <svg
        width="220"
        height="180"
        viewBox="0 0 220 180"
        fill="none"
        className="text-mesh opacity-70"
        aria-hidden="true"
      >
        {/* Anvil top */}
        <rect
          x="20"
          y="60"
          width="180"
          height="32"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="6 6"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-24"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Anvil waist */}
        <path
          d="M 60 92 L 75 130 L 145 130 L 160 92 Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="6 6"
          fill="none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-24"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </path>
        {/* Anvil base */}
        <rect
          x="55"
          y="130"
          width="110"
          height="22"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="6 6"
          fill="none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-24"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
      <span className="absolute bottom-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-steel">
        Loading render
      </span>
    </div>
  );
}
