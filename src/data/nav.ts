export interface NavItem {
  label: string;
  href: string;
}

export const NAV: ReadonlyArray<NavItem> = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Products', href: '/products' },
  { label: 'Materials', href: '/materials' },
  { label: '3D Renders', href: '/renders' },
  { label: 'Careers', href: '/careers' },
];

export const CTA: NavItem = {
  label: 'Request a Quote',
  href: '/contact',
};

/**
 * Legacy WordPress slugs → new App Router paths.
 * Used by both `public/_redirects` (Netlify/Hostinger static) AND a
 * client-side fallback in the root layout (belt + suspenders, since
 * `output: 'export'` strips Next.js' native `redirects()` support).
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  '/home/about-ommi-forge': '/about',
  '/home/about-ommi-forge/': '/about',
  '/home/solutuion': '/solutions',
  '/home/solutuion/': '/solutions',
  '/home/forged-products': '/products',
  '/home/forged-products/': '/products',
  '/3d-renders': '/renders',
  '/3d-renders/': '/renders',
  '/render-a': '/renders/part-a',
  '/render-a/': '/renders/part-a',
  '/render-b': '/renders/part-b',
  '/render-b/': '/renders/part-b',
  '/render-c': '/renders/part-c',
  '/render-c/': '/renders/part-c',
  '/render-d': '/renders/part-d',
  '/render-d/': '/renders/part-d',
  '/render-e': '/renders/part-e',
  '/render-e/': '/renders/part-e',
  '/render-f': '/renders/part-f',
  '/render-f/': '/renders/part-f',
  '/render-g': '/renders/part-g',
  '/render-g/': '/renders/part-g',
  '/render-h': '/renders/part-h',
  '/render-h/': '/renders/part-h',
  '/render-h-2': '/renders/part-i',
  '/render-h-2/': '/renders/part-i',
};
