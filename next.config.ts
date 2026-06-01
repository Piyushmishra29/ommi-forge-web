import type { NextConfig } from 'next';

/**
 * Static export configuration.
 *
 * - `output: 'export'`        → emit `out/` with HTML/CSS/JS only
 * - `images.unoptimized: true`→ required when exporting (no Image
 *                                Optimization server at runtime)
 * - `trailingSlash: true`     → emit `/about/index.html` so any static
 *                                host (Hostinger, Netlify, S3) serves
 *                                clean URLs out of the box
 *
 * NOTE: Next.js' built-in `redirects()` is a no-op under
 * `output: 'export'`. Legacy WordPress slugs are handled two ways:
 *   1. `public/_redirects` (Netlify-style file, also honoured by some
 *      static hosts) — primary path
 *   2. A tiny client-side fallback in `src/app/layout.tsx` that maps
 *      `window.location.pathname` to its successor at mount time
 *      (belt + suspenders)
 *
 * Both layers read from `src/data/nav.ts` → `LEGACY_REDIRECTS`.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Tree-shake heavy packages that ship lots of named exports but get
  // imported piecemeal. Without this, an `import { useReducedMotion }`
  // from framer-motion pulls in the whole package on every route.
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@react-three/drei',
      'lucide-react',
    ],
  },
};

export default nextConfig;
