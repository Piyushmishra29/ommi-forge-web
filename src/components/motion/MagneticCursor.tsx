'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

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
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hoverCapable = window.matchMedia('(hover: hover)').matches;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!hoverCapable || reduceMotion) {
      setEnabled(false);
      return;
    }

    setEnabled(true);
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
        setHover(true);
      }
    };

    const onOut = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('[data-magnetic]');
      if (el && !el.contains(e.relatedTarget as Node | null)) {
        targetRef.current = null;
        setHover(false);
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
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ x: springX, y: springY }}
    >
      <motion.div
        animate={{
          width: hover ? 48 : 16,
          height: hover ? 48 : 16,
          marginLeft: hover ? -24 : -8,
          marginTop: hover ? -24 : -8,
          backgroundColor: hover ? 'var(--color-saffron)' : 'rgba(0,0,0,0)',
          borderColor: 'var(--color-mesh)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="rounded-full border-2 mix-blend-difference"
      />
    </motion.div>
  );
}
