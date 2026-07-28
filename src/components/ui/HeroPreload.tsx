'use client';

import { usePathname } from 'next/navigation';

/**
 * HeroPreload — the home hero's LCP preload, scoped to the home route.
 *
 * This lived unconditionally in the root layout's <head>, which meant the
 * 57 KB hero frame was fetched at `fetchPriority="high"` on all 12 routes
 * while being used by exactly one. Chrome logs "preloaded but not used"
 * on every secondary route, and the cost is worse than the wasted bytes:
 * a high-priority fetch for an unused asset competes for bandwidth and
 * connections with the *actual* LCP image of the page you are on. In v2
 * the hero sequence was the only hero on the site so a global preload was
 * defensible; in v3 every route has its own hero content, so it is not.
 *
 * Why a client component rather than moving the tags into `app/page.tsx`:
 * Next 16 gives layouts no access to the current segment, and `/` is
 * another agent's lane. `usePathname()` is evaluated during prerender, so
 * under `output: 'export'` each route's static HTML is emitted with the
 * correct answer baked in — `/index.html` gets the links, the other 11 do
 * not. React 19 hoists `<link>` into <head> from anywhere in the tree, so
 * they still land in the right place.
 *
 * `trailingSlash: true` is set in next.config.ts, so both `/` and the
 * bare `''` are accepted defensively.
 *
 * DO NOT "fix" `fetchPriority` to lowercase `fetchpriority`. The camelCase
 * spelling is the React prop name; React 19 lowercases it to the HTML
 * attribute on the way out. Writing it lowercase in JSX makes React reject
 * it as an unknown DOM property and silently drop it, which is exactly the
 * bug the v2 pass fixed — the preload then runs at default priority.
 */
export default function HeroPreload() {
  const pathname = usePathname();
  if (pathname !== '/' && pathname !== '') return null;

  return (
    <>
      {/* Media-scoped so a phone preloads the 768-wide frame and a desktop
          the 1280-wide one — never both — matching the variant the hook
          picks on mount. */}
      <link
        rel="preload"
        as="image"
        href="/assets/frames/hero/1280/f-001.webp"
        type="image/webp"
        media="(min-width: 1024px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/assets/frames/hero/768/f-001.webp"
        type="image/webp"
        media="(max-width: 1023px)"
        fetchPriority="high"
      />
    </>
  );
}
