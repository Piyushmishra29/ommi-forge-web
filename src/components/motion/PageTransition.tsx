'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition
 *
 * Handles the content crossfade between routes. The children are wrapped
 * in an AnimatePresence that's keyed on the current pathname, so exiting
 * content can finish its animation before the next route mounts.
 *
 * The saffron wipe slab is a SEPARATE component — `<PageWipe />` — that
 * must be mounted as a sibling under <body>, NOT nested inside this
 * component. Keeping them peer-level means the wipe never gets unmounted
 * alongside the content tree.
 *
 * Respects `prefers-reduced-motion` — falls through without animating.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * PageWipe
 *
 * The saffron slab that wipes UP from the bottom on route enter and OUT
 * to the top on route exit. Lives as a fixed, full-viewport overlay,
 * keyed on pathname so AnimatePresence can play enter + exit phases
 * independently of the content tree.
 *
 * The overlay is `visibility: hidden` while idle so it never blocks
 * pointer events or paints over content between transitions.
 *
 * Respects `prefers-reduced-motion` — renders nothing in that case.
 */
export function PageWipe() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9000]"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => setVisible(false)}
      >
        <motion.div
          key={pathname}
          className="h-full w-full"
          style={{ background: 'var(--color-saffron)' }}
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1, originY: 1 }}
          exit={{ scaleY: 0, originY: 0 }}
          transition={{ duration: 0.32, ease: [0.83, 0, 0.17, 1] }}
          onAnimationStart={() => setVisible(true)}
        />
      </AnimatePresence>
    </div>
  );
}
