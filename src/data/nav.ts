export interface NavItem {
  label: string;
  href: string;
}

// Trailing slashes match `trailingSlash: true` in next.config.ts —
// avoids a 308 redirect hop on every navigation.
export const NAV: ReadonlyArray<NavItem> = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Solutions', href: '/solutions/' },
  { label: 'Products', href: '/products/' },
  { label: 'Materials', href: '/materials/' },
  { label: '3D Renders', href: '/renders/' },
  { label: 'Careers', href: '/careers/' },
];

export const CTA: NavItem = {
  label: 'Request a Quote',
  href: '/contact/',
};

