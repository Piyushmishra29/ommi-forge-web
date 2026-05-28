/**
 * Home-page copy + structured content (single source of truth).
 *
 * Component files import only what they need; this keeps the
 * cinematic section components themselves lean and the copy
 * editable in one place.
 */

export const HERO_COPY = {
  eyebrow: 'EST. 1975 · BANGALORE',
  headlineLine1: 'Forged in India',
  headlineLine2: 'since nineteen seventy-five.',
  subhead: 'For all your forging needs.',
  primaryCta: { label: 'Request a Quote', href: '/contact/' },
  secondaryCta: { label: 'See our work', href: '/renders/' },
} as const;

export const HAMMER_INTRO_WORDS = ['Heat', 'Strike', 'Forge'] as const;
export type HammerIntroWord = (typeof HAMMER_INTRO_WORDS)[number];

export const STATS = [
  { value: 8, suffix: '', label: 'Power Hammers' },
  { value: 1000, suffix: '+', label: 'Metric tons / year' },
  { value: 100, suffix: '+', label: 'Parts developed' },
  { value: 1, suffix: '', label: 'Day quote-to-part' },
] as const;

export type Milestone = {
  year: string;
  title: string;
  body: string;
  inProgress?: boolean;
};

export const MILESTONES: Milestone[] = [
  {
    year: '1975',
    title: 'Founded',
    body:
      'BG Ashwath founds Ommi Forge in the Vishweshwarya industrial area of Bangalore after a long career inside the city’s forging scene.',
  },
  {
    year: '1985',
    title: 'Closed-die expansion',
    body:
      'A second hammer line is commissioned, opening up closed-die forging for automotive and transmission customers.',
  },
  {
    year: '2000',
    title: 'Malur plant',
    body:
      'The company relocates to its current 3-acre plant on Plot 300–302 in the Malur industrial area, gaining the floor space for ring-rolling and upset forging.',
  },
  {
    year: '2015',
    title: 'In-house metallurgy',
    body:
      'An in-house metallurgist lab is established, putting chemistry and grain-structure verification under the same roof as the forge.',
  },
  {
    year: '2022',
    title: '3D render catalogue',
    body:
      'A digital catalogue of nine signature parts goes online — every render is a real, forged Ommi product, viewable on the web in WebGL.',
  },
  {
    year: '2026',
    title: 'Electric forging pilot',
    body:
      'Pilot project underway to convert the smallest hammer line to grid-electric induction heating, cutting plant gas demand.',
    inProgress: true,
  },
];

export const LOCATION = {
  street: 'Plot No 300, 301 & 302, 3rd Phase,',
  area: 'Industrial Area, Malur,',
  region: 'Karnataka 563160',
  phone: '+91 8951953866',
  phoneHref: 'tel:+918951953866',
  email: 'marketing@ommiforge.com',
  emailHref: 'mailto:marketing@ommiforge.com',
  hours: 'Sun – Fri · 9AM – 5PM',
  lat: 12.993316,
  lng: 77.926169,
  /** Google Maps embed URL (no API key required for the simple embed). */
  embed:
    'https://www.google.com/maps?q=12.993316,77.926169&z=15&output=embed',
  /** Public link that opens the location in the visitor’s Maps app. */
  openInMaps:
    'https://www.google.com/maps/search/?api=1&query=12.993316,77.926169',
} as const;

/**
 * Image assets surfaced on the Forged Products marquee. Paths are all
 * confirmed-present on disk in `public/assets/images/` (including the
 * `1-5`, `1-8`, and `1-10` legacy WordPress slugs which now have local
 * jpg/webp/avif siblings). The foundry-floor DSC photos round out the
 * pool so the marquee has enough unique tiles for two image-heavy
 * rows. Each tile still has a built-in CSS fallback in
 * `ProductsMarquee` if a file goes missing later.
 */
export const PRODUCT_IMAGES: string[] = [
  '/assets/images/1-2-scaled.jpg',
  '/assets/images/1-3-scaled.jpg',
  '/assets/images/1-4-scaled.jpg',
  '/assets/images/1-5-scaled.jpg',
  '/assets/images/1-6-scaled.jpg',
  '/assets/images/1-7-scaled.jpg',
  '/assets/images/1-8-scaled.jpg',
  '/assets/images/1-9-scaled.jpg',
  '/assets/images/1-10-scaled.jpg',
  '/assets/images/1-11-scaled.jpg',
  '/assets/images/DSC09268.jpg',
  '/assets/images/DSC09309.jpg',
  '/assets/images/DSC09326.jpg',
  '/assets/images/DSC09350.jpg',
];

export const CLOSING_CTA = {
  headline: "Let’s forge something.",
  subhead: 'Quote-to-part in as little as a day.',
  primary: { label: 'Start a quote', href: '/contact/' },
  secondary: { label: 'Browse our 3D renders', href: '/renders/' },
} as const;
