'use client';

import { useCallback, useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import SplitText from './SplitText';

type RevealAs = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';

interface RevealHeadingProps {
  children: string;
  as?: RevealAs;
  className?: string;
  /** When the trigger should enter — default 'top 80%' (trigger top hits 80% down the viewport). */
  start?: string;
  /** Per-char stagger seconds — default 0.018. */
  stagger?: number;
  /** Words instead of chars — pass through to SplitText. */
  byWord?: boolean;
}

/**
 * RevealHeading
 *
 * Split-on-mount + ScrollTrigger-driven reveal. The wrapped text appears
 * with its characters staggered in from y=24, opacity=0 the first time
 * the heading scrolls into view. After that it stays at rest — no
 * re-trigger on scroll-back, no per-frame React renders.
 *
 * Layout shape: an `as`-typed semantic heading element CARRIES the
 * user's `className` (so `mt-6` etc. drive block layout as written),
 * and a `<SplitText as="span">` renders the split chars INSIDE it.
 * The heading element doubles as the gsap.context scope and the
 * ScrollTrigger trigger — it has a real bounding box, so the trigger
 * resolves correctly even inside pinned sections.
 *
 * Respects OS reduced-motion: skips the timeline and renders at rest.
 * Cleans up the ScrollTrigger + gsap.context on unmount so route
 * changes don't leak triggers.
 */
export default function RevealHeading({
  children,
  as = 'h2',
  className,
  start = 'top 80%',
  stagger = 0.018,
  byWord = false,
}: RevealHeadingProps) {
  const root = useRef<HTMLElement | null>(null);
  // Callback ref keeps us out of the react-hooks/refs lint rule
  // ("passing a ref to a function reads its value during render").
  const setRoot = useCallback((el: HTMLElement | null) => {
    root.current = el;
  }, []);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll(
        byWord ? '[data-word]' : '[data-char]',
      );
      if (!targets.length) return;
      gsap.set(targets, { y: 24, opacity: 0 });
      gsap.to(targets, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none none',
        },
      });
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => {
        const trig = t.trigger as Element | null | undefined;
        if (trig === el) t.kill();
      });
    };
  }, [reduced, start, stagger, byWord]);

  // Narrow to a JSX intrinsic tag union so the ref/className props
  // type-check. `ElementType` alone is too broad — TS can't infer
  // valid ref types from it.
  const Tag = as as 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  return (
    <Tag ref={setRoot as React.Ref<HTMLHeadingElement>} className={className}>
      <SplitText as="span" byWord={byWord}>
        {children}
      </SplitText>
    </Tag>
  );
}
