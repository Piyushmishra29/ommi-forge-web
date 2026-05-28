'use client';

import { createElement, useCallback, useMemo } from 'react';
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
  // Callback ref — captures the element in an effect-equivalent phase
  // (post-commit) rather than during render. Forces a reflow so any
  // consumer ScrollTrigger that reads layout post-split sees the final
  // dimensions.
  const setRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    void el.offsetHeight;
  }, []);

  // Memoize the split so we don't re-allocate per render.
  const words = useMemo(() => children.split(/(\s+)/), [children]); // keep whitespace tokens

  return createElement(
    as,
    {
      ref: setRef,
      className: cn('inline-block', className),
      'data-split-text': '',
      'aria-label': children,
    },
    words.map((token, wi) => {
      if (/^\s+$/.test(token)) {
        // Preserve the inter-word space AT THE CHAR FONT SIZE. When the
        // font-size lives on `charClassName` (e.g. the closing CTAs), a
        // bare text-node space renders at the parent's inherited base
        // size — which between 100px chars looks like no space at all
        // ("Let'sforge"). Wrapping it in a span that carries
        // charClassName scales the space to match. `inline` (not
        // inline-block) so the whitespace itself isn't collapsed.
        return (
          <span key={`s-${wi}`} aria-hidden className={charClassName}>
            {token}
          </span>
        );
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
