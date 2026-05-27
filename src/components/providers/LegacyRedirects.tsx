'use client';

import { useEffect } from 'react';
import { LEGACY_REDIRECTS } from '@/data/nav';

/**
 * LegacyRedirects
 *
 * Client-side fallback for the WordPress → App Router URL migration.
 * Next.js' `redirects()` config is silently dropped when
 * `output: 'export'` is on, and not every static host honours
 * `public/_redirects`. This component runs on mount, checks the
 * current pathname against the LEGACY_REDIRECTS map, and rewrites the
 * URL in-place with `location.replace` so old links keep working.
 *
 * No UI; returns null.
 */
export default function LegacyRedirects() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const target = LEGACY_REDIRECTS[path] ?? LEGACY_REDIRECTS[path.replace(/\/$/, '')];
    if (target && target !== path) {
      window.location.replace(target);
    }
  }, []);

  return null;
}
