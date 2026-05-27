/**
 * Skeletal anvil silhouette shown while route segment + STL data loads.
 * SVG-only so it doesn't spin up a Canvas before it has to.
 */
export default function Loading() {
  return (
    <div className="relative flex h-[60vh] w-full items-center justify-center bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#D9D9D9_70%)]">
      <svg
        width="220"
        height="180"
        viewBox="0 0 220 180"
        fill="none"
        className="opacity-70"
        aria-hidden="true"
      >
        {/* Anvil top */}
        <rect
          x="20"
          y="60"
          width="180"
          height="32"
          rx="3"
          stroke="#FF5533"
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
          stroke="#FF5533"
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
          stroke="#FF5533"
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
      <span className="absolute bottom-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#54595F]">
        Loading render
      </span>
    </div>
  );
}
