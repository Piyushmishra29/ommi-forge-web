'use client';

import type { IllustrationShape } from '@/data/solutions';
import { cn } from '@/lib/cn';

/**
 * MethodIllustration
 *
 * Four crossfaded SVG shapes — square / pillar / ring / circle — that
 * represent the four forging methods abstractly. The parent passes a
 * `progress` (0..1) computed from <PinnedSection>'s useScroll(); each
 * shape fades in across a 1/4 slice of that progress range. We do NOT
 * morph paths; we simply layer four full-canvas SVGs and crossfade.
 *
 * Colour: mesh + saffron strokes on a graphite background.
 */
interface Props {
  progress: number;
  className?: string;
}

const ORDER: ReadonlyArray<IllustrationShape> = [
  'square',
  'pillar',
  'ring',
  'circle',
];

function opacityFor(progress: number, index: number) {
  // Each shape "owns" a 1/4 window. Crossfade ±0.08 around the boundaries
  // so the transition never goes fully dark.
  const slice = 1 / ORDER.length;
  const center = slice * index + slice / 2;
  const distance = Math.abs(progress - center);
  // Inverse-distance fade, clamped 0..1.
  const fade = Math.max(0, 1 - distance / (slice * 0.85));
  return fade;
}

export default function MethodIllustration({ progress, className }: Props) {
  return (
    <div
      className={cn(
        'relative aspect-square w-full max-w-[520px] overflow-hidden bg-graphite',
        className,
      )}
    >
      {/* Concentric backdrop grid */}
      <svg
        viewBox="0 0 400 400"
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-15"
      >
        <defs>
          <pattern
            id="grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0 L0 0 L0 40"
              fill="none"
              stroke="#FAFAFA"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#grid)" />
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="#FAFAFA"
          strokeWidth="0.5"
        />
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="#FAFAFA"
          strokeWidth="0.5"
        />
      </svg>

      {/* SQUARE — Closed Die */}
      <ShapeLayer opacity={opacityFor(progress, 0)} label="square">
        <rect
          x="100"
          y="100"
          width="200"
          height="200"
          fill="none"
          stroke="#FF5533"
          strokeWidth="2"
        />
        <rect
          x="130"
          y="130"
          width="140"
          height="140"
          fill="#FF5533"
          fillOpacity="0.15"
          stroke="#FF9933"
          strokeWidth="1"
        />
        <line
          x1="100"
          y1="100"
          x2="300"
          y2="300"
          stroke="#FF9933"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
        <line
          x1="300"
          y1="100"
          x2="100"
          y2="300"
          stroke="#FF9933"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      </ShapeLayer>

      {/* PILLAR — Open Die */}
      <ShapeLayer opacity={opacityFor(progress, 1)} label="pillar">
        <rect
          x="155"
          y="40"
          width="90"
          height="320"
          fill="none"
          stroke="#FF5533"
          strokeWidth="2"
        />
        <rect
          x="170"
          y="60"
          width="60"
          height="280"
          fill="#FF5533"
          fillOpacity="0.15"
          stroke="#FF9933"
          strokeWidth="1"
        />
        {/* Hammer marks */}
        {[80, 120, 160, 200, 240, 280, 320].map((y) => (
          <line
            key={y}
            x1="170"
            y1={y}
            x2="230"
            y2={y}
            stroke="#FF9933"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        ))}
      </ShapeLayer>

      {/* RING — Ring Rolling */}
      <ShapeLayer opacity={opacityFor(progress, 2)} label="ring">
        <circle
          cx="200"
          cy="200"
          r="140"
          fill="none"
          stroke="#FF5533"
          strokeWidth="2"
        />
        <circle
          cx="200"
          cy="200"
          r="90"
          fill="none"
          stroke="#FF5533"
          strokeWidth="2"
        />
        <circle
          cx="200"
          cy="200"
          r="115"
          fill="#FF5533"
          fillOpacity="0.15"
          stroke="none"
        />
        {/* Roller indicators */}
        <circle cx="60" cy="200" r="14" fill="#FF9933" />
        <circle cx="340" cy="200" r="14" fill="#FF9933" />
        <line
          x1="60"
          y1="200"
          x2="340"
          y2="200"
          stroke="#FF9933"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      </ShapeLayer>

      {/* CIRCLE — Upset Forging */}
      <ShapeLayer opacity={opacityFor(progress, 3)} label="circle">
        <circle
          cx="200"
          cy="200"
          r="110"
          fill="#FF5533"
          fillOpacity="0.15"
          stroke="#FF5533"
          strokeWidth="2"
        />
        <circle
          cx="200"
          cy="200"
          r="80"
          fill="none"
          stroke="#FF9933"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="50"
          fill="none"
          stroke="#FF9933"
          strokeWidth="1"
        />
        <circle cx="200" cy="200" r="6" fill="#FF9933" />
      </ShapeLayer>
    </div>
  );
}

function ShapeLayer({
  opacity,
  label,
  children,
}: {
  opacity: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={label}
      className="absolute inset-0 h-full w-full transition-opacity duration-300"
      style={{ opacity }}
    >
      {children}
    </svg>
  );
}
