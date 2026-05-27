'use client';

import { createElement, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

type SplitAs = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';

interface SplitTextProps {
  children: string;
  as?: SplitAs;
  className?: string;
  charClassName?: string;
  /** Splits by words instead of characters. Default: false (chars). */
  byWord?: boolean;
}

/**
 * SplitText (DIY, free)
 *
 * Splits its text content into `<span data-char>` (or `data-word`)
 * elements on mount so consumers can target them with GSAP timelines:
 *
 *   gsap.from('[data-split-text] [data-char]', { y: 40, opacity: 0, stagger: 0.02 });
 *
 * Whitespace is preserved as plain text nodes so word wrapping stays
 * natural and screen readers still read the original string (the
 * source string is also exposed via `aria-label`).
 */
export default function SplitText({
  children,
  as = 'span',
  className,
  charClassName,
  byWord = false,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Re-run when the source text changes so server-rendered output
    // stays in sync with the split DOM (helps with strict mode + HMR).
    const el = ref.current;
    if (!el) return;
    // Force a reflow once so any consumer ScrollTrigger that reads
    // layout post-split sees the final dimensions.
    void el.offsetHeight;
  }, [children]);

  const words = children.split(/(\s+)/); // keep whitespace tokens

  return createElement(
    as,
    {
      ref,
      className: cn('inline-block', className),
      'data-split-text': '',
      'aria-label': children,
    },
    words.map((token, wi) => {
      if (/^\s+$/.test(token)) {
        return token;
      }
      if (byWord) {
        return (
          <span
            key={`w-${wi}`}
            data-word=""
            className={cn('inline-block', charClassName)}
            aria-hidden
          >
            {token}
          </span>
        );
      }
      return (
        <span
          key={`w-${wi}`}
          data-word=""
          aria-hidden
        >
          {Array.from(token).map((ch, ci) => (
            <span
              key={`c-${wi}-${ci}`}
              data-char=""
              className={cn('inline-block', charClassName)}
            >
              {ch}
            </span>
          ))}
        </span>
      );
    }),
  );
}
