'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

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
  return (
    window.matchMedia('(hover: hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getServerSnapshot() {
  return false;
}

/**
 * MagneticCursor
 *
 * A 16px mesh-orange ring that tracks the mouse with spring easing.
 * On hover of any `[data-magnetic]` element it scales to 48px, fills
 * with saffron, and attracts toward the element's center.
 *
 * Disabled on:
 *  - touch / coarse-pointer devices (`@media (hover: none)`)
 *  - users with `prefers-reduced-motion: reduce`
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

  // Pointer position + hover state ride on motion values so updates
  // don't trigger React re-renders.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const hover = useMotionValue(0); // 0 = idle, 1 = hovering magnetic target
  const springX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  // Derive animated style props off the hover motion value.
  const size = useTransform(hover, [0, 1], [16, 48]);
  const offset = useTransform(hover, [0, 1], [-8, -24]);
  const bg = useTransform(
    hover,
    [0, 1],
    ['rgba(0,0,0,0)', 'var(--color-saffron)'],
  );

  const targetRef = useRef<Element | null>(null);

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
        hover.set(1);
      }
    };

    const onOut = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('[data-magnetic]');
      if (el && !el.contains(e.relatedTarget as Node | null)) {
        targetRef.current = null;
        hover.set(0);
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
      <motion.div
        style={{
          width: size,
          height: size,
          marginLeft: offset,
          marginTop: offset,
          backgroundColor: bg,
          borderColor: 'var(--color-mesh)',
        }}
        className="rounded-full border-2 mix-blend-difference"
      />
    </motion.div>
  );
}
