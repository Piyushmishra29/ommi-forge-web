'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { BRAND_HEX } from '@/lib/brand';

// Subscribe to (hover: hover) + (prefers-reduced-motion) media queries
// via useSyncExternalStore — keeps support detection out of effect body
// state, so we never call setState during an effect.
function subscribeMQ(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const hoverMQ = window.matchMedia('(hover: hover)');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  hoverMQ.addEventListener('change', callback);
  reduceMQ.addEventListener('change', callback);
  return () => {
    hoverMQ.removeEventListener('change', callback);
    reduceMQ.removeEventListener('change', callback);
  };
}

function getSnapshot() {
  if (typeof window === 'undefined') return false;
  // CALM_MODE: no custom cursor — native pointer only.
  if (process.env.NEXT_PUBLIC_CALM_MODE === '1') return false;
  return (
    window.matchMedia('(hover: hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getServerSnapshot() {
  return false;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getReducedSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Resolve a label for a given magnetic target.
 *  1. data-cursor-label override on the closest ancestor wins.
 *  2. <a> / Link → "View →"
 *  3. <button> / role=button → "Click"
 *  4. Fallback: empty string (no label, just the scaled ring).
 */
function resolveLabel(el: Element | null): string {
  if (!el) return '';
  const overrideHost = el.closest('[data-cursor-label]');
  if (overrideHost) {
    const v = overrideHost.getAttribute('data-cursor-label');
    if (v) return v;
  }
  const linkHost = el.closest('a');
  if (linkHost) return 'View →';
  const buttonHost = el.closest('button, [role="button"]');
  if (buttonHost) return 'Click';
  return '';
}

/**
 * MagneticCursor
 *
 * A 16px mesh-orange ring that tracks the mouse with spring easing.
 * On hover of any `[data-magnetic]` element it morphs into a saffron
 * pill carrying a contextual label ("View →", "Click", or whatever
 * `data-cursor-label` says).
 *
 * Disabled on:
 *  - touch / coarse-pointer devices (`@media (hover: none)`)
 *  - users with `prefers-reduced-motion: reduce` (cursor scales only,
 *    no morph).
 *
 * When active, also toggles `html[data-magnetic-cursor="on"]` so
 * `globals.css` can hide the native cursor.
 */
export default function MagneticCursor() {
  // Enablement comes from a media-query subscription, NOT from a
  // setState-in-effect dance. This sidesteps the React 19 cascading-
  // render lint rule entirely.
  const enabled = useSyncExternalStore(
    subscribeMQ,
    getSnapshot,
    getServerSnapshot,
  );

  // Reduced-motion subscription (separate from `enabled`, which also
  // already gates on it; this just controls morph-vs-scale-only).
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedSnapshot,
    getServerSnapshot,
  );

  // Pointer position + hover state ride on motion values so updates
  // don't trigger React re-renders.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const hover = useMotionValue(0); // 0 = idle, 1 = hovering magnetic target
  const springX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  // Idle-ring style (the ring under the pill — visible only when idle
  // OR when reduced-motion users hover, where we just scale the ring).
  const ringSize = useTransform(hover, [0, 1], [16, 48]);
  const ringOffset = useTransform(hover, [0, 1], [-8, -24]);
  // Framer Motion can't interpolate `var(--color-…)` endpoints, so we
  // feed it resolved hex literals from the brand source-of-truth. The
  // idle end is transparent saffron (same hue, zero alpha) so the fade
  // stays on-hue rather than bleeding through grey.
  const ringBg = useTransform(
    hover,
    [0, 1],
    [`${BRAND_HEX.saffron}00`, BRAND_HEX.saffron],
  );
  // For reduced-motion users, the saffron pill never appears — keep
  // ring opacity at 1. For the non-reduced path, fade the ring out as
  // the pill fades in.
  const ringOpacity = useTransform(hover, [0, 0.6, 1], [1, 0.3, 0]);

  // Pill opacity rises with hover; label text fades a hair after.
  const pillOpacity = useTransform(hover, [0, 0.4, 1], [0, 0, 1]);
  const labelOpacity = useTransform(hover, [0, 0.7, 1], [0, 0, 1]);

  const targetRef = useRef<Element | null>(null);
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.magneticCursor = 'on';

    const onMove = (e: MouseEvent) => {
      const t = targetRef.current;
      if (t) {
        const rect = t.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Magnetic pull — 35% blend between pointer and target center.
        x.set(e.clientX + (cx - e.clientX) * 0.35);
        y.set(e.clientY + (cy - e.clientY) * 0.35);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('[data-magnetic]');
      if (el) {
        targetRef.current = el;
        setLabel(resolveLabel(el));
        hover.set(1);
      }
    };

    const onOut = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('[data-magnetic]');
      if (el && !el.contains(e.relatedTarget as Node | null)) {
        targetRef.current = null;
        hover.set(0);
        // Defer label clear until pill has visually faded out (200ms).
        window.setTimeout(() => {
          if (!targetRef.current) setLabel('');
        }, 200);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      delete document.documentElement.dataset.magneticCursor;
    };
  }, [enabled, x, y, hover]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ x: springX, y: springY }}
    >
      {/* Base ring — always rendered. In reduced-motion mode this is
          the only visual (no pill morph). */}
      <motion.div
        style={{
          width: ringSize,
          height: ringSize,
          marginLeft: ringOffset,
          marginTop: ringOffset,
          backgroundColor: reduced ? 'rgba(0,0,0,0)' : ringBg,
          borderColor: 'var(--color-mesh)',
          opacity: reduced ? 1 : ringOpacity,
          // Drop-shadow replaces the previous `mix-blend-difference` —
          // gives the mesh-orange ring enough contrast to read against
          // bg-paper (#FAFAFA) pages without compositing against the
          // hero/plant canvases on every spring tick (the blend mode's
          // perf cost). 1 px dark halo at low alpha is invisible on
          // dark backgrounds, pops on light.
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
        }}
        className="rounded-full border-2"
      />
      {/* Labelled pill — only renders when label is non-empty AND
          reduced-motion is off. Centered on the pointer; animates
          width via auto + padding. */}
      {!reduced && label ? (
        <motion.div
          style={{
            opacity: pillOpacity,
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--color-saffron)',
            color: 'var(--color-graphite)',
            paddingInline: 12,
            paddingBlock: 6,
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
          className="font-eyebrow text-[12px] font-semibold"
        >
          <motion.span style={{ opacity: labelOpacity }}>{label}</motion.span>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
