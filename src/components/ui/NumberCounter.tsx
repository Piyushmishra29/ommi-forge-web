'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/cn';

interface NumberCounterProps {
  /** The final value to count up to. */
  to: number;
  /** Optional suffix appended after the number (e.g. "+", "MT", "DAY"). */
  suffix?: string;
  /** Optional prefix prepended before the number (e.g. "₹"). */
  prefix?: string;
  /** Animation duration in seconds. */
  duration?: number;
  /** Decimal places to preserve. */
  decimals?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * NumberCounter
 *
 * Counts from 0 → `to` once the element enters the viewport. Uses
 * Framer Motion's `useInView` for the trigger plus a `useMotionValue`
 * tween so the number animates without forcing React re-renders.
 *
 * Honours reduced-motion: jumps straight to the final value.
 */
export default function NumberCounter({
  to,
  suffix = '',
  prefix = '',
  duration = 1.6,
  decimals = 0,
  className,
  ariaLabel,
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });

  // Stable formatter — only re-creates when decimals changes.
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );

  // Animate the raw number via a motion value; pipe to a string via
  // useTransform so the rendered text updates outside React state.
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => `${prefix}${formatter.format(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;

    if (typeof window === 'undefined') {
      count.set(to);
      return;
    }

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      count.set(to);
      return;
    }

    const controls = animate(count, to, {
      duration,
      ease: [0, 0, 0.2, 1], // easeOutCubic-ish — gentle settle
    });
    return () => controls.stop();
  }, [inView, to, duration, count]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {/* A bare <span> maps to the `generic` role, and ARIA does not let
          generics take an accessible name from author — the old
          `aria-label` on this wrapper was silently dropped by screen
          readers, leaving nothing at all once the animated span was
          aria-hidden. A visually-hidden twin is unconditional. It also
          reads the *formatted* figure (50,000, not 50000), which the old
          label didn't. */}
      <span className="sr-only">
        {ariaLabel ?? `${prefix}${formatter.format(to)}${suffix}`}
      </span>
      <motion.span aria-hidden>{text}</motion.span>
    </span>
  );
}
