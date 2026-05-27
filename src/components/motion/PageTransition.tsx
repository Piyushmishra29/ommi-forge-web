'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

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
 * Respects `prefers-reduced-motion` — falls through without animating.
 *
 * Note: A `<PageWipe />` saffron slab used to live alongside this
 * component (mounted as a sibling under <body> in layout.tsx). It was
 * removed after it kept getting stuck at full opacity covering the
 * viewport: the wipe needed an enter→hold→exit lifecycle on a single
 * pathname change, but `AnimatePresence` with a single keyed child only
 * exits the OLD child and enters the NEW one — the new child then sat
 * at `scaleY: 1` forever, painting the whole screen saffron. The
 * crossfade below is enough of a brand moment on its own.
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
