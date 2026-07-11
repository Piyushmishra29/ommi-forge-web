'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition
 *
 * Fade-IN only on route change — deliberately NOT an AnimatePresence
 * crossfade. With framer-motion 12 on React 19, AnimatePresence route
 * exits complete visually (opacity 0) but the exited subtree is never
 * unmounted: every navigation stacked another full invisible page in
 * the DOM (~19k px of phantom scroll height each, GSAP pin-spacers and
 * all) and the return trip even spawned duplicate exiting copies. A
 * keyed motion.div gives the new page its soft entrance beat while
 * React removes the old page synchronously — no exit tracking, nothing
 * to get stuck.
 *
 * Respects `prefers-reduced-motion` — falls through without animating.
 *
 * (A `<PageWipe />` saffron slab and the AnimatePresence crossfade both
 * used to live here; both were removed for getting permanently stuck.)
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
