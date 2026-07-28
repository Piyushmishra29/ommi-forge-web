'use client';

import type { IllustrationKey } from '@/data/solutions';
import { cn } from '@/lib/cn';

/**
 * MethodIllustration
 *
 * Four full-canvas SVGs, one per forging method, that crossfade as the
 * pinned scroll progresses. Each SVG ALSO animates a small internal
 * detail driven by `progress` — a hammer drops, a ring widens, a shaft
 * compresses. The motion is intentionally restrained (industrial, not
 * playful) so it doesn't compete with the copy.
 *
 * Reduced-motion: `<MethodsPinned>` drops the pin entirely and renders
 * one illustration per method with `staticIndex`, which pins that slide
 * to opacity 1 at its FINISHED frame (hammer down, ring grown) so the
 * drawing still reads as a completed operation without any motion.
 */

/**
 * Illustration palette.
 *
 * Every colour in these SVGs is a brand token — there are no
 * illustration-only values here. The drawings use SVG presentation
 * attributes rather than Tailwind classes because several are computed
 * per-frame alongside geometry (`x`, `width`, `opacity`), so keeping
 * colour on the same attribute surface keeps each shape readable as one
 * unit. Presentation attributes accept CSS custom properties, so these
 * stay bound live to the `@theme` tokens in `globals.css` instead of
 * duplicating hexes.
 *
 * Named by ROLE, not by colour, so the drawings say what a shape *is*:
 */
const INK = {
  /** Structural machinery — anvils, platens, hammer heads, guide rails. */
  machine: 'var(--color-paper)',
  /** Tooling that shapes the part — dies, jaws, mandrel, impact sparks. */
  tooling: 'var(--color-saffron)',
  /** The hot workpiece — billet, shaft, ring, upset head. */
  billet: 'var(--color-mesh)',
  /** Knock-outs punched back to the panel background (ring bore, etc.). */
  ground: 'var(--color-graphite)',
} as const;

/** Accessible name for each slide, in `ORDER` order. */
const SLIDE_LABEL: Record<IllustrationKey, string> = {
  'closed-die': 'Closed-die forging',
  'open-die': 'Open-die forging',
  ring: 'Ring rolling',
  upset: 'Upset forging',
};

interface Props {
  progress: number;
  className?: string;
  /**
   * Reduced-motion / static mode: show only this slide, held at its
   * finished frame. When set, `progress` is ignored.
   */
  staticIndex?: number;
}

const ORDER: ReadonlyArray<IllustrationKey> = [
  'closed-die',
  'open-die',
  'ring',
  'upset',
];

/**
 * Cross-fade opacity for the i-th slide given the global 0..1 progress.
 * Each slide owns a 1/N window centred on (i + 0.5) / N; the inverse
 * distance is clamped to 0..1 with a slight overlap (0.85 of the window)
 * so the transition never blacks out mid-flight.
 */
function opacityFor(progress: number, index: number): number {
  const slice = 1 / ORDER.length;
  const center = slice * index + slice / 2;
  const distance = Math.abs(progress - center);
  return Math.max(0, 1 - distance / (slice * 0.85));
}

/**
 * Local 0..1 progress *inside* the i-th window. Used to drive the
 * internal motion of each illustration — hammer fall, ring expansion,
 * shaft squish. Outside the window we clamp to 0 (pre-frame) or 1
 * (post-frame, so the part stays in its finished state until crossfade
 * completes).
 */
function localProgress(progress: number, index: number): number {
  const slice = 1 / ORDER.length;
  const start = slice * index;
  const end = start + slice;
  if (progress < start) return 0;
  if (progress > end) return 1;
  return (progress - start) / slice;
}

export default function MethodIllustration({
  progress,
  className,
  staticIndex,
}: Props) {
  const pinned = staticIndex === undefined;
  const held = pinned
    ? -1
    : Math.min(ORDER.length - 1, Math.max(0, staticIndex));

  // Static mode holds one slide at full opacity and frame 1 (the finished
  // state); pinned mode crossfades each slide through its own window.
  const opacityAt = (i: number) =>
    pinned ? opacityFor(progress, i) : i === held ? 1 : 0;
  const frameAt = (i: number) => (pinned ? localProgress(progress, i) : 1);

  // ONE accessible name for the whole canvas. The four <svg> layers are
  // stacked on top of each other, so labelling each as its own
  // `role="img"` made screen readers announce all four methods at once
  // even though three are invisible. The wrapper names whichever slide
  // is currently legible; the layers below are decorative.
  const namedIndex = pinned
    ? Math.min(ORDER.length - 1, Math.floor(progress * ORDER.length))
    : held;

  return (
    <div
      role="img"
      aria-label={`${SLIDE_LABEL[ORDER[namedIndex]]} — technical illustration`}
      className={cn(
        'relative aspect-square w-full max-w-[520px] overflow-hidden bg-graphite',
        className,
      )}
    >
      <BackdropGrid />

      <ShapeLayer opacity={opacityAt(0)}>
        <ClosedDieIllustration progress={frameAt(0)} />
      </ShapeLayer>
      <ShapeLayer opacity={opacityAt(1)}>
        <OpenDieIllustration progress={frameAt(1)} />
      </ShapeLayer>
      <ShapeLayer opacity={opacityAt(2)}>
        <RingRollingIllustration progress={frameAt(2)} />
      </ShapeLayer>
      <ShapeLayer opacity={opacityAt(3)}>
        <UpsetIllustration progress={frameAt(3)} />
      </ShapeLayer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Backdrop                                                                  */
/* -------------------------------------------------------------------------- */

function BackdropGrid() {
  return (
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
          <path d="M40 0 L0 0 L0 40" fill="none" stroke={INK.machine} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#grid)" />
      <circle cx="200" cy="200" r="180" fill="none" stroke={INK.machine} strokeWidth="0.5" />
      <circle cx="200" cy="200" r="120" fill="none" stroke={INK.machine} strokeWidth="0.5" />
    </svg>
  );
}

function ShapeLayer({
  opacity,
  children,
}: {
  opacity: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      // Decorative: the parent <div role="img"> carries the single
      // accessible name for whichever slide is legible.
      aria-hidden
      className="absolute inset-0 h-full w-full transition-opacity duration-300"
      style={{ opacity }}
    >
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  01 — Closed Die: a hammer head drops onto a billet between two die        */
/*       halves that close inward.                                            */
/* -------------------------------------------------------------------------- */

function ClosedDieIllustration({ progress }: { progress: number }) {
  // Hammer falls from y=20 to its strike position (y=120). Dies have a
  // tiny inward squeeze on impact. Use an ease-out-ish curve so the
  // hammer slams.
  const eased = 1 - (1 - progress) * (1 - progress);
  const hammerY = 20 + eased * 100;
  const squeeze = Math.max(0, (progress - 0.7) / 0.3) * 4;
  return (
    <g>
      {/* Anvil base */}
      <rect x="60" y="320" width="280" height="40" fill={INK.machine} fillOpacity="0.06" stroke={INK.machine} strokeOpacity="0.3" strokeWidth="1" />
      {/* Lower die */}
      <path
        d="M 110 320 L 110 240 L 175 240 L 200 260 L 225 240 L 290 240 L 290 320 Z"
        fill={INK.tooling}
        fillOpacity="0.12"
        stroke={INK.tooling}
        strokeWidth="1.5"
      />
      {/* Billet (the orange-hot part being squeezed) */}
      <rect
        x={170 - squeeze}
        y={245 - squeeze / 2}
        width={60 + squeeze * 2}
        height={30 + squeeze}
        fill={INK.billet}
        fillOpacity="0.6"
        stroke={INK.billet}
        strokeWidth="1.5"
        rx="2"
      />
      {/* Upper die — slammed down by the hammer */}
      <path
        d={`M 110 ${hammerY + 60} L 110 ${hammerY + 140} L 175 ${hammerY + 140} L 200 ${hammerY + 120} L 225 ${hammerY + 140} L 290 ${hammerY + 140} L 290 ${hammerY + 60} Z`}
        fill={INK.tooling}
        fillOpacity="0.12"
        stroke={INK.tooling}
        strokeWidth="1.5"
      />
      {/* Hammer head — the heavy block above the upper die */}
      <rect
        x="150"
        y={hammerY}
        width="100"
        height="60"
        fill={INK.machine}
        fillOpacity="0.12"
        stroke={INK.machine}
        strokeWidth="1.5"
      />
      {/* Guide rails */}
      <line x1="155" y1="0" x2="155" y2={hammerY} stroke={INK.machine} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="3 4" />
      <line x1="245" y1="0" x2="245" y2={hammerY} stroke={INK.machine} strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="3 4" />
      {/* Spark lines on impact */}
      {progress > 0.85 && (
        <g stroke={INK.tooling} strokeWidth="1" opacity={Math.min(1, (progress - 0.85) / 0.15)}>
          <line x1="110" y1="260" x2="80" y2="245" />
          <line x1="290" y1="260" x2="320" y2="245" />
          <line x1="110" y1="260" x2="85" y2="275" />
          <line x1="290" y1="260" x2="315" y2="275" />
        </g>
      )}
      <Caption text="01 · CLOSED DIE" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  02 — Open Die: a long shaft sits between two open dies; a smaller         */
/*       hammer taps along its length.                                        */
/* -------------------------------------------------------------------------- */

function OpenDieIllustration({ progress }: { progress: number }) {
  // The hammer travels left-to-right along the shaft, tapping each
  // marker as it goes.
  const hammerX = 90 + progress * 220;
  const hammerY = 70 + Math.abs(Math.sin(progress * Math.PI * 5)) * 16;
  return (
    <g>
      {/* Lower open-die platen */}
      <rect x="60" y="230" width="280" height="30" fill={INK.tooling} fillOpacity="0.12" stroke={INK.tooling} strokeWidth="1.5" />
      {/* Shaft */}
      <rect
        x="80"
        y="180"
        width="240"
        height="50"
        fill={INK.billet}
        fillOpacity="0.55"
        stroke={INK.billet}
        strokeWidth="1.5"
        rx="3"
      />
      {/* Forge marks left along the shaft top */}
      {[100, 140, 180, 220, 260, 300].map((x) => (
        <line
          key={x}
          x1={x}
          y1="180"
          x2={x}
          y2="195"
          stroke={INK.tooling}
          strokeOpacity={hammerX > x - 5 ? 0.9 : 0.3}
          strokeWidth="1"
        />
      ))}
      {/* Upper-die platen (sits above the shaft, doesn't move) */}
      <rect x="60" y="155" width="280" height="20" fill={INK.machine} fillOpacity="0.08" stroke={INK.machine} strokeOpacity="0.35" strokeWidth="1" />
      {/* Travelling hammer head — small, square, slides across */}
      <rect
        x={hammerX - 22}
        y={hammerY}
        width="44"
        height="64"
        fill={INK.machine}
        fillOpacity="0.15"
        stroke={INK.machine}
        strokeWidth="1.5"
      />
      <line
        x1={hammerX}
        y1="0"
        x2={hammerX}
        y2={hammerY}
        stroke={INK.machine}
        strokeOpacity="0.3"
        strokeWidth="0.5"
        strokeDasharray="3 4"
      />
      {/* End-cap supports */}
      <circle cx="60" cy="205" r="8" fill={INK.machine} fillOpacity="0.15" stroke={INK.machine} strokeOpacity="0.4" strokeWidth="1" />
      <circle cx="340" cy="205" r="8" fill={INK.machine} fillOpacity="0.15" stroke={INK.machine} strokeOpacity="0.4" strokeWidth="1" />
      <Caption text="02 · OPEN DIE" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  03 — Ring Rolling: a ring grows outward from a saffron mandrel.           */
/* -------------------------------------------------------------------------- */

function RingRollingIllustration({ progress }: { progress: number }) {
  // Ring outer radius grows from 80 → 150; wall thickness stays roughly
  // constant. Idler roller on the outside spins in.
  const outerR = 80 + progress * 70;
  const wall = 20;
  const innerR = outerR - wall;
  const idlerAngle = progress * 360 * 2;
  const idlerX = 200 + Math.cos((idlerAngle * Math.PI) / 180) * (outerR + 18);
  const idlerY = 200 + Math.sin((idlerAngle * Math.PI) / 180) * (outerR + 18);
  return (
    <g>
      {/* Outer roller frame */}
      <circle cx="200" cy="200" r="170" fill="none" stroke={INK.machine} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 4" />
      {/* Ring — annulus drawn as two stroked circles plus a fill ring */}
      <circle cx="200" cy="200" r={outerR} fill={INK.billet} fillOpacity="0.18" stroke={INK.billet} strokeWidth="1.5" />
      <circle cx="200" cy="200" r={innerR} fill={INK.ground} stroke={INK.billet} strokeWidth="1.5" />
      {/* Mandrel — saffron disc at the centre, fixed */}
      <circle cx="200" cy="200" r="22" fill={INK.tooling} />
      <circle cx="200" cy="200" r="6" fill={INK.ground} />
      {/* Idler roller riding the outside of the ring */}
      <circle cx={idlerX} cy={idlerY} r="14" fill={INK.machine} fillOpacity="0.18" stroke={INK.machine} strokeWidth="1.5" />
      {/* Reference circle showing the starting diameter so growth reads */}
      <circle cx="200" cy="200" r="80" fill="none" stroke={INK.machine} strokeOpacity="0.22" strokeWidth="0.5" strokeDasharray="3 3" />
      <Caption text="03 · RING ROLLING" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  04 — Upset: a vertical shaft compressed axially; the bottom thickens.     */
/* -------------------------------------------------------------------------- */

function UpsetIllustration({ progress }: { progress: number }) {
  // Vertical shaft is held in a die at the bottom. The top platen pushes
  // down; the bottom 1/3 of the shaft swells outward as the top
  // shortens. Pure axial compression — no rotation.
  const eased = 1 - (1 - progress) * (1 - progress);
  const platenY = 50 + eased * 50; // travels 50..100
  const shaftTop = platenY + 20;
  const headHeight = 70 + eased * 40; // upset head grows
  const headWidth = 60 + eased * 60; // … and bulges outward
  const shaftBottom = 320 - headHeight;
  return (
    <g>
      {/* Bottom die holder */}
      <rect x="100" y="320" width="200" height="40" fill={INK.machine} fillOpacity="0.08" stroke={INK.machine} strokeOpacity="0.35" strokeWidth="1" />
      {/* Upset head — the bulged section that grows as we squish */}
      <rect
        x={200 - headWidth / 2}
        y={shaftBottom}
        width={headWidth}
        height={headHeight}
        fill={INK.billet}
        fillOpacity="0.55"
        stroke={INK.billet}
        strokeWidth="1.5"
        rx="2"
      />
      {/* Long shaft above the head */}
      <rect
        x="185"
        y={shaftTop}
        width="30"
        height={shaftBottom - shaftTop}
        fill={INK.billet}
        fillOpacity="0.4"
        stroke={INK.billet}
        strokeWidth="1.5"
      />
      {/* Side die jaws clamping the upset head */}
      <rect x={200 - headWidth / 2 - 16} y={shaftBottom + 5} width="14" height={headHeight - 10} fill={INK.tooling} fillOpacity="0.18" stroke={INK.tooling} strokeWidth="1.5" />
      <rect x={200 + headWidth / 2 + 2} y={shaftBottom + 5} width="14" height={headHeight - 10} fill={INK.tooling} fillOpacity="0.18" stroke={INK.tooling} strokeWidth="1.5" />
      {/* Top platen — the thing pressing down */}
      <rect x="120" y={platenY} width="160" height="20" fill={INK.machine} fillOpacity="0.15" stroke={INK.machine} strokeWidth="1.5" />
      {/* Pressure arrows on the platen */}
      <g stroke={INK.machine} strokeOpacity="0.5" strokeWidth="1">
        <line x1="160" y1={platenY - 18} x2="160" y2={platenY - 4} />
        <polyline points={`156,${platenY - 8} 160,${platenY - 4} 164,${platenY - 8}`} fill="none" />
        <line x1="240" y1={platenY - 18} x2="240" y2={platenY - 4} />
        <polyline points={`236,${platenY - 8} 240,${platenY - 4} 244,${platenY - 8}`} fill="none" />
      </g>
      <Caption text="04 · UPSET" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared bottom-left caption                                                */
/* -------------------------------------------------------------------------- */

function Caption({ text }: { text: string }) {
  return (
    <text
      x="20"
      y="384"
      fill={INK.machine}
      fillOpacity="0.55"
      fontFamily="var(--font-eyebrow), system-ui, sans-serif"
      fontSize="11"
      letterSpacing="2.5"
      fontWeight="600"
    >
      {text}
    </text>
  );
}
