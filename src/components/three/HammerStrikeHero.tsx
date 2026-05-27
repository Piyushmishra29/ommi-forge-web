'use client';

import { useEffect, useRef, useState } from 'react';
import { BRAND_HEX } from '@/lib/brand';

/**
 * The hero accepts EITHER a raw number OR a React ref carrying a
 * number. The ref form is preferred for scroll-driven usage because it
 * lets the parent mutate the value every frame without re-rendering us.
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
 * HammerStrikeHero — flat SVG illustration of a friction / belt drop
 * forging hammer (the NKH-style "self-contained belt drop hammer").
 *
 * Replaces a prior R3F three.js scene that read as flat black blobs at
 * web viewport sizes. SVG gives us pixel-perfect industrial line-art,
 * a recognisable hammer silhouette, and drops ~890 KB of three.js from
 * this component's chunk.
 *
 * Anatomy (driven by `progress` 0 → 1):
 *  - Two heavy H-frame posts on either side
 *  - Heavy crosshead cap at the top
 *  - Twin grooved drum pulleys + a vertical belt loop
 *  - A long drop rod descending from the pulleys to the tup
 *  - The tup (ram) carrying a polished bottom die — slides down the
 *    frame as `progress` goes 0 → 1
 *  - Stepped cast-iron anvil block sitting on a concrete foundation
 *  - A hot saffron billet glowing on the anvil's top die
 *  - Side flywheel + diagonal drive belt (decorative motion)
 *
 * On strike (progress > 0.95): a saffron flash + sparks burst around
 * the billet for ~600 ms, the billet squishes 22 %, and the camera
 * jiggles via a sub-pixel transform on the SVG wrapper.
 *
 * Reduced-motion: render the struck pose, no flash / no shake.
 */
export function HammerStrikeHero({ progress, className }: HammerStrikeHeroProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tupRef = useRef<SVGGElement | null>(null);
  const billetRef = useRef<SVGGElement | null>(null);
  const flashRef = useRef<SVGRectElement | null>(null);
  const sparksRef = useRef<SVGGElement | null>(null);
  const beltLeftRef = useRef<SVGRectElement | null>(null);
  const beltRightRef = useRef<SVGRectElement | null>(null);
  const driveBeltRef = useRef<SVGLineElement | null>(null);
  const flywheelRef = useRef<SVGGElement | null>(null);
  const leftPulleyRef = useRef<SVGGElement | null>(null);
  const rightPulleyRef = useRef<SVGGElement | null>(null);
  const heatStopRef = useRef<SVGStopElement | null>(null);

  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Animation loop. Reads progress every tick (works with both number
    // and ref forms) and writes SVG element styles imperatively so we
    // never re-render React on the scroll path.
    const TUP_TOP = -310; // y translate at parked position
    const TUP_HIT = 0; // y translate at impact position
    let raf = 0;
    let lastTime = performance.now();
    let beltOffset = 0;
    let driveAngle = 0;
    let pulleyAngle = 0;
    let sparkLife = 0; // 0..1, decays after strike
    let prevStruck = false;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      const raw = readProgress(progress);
      const p = Math.min(1, Math.max(0, raw));
      const struck = p > 0.95;

      // Tup descent (cubic ease so the early travel feels lighter)
      const eased = p * p * (3 - 2 * p);
      const tupY = TUP_TOP + (TUP_HIT - TUP_TOP) * eased;
      if (tupRef.current) {
        tupRef.current.setAttribute('transform', `translate(0 ${tupY})`);
      }

      // Billet squish on strike
      if (billetRef.current) {
        const target = struck ? 0.78 : 1;
        const current = parseFloat(
          billetRef.current.dataset.scaleY ?? '1',
        );
        const next = current + (target - current) * Math.min(1, dt * 12);
        billetRef.current.dataset.scaleY = String(next);
        billetRef.current.setAttribute(
          'transform',
          `translate(300 645) scale(1 ${next}) translate(-300 -645)`,
        );
      }

      // Spark / flash trigger on rising edge of struck
      if (!reduced && struck && !prevStruck) {
        sparkLife = 1;
      }
      prevStruck = struck;

      // Decay spark life
      sparkLife = Math.max(0, sparkLife - dt * 1.4);

      // Flash visibility
      if (flashRef.current) {
        flashRef.current.setAttribute(
          'opacity',
          reduced ? (struck ? '0.6' : '0') : (sparkLife * 0.55).toFixed(3),
        );
      }
      // Spark group fades over its life
      if (sparksRef.current) {
        sparksRef.current.style.opacity = reduced ? '0' : sparkLife.toFixed(3);
      }
      // Heat radial intensity (keeps a constant ambient when parked + a
      // big pulse during the spark window)
      if (heatStopRef.current) {
        const base = 0.55;
        const burst = sparkLife * 0.4;
        const intensity = Math.min(0.95, base + burst);
        heatStopRef.current.setAttribute('stop-opacity', intensity.toFixed(3));
      }

      // Belt scroll — speeds up as the tup falls
      if (!reduced) {
        const beltSpeed = 60 + p * 220;
        beltOffset = (beltOffset + dt * beltSpeed) % 60;
        if (beltLeftRef.current) {
          beltLeftRef.current.setAttribute(
            'transform',
            `translate(0 ${beltOffset})`,
          );
        }
        if (beltRightRef.current) {
          beltRightRef.current.setAttribute(
            'transform',
            `translate(0 ${-beltOffset})`,
          );
        }
        // Pulley rotation matches belt direction
        pulleyAngle = (pulleyAngle + dt * beltSpeed * 6) % 360;
        if (leftPulleyRef.current) {
          leftPulleyRef.current.setAttribute(
            'transform',
            `rotate(${pulleyAngle} 235 110)`,
          );
        }
        if (rightPulleyRef.current) {
          rightPulleyRef.current.setAttribute(
            'transform',
            `rotate(${-pulleyAngle} 365 110)`,
          );
        }
        // Side flywheel
        driveAngle = (driveAngle + dt * (40 + p * 140)) % 360;
        if (flywheelRef.current) {
          flywheelRef.current.setAttribute(
            'transform',
            `rotate(${driveAngle} 555 320)`,
          );
        }
      }

      // SVG-wrapper shake on strike
      if (wrapperRef.current) {
        const shake =
          !reduced && sparkLife > 0
            ? Math.sin(now * 0.04) * sparkLife * 1.6
            : 0;
        wrapperRef.current.style.transform = `translate3d(${shake.toFixed(2)}px, ${(shake * 0.5).toFixed(2)}px, 0)`;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [progress, reduced]);

  // Sparks: hand-placed origin points so we don't allocate arrays in render.
  // Each spark is a short line emanating from the strike origin (300, 645).
  const sparks: Array<[number, number, number, number]> = [
    [300, 645, 240, 590],
    [300, 645, 360, 590],
    [300, 645, 222, 640],
    [300, 645, 378, 640],
    [300, 645, 260, 700],
    [300, 645, 340, 700],
    [300, 645, 200, 680],
    [300, 645, 400, 680],
    [300, 645, 285, 595],
    [300, 645, 315, 595],
  ];

  return (
    <div
      className={['relative h-full w-full', className ?? ''].join(' ')}
      style={{
        background: `radial-gradient(120% 80% at 50% 30%, ${BRAND_HEX.snow} 0%, ${BRAND_HEX.renderBg} 60%, #c2bdb9 100%)`,
      }}
    >
      <div
        ref={wrapperRef}
        className="absolute inset-0 flex items-end justify-center"
        style={{ willChange: 'transform' }}
      >
        <svg
          viewBox="0 0 600 820"
          preserveAspectRatio="xMidYMax meet"
          className="h-[96%] w-auto max-w-full"
          aria-hidden
        >
          <defs>
            <radialGradient
              id="hammer-heat"
              cx="300"
              cy="645"
              r="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                ref={heatStopRef}
                offset="0%"
                stopColor={BRAND_HEX.saffron}
                stopOpacity="0.55"
              />
              <stop offset="60%" stopColor={BRAND_HEX.saffron} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hammer-billet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFC57A" />
              <stop offset="55%" stopColor={BRAND_HEX.saffron} />
              <stop offset="100%" stopColor={BRAND_HEX.mesh} />
            </linearGradient>
            <linearGradient id="hammer-tup" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3f44" />
              <stop offset="55%" stopColor={BRAND_HEX.graphite} />
              <stop offset="100%" stopColor="#0f1012" />
            </linearGradient>
            <linearGradient id="hammer-anvil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d4147" />
              <stop offset="100%" stopColor={BRAND_HEX.graphite} />
            </linearGradient>
            <linearGradient id="hammer-frame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2c30" />
              <stop offset="100%" stopColor={BRAND_HEX.graphite} />
            </linearGradient>
            <pattern
              id="belt-pattern"
              x="0"
              y="0"
              width="20"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <rect width="20" height="60" fill="#4a3525" />
              <rect x="2" y="6" width="16" height="3" fill="#3d2a1c" />
              <rect x="2" y="32" width="16" height="3" fill="#3d2a1c" />
              <line
                x1="0"
                y1="50"
                x2="20"
                y2="50"
                stroke="#5c4530"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Foundation floor + cast shadow */}
          <ellipse
            cx="300"
            cy="800"
            rx="240"
            ry="12"
            fill="rgba(0,0,0,0.18)"
          />
          <rect x="40" y="770" width="520" height="32" fill="#2a2c30" />
          <rect x="40" y="770" width="520" height="4" fill="#3a3f44" />

          {/* Anvil — stacked cast-iron tiers */}
          <polygon
            points="120,770 180,720 420,720 480,770"
            fill="url(#hammer-anvil)"
          />
          <rect x="170" y="700" width="260" height="22" fill="url(#hammer-anvil)" />
          <rect
            x="170"
            y="700"
            width="260"
            height="3"
            fill={BRAND_HEX.mesh}
            opacity="0.15"
          />
          <rect x="195" y="680" width="210" height="22" fill="url(#hammer-anvil)" />
          <rect x="220" y="665" width="160" height="18" fill="url(#hammer-anvil)" />
          {/* Bottom die — polished plate */}
          <rect x="235" y="657" width="130" height="10" fill="#5a6066" />
          <rect x="235" y="657" width="130" height="2" fill="#7c8389" />

          {/* Heat glow on the billet */}
          <rect
            x="100"
            y="540"
            width="400"
            height="200"
            fill="url(#hammer-heat)"
            pointerEvents="none"
          />

          {/* Hot billet sitting on the bottom die */}
          <g ref={billetRef}>
            <rect
              x="265"
              y="617"
              width="70"
              height="40"
              fill="url(#hammer-billet)"
              rx="2"
            />
            <rect
              x="265"
              y="617"
              width="70"
              height="3"
              fill="#FFD89C"
              opacity="0.7"
            />
          </g>

          {/* H-frame posts */}
          <rect x="55" y="80" width="36" height="690" fill="url(#hammer-frame)" />
          <rect x="91" y="80" width="4" height="690" fill="#0e0f11" />
          <rect x="509" y="80" width="36" height="690" fill="url(#hammer-frame)" />
          <rect x="505" y="80" width="4" height="690" fill="#0e0f11" />

          {/* Inner guide channels — subtle saffron lines hint at the slide
              the tup rides on */}
          <rect
            x="98"
            y="120"
            width="3"
            height="600"
            fill={BRAND_HEX.saffron}
            opacity="0.18"
          />
          <rect
            x="499"
            y="120"
            width="3"
            height="600"
            fill={BRAND_HEX.saffron}
            opacity="0.18"
          />

          {/* Tie-rods */}
          <line
            x1="73"
            y1="80"
            x2="73"
            y2="770"
            stroke="#15171a"
            strokeWidth="3"
          />
          <line
            x1="527"
            y1="80"
            x2="527"
            y2="770"
            stroke="#15171a"
            strokeWidth="3"
          />

          {/* Crosshead beam */}
          <rect x="40" y="50" width="520" height="48" fill="url(#hammer-frame)" />
          <rect x="40" y="50" width="520" height="4" fill="#3a3f44" />
          <rect x="40" y="94" width="520" height="4" fill="#0e0f11" />
          {/* Bolt heads on the crosshead corners */}
          <circle cx="64" cy="74" r="6" fill="#5a6066" />
          <circle cx="64" cy="74" r="2.5" fill="#2a2c30" />
          <circle cx="536" cy="74" r="6" fill="#5a6066" />
          <circle cx="536" cy="74" r="2.5" fill="#2a2c30" />

          {/* Belt loop — two vertical strips running between the drum
              pulleys (pinching the drop rod). The animation just slides
              the pattern offset to fake belt motion. */}
          <rect
            ref={beltLeftRef}
            x="218"
            y="100"
            width="18"
            height="60"
            fill="url(#belt-pattern)"
          />
          <rect
            ref={beltRightRef}
            x="364"
            y="100"
            width="18"
            height="60"
            fill="url(#belt-pattern)"
          />

          {/* Twin drum pulleys at the top */}
          <g ref={leftPulleyRef}>
            <circle cx="235" cy="110" r="42" fill="#3a3f44" />
            <circle cx="235" cy="110" r="42" fill="none" stroke="#15171a" strokeWidth="2" />
            <circle cx="235" cy="110" r="14" fill="#15171a" />
            <circle cx="235" cy="110" r="5" fill="#5a6066" />
            {/* Spoke marks so rotation is visible */}
            <line x1="235" y1="78" x2="235" y2="92" stroke="#5a6066" strokeWidth="3" />
            <line x1="235" y1="128" x2="235" y2="142" stroke="#5a6066" strokeWidth="3" />
            <line x1="203" y1="110" x2="217" y2="110" stroke="#5a6066" strokeWidth="3" />
            <line x1="253" y1="110" x2="267" y2="110" stroke="#5a6066" strokeWidth="3" />
          </g>
          <g ref={rightPulleyRef}>
            <circle cx="365" cy="110" r="42" fill="#3a3f44" />
            <circle cx="365" cy="110" r="42" fill="none" stroke="#15171a" strokeWidth="2" />
            <circle cx="365" cy="110" r="14" fill="#15171a" />
            <circle cx="365" cy="110" r="5" fill="#5a6066" />
            <line x1="365" y1="78" x2="365" y2="92" stroke="#5a6066" strokeWidth="3" />
            <line x1="365" y1="128" x2="365" y2="142" stroke="#5a6066" strokeWidth="3" />
            <line x1="333" y1="110" x2="347" y2="110" stroke="#5a6066" strokeWidth="3" />
            <line x1="383" y1="110" x2="397" y2="110" stroke="#5a6066" strokeWidth="3" />
          </g>

          {/* TUP GROUP — descends with progress. The drop rod, tup body,
              and bottom die all move together. */}
          <g ref={tupRef} style={{ willChange: 'transform' }}>
            {/* Drop rod cap */}
            <rect x="293" y="60" width="14" height="14" fill="#5a6066" />
            <rect x="290" y="74" width="20" height="6" fill="#3a3f44" />
            {/* Drop rod — long thin polished steel rod between the pulleys */}
            <rect x="296" y="80" width="8" height="500" fill="#5a6066" />
            <rect x="296" y="80" width="2" height="500" fill="#7c8389" />
            {/* Tup (ram) body */}
            <rect x="250" y="555" width="100" height="60" fill="url(#hammer-tup)" />
            <rect x="250" y="555" width="100" height="3" fill="#5a6066" />
            <rect
              x="250"
              y="555"
              width="100"
              height="60"
              fill="none"
              stroke={BRAND_HEX.saffron}
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            {/* Tup top die — polished plate */}
            <rect x="252" y="615" width="96" height="8" fill="#5a6066" />
            <rect x="252" y="615" width="96" height="2" fill="#7c8389" />
          </g>

          {/* Side drive flywheel + diagonal drive belt */}
          <line
            ref={driveBeltRef}
            x1="380"
            y1="135"
            x2="540"
            y2="310"
            stroke="#3d2a1c"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="380"
            y1="135"
            x2="540"
            y2="310"
            stroke="#4a3525"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g ref={flywheelRef}>
            <circle cx="555" cy="320" r="32" fill="#3a3f44" />
            <circle cx="555" cy="320" r="32" fill="none" stroke="#15171a" strokeWidth="2" />
            <circle cx="555" cy="320" r="6" fill="#15171a" />
            <line x1="555" y1="298" x2="555" y2="290" stroke="#5a6066" strokeWidth="3" />
            <line x1="555" y1="350" x2="555" y2="342" stroke="#5a6066" strokeWidth="3" />
            <line x1="527" y1="320" x2="519" y2="320" stroke="#5a6066" strokeWidth="3" />
            <line x1="583" y1="320" x2="591" y2="320" stroke="#5a6066" strokeWidth="3" />
          </g>

          {/* Operator pedal + linkage */}
          <line
            x1="460"
            y1="770"
            x2="460"
            y2="700"
            stroke="#3a3f44"
            strokeWidth="3"
          />
          <rect x="438" y="760" width="40" height="10" fill="#3a3f44" />
          <rect x="438" y="760" width="40" height="2" fill="#5a6066" />

          {/* Saffron flash — appears on strike. Full-area rect with low
              opacity, gated by the rAF loop. */}
          <rect
            ref={flashRef}
            x="0"
            y="0"
            width="600"
            height="820"
            fill={BRAND_HEX.saffron}
            opacity="0"
            pointerEvents="none"
          />

          {/* Sparks — short lines emanating from the strike point. The
              parent group's opacity is animated by the rAF loop. */}
          <g
            ref={sparksRef}
            style={{ opacity: 0 }}
            pointerEvents="none"
            strokeLinecap="round"
          >
            {sparks.map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={BRAND_HEX.saffron}
                strokeWidth={1.6}
                opacity={0.85}
              />
            ))}
            {/* Hot specks */}
            {sparks.map(([, , x2, y2], i) => (
              <circle
                key={`d-${i}`}
                cx={x2}
                cy={y2}
                r="2"
                fill={BRAND_HEX.mesh}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default HammerStrikeHero;
