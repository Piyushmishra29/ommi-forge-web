'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
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
 * Framer Motion's `useInView` for the trigger and a manual rAF tween
 * so we don't pull GSAP in for trivial number animation.
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
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (typeof window === 'undefined') {
      setValue(to);
      return;
    }

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      setValue(to);
      return;
    }

    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // easeOutCubic — gentle settle
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [inView, to, duration]);

  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
      aria-label={ariaLabel ?? `${prefix}${to}${suffix}`}
    >
      <span aria-hidden>
        {prefix}
        {formatted}
        {suffix}
      </span>
    </span>
  );
}
