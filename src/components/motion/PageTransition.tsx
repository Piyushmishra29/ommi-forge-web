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
    // No `mode="wait"` — wait creates a blank gap because exit must
    // complete before enter starts; on the default overlap mode the old
    // page fades out while the new fades in, no visible blank. Opacity-
    // only (no y-translate) reads as a soft dissolve rather than a
    // mechanical slide. Short duration (0.22 s) so it feels like a quiet
    // beat, not a transition slab.
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
