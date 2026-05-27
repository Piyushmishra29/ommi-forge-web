/**
 * Materials data — Carbon / Alloy / Stainless / Custom steel families.
 *
 * Lifted verbatim from the source ommiforge.com Materials page and the
 * Elementor copy blocks. The home page surfaces only the family-level
 * summary; `/materials` reuses this same data to render the full grade
 * tables.
 *
 * The blurbs are written so the same string works on both the home
 * grid card and the materials detail page hero — keep them
 * stand-alone, no inter-sentence references.
 */

export type GradeFamily = {
  /** Family display name (e.g. "Tool & Die"). */
  name: string;
  /** Comma-separated grade designations. */
  grades: string;
};

export type Material = {
  /** URL-safe slug for /materials/[slug] (future). */
  slug: 'carbon' | 'alloy' | 'stainless' | 'custom';
  /** Two-digit numeric prefix shown on the card. */
  number: string;
  /** Display name (e.g. "Carbon Steels"). */
  name: string;
  /** One-sentence headline used on /materials. */
  tagline: string;
  /** Long-form description (3–4 sentences) for the home grid card. */
  blurb: string;
  /** Sub-families with example grades — surfaced on /materials only. */
  families: GradeFamily[];
};

/**
 * Section intro paragraph (used on the home `<MaterialsGrid />` heading).
 * Lifted from the source Materials page intro.
 */
export const MATERIALS_INTRO =
  'Ommi Forge works across four families of steel — carbon, alloy, stainless, and bespoke custom alloys. Within each, dozens of grades. Tell us the application; we will tell you the steel.';

export const MATERIALS: Material[] = [
  {
    slug: 'carbon',
    number: '01',
    name: 'Carbon Steels',
    tagline: 'Workhorse grades, from low to high carbon.',
    blurb:
      'The workhorse of the forge floor. Low-, medium-, and high-carbon grades cover everything from formed brackets to cam shafts and crank components. Our most-forged family by tonnage.',
    families: [
      { name: 'Low carbon', grades: 'C10, C15, C20, EN-2A, EN-3A' },
      { name: 'Medium carbon', grades: 'C40, C45, C50, EN-8, EN-9' },
      { name: 'High carbon', grades: 'C60, C70, EN-42, EN-43' },
    ],
  },
  {
    slug: 'alloy',
    number: '02',
    name: 'Alloy Steels',
    tagline: 'Chrome, nickel, moly — tuned for the job.',
    blurb:
      'When a part needs hardenability or fatigue life that plain carbon cannot meet, alloy steels step in. Chromium, nickel, and molybdenum families let us tune for shock, wear, or sustained high-stress duty.',
    families: [
      { name: 'Chromium', grades: '40Cr4, EN-18, SCr420' },
      { name: 'Chrome-moly', grades: '42CrMo4, EN-19, 4140, 4340' },
      { name: 'Nickel-chrome', grades: 'EN-24, EN-25, 8620' },
    ],
  },
  {
    slug: 'stainless',
    number: '03',
    name: 'Stainless Steels',
    tagline: 'Austenitic, martensitic, duplex.',
    blurb:
      'Forged stainless for corrosive, hygienic, or high-temperature service. We handle austenitic 300-series for chemical and food-grade work, martensitic 400-series for tool-grade hardness, and select duplex grades for offshore and marine.',
    families: [
      { name: 'Austenitic', grades: 'SS 304, SS 304L, SS 316, SS 316L, SS 321' },
      { name: 'Martensitic', grades: 'SS 410, SS 420, SS 440C' },
      { name: 'Duplex', grades: 'SAF 2205, SAF 2507' },
    ],
  },
  {
    slug: 'custom',
    number: '04',
    name: 'Custom Steel',
    tagline: 'Bring us the spec.',
    blurb:
      'Bring us the spec sheet. We source, certify, and forge to customer-supplied chemistries — including tool steels, micro-alloyed grades, and proprietary aerospace blends. Our metallurgist runs the lab in-house, so verification stays under one roof.',
    families: [
      { name: 'Tool & Die', grades: 'D2, D3, H11, H13, M2' },
      { name: 'Micro-alloyed', grades: '38MnVS6, 27MnCrB5' },
      { name: 'Customer-supplied', grades: 'On request' },
    ],
  },
];
