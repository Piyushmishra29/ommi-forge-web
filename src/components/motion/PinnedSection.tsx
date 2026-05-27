'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { cn } from '@/lib/cn';

interface PinnedScrollContext {
  progress: number;
}

const PinnedScrollContext = createContext<PinnedScrollContext>({ progress: 0 });

/**
 * useScroll
 *
 * Reads scroll progress (0..1) from the nearest <PinnedSection> ancestor.
 * Returns `{ progress: 0 }` outside a PinnedSection so consumers don't
 * need to defensively null-check.
 */
export function useScroll(): PinnedScrollContext {
  return useContext(PinnedScrollContext);
}

interface PinnedSectionProps {
  children: React.ReactNode;
  /**
   * How far the section pins, in viewport heights. Default 1 (= 100vh).
   * Effectively the section "holds" for `length * 100vh` of scroll.
   */
  length?: number;
  className?: string;
  id?: string;
}

/**
 * PinnedSection
 *
 * A ScrollTrigger-pinned wrapper that exposes scroll progress (0..1) to
 * descendants via the `useScroll()` hook. The actual pinned element is
 * the inner content container — the outer wrapper sets the scroll
 * length so the page knows how much real estate to allocate.
 *
 * In reduced-motion mode the section degrades to a normal stacked
 * block (no pin, no progress tracking).
 */
const PinnedSection = forwardRef<HTMLDivElement, PinnedSectionProps>(
  function PinnedSection({ children, length = 1, className, id }, ref) {
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reduce) return;

      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: outer,
          start: 'top top',
          end: () => `+=${window.innerHeight * length}`,
          pin: inner,
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress(self.progress),
        });
      }, outer);

      return () => ctx.revert();
    }, [length]);

    return (
      <PinnedScrollContext.Provider value={{ progress }}>
        <div
          ref={(node) => {
            outerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          className={cn('relative', className)}
        >
          <div ref={innerRef} className="h-screen w-full overflow-hidden">
            {children}
          </div>
        </div>
      </PinnedScrollContext.Provider>
    );
  },
);

export default PinnedSection;
