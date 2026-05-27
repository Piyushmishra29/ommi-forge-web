'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition
 *
 * A saffron slab that wipes in from the bottom on route enter and out
 * to the top on route exit, keyed on `usePathname()`. Uses Framer
 * Motion's AnimatePresence so the exit animation completes before the
 * next slab enters.
 *
 * Respects `prefers-reduced-motion` — falls through without animating.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <>
      {children}
      {!reduce && (
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[9000] origin-bottom bg-saffron"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 1, transformOrigin: 'top' }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          />
        </AnimatePresence>
      )}
    </>
  );
}
