/**
 * Four forging methods surfaced on `/solutions`.
 *
 * Each method becomes a pinned segment with a sticky technical
 * illustration on the left and copy on the right. Specs are lifted
 * from the source ommiforge.com Solutions page.
 *
 * `sample` links each method to a representative part from the
 * `RENDERS` catalogue (see `src/data/renders.ts`) so the right column
 * can embed a live `<StlPreview>` of an actual forged piece.
 */

export type IllustrationKey = 'closed-die' | 'open-die' | 'ring' | 'upset';

export interface ForgingMethod {
  number: string;
  title: string;
  /** Short label used in the magnetic CTA and step rail. */
  shortLabel: string;
  spec: string;
  body: string;
  illustration: IllustrationKey;
  /** Slug from `RENDERS` — drives the `<StlPreview>` next to each method. */
  sampleSlug: string;
  /** Display name for the sample part (shown beneath the preview). */
  sampleName: string;
}

export const FORGING_METHODS: ReadonlyArray<ForgingMethod> = [
  {
    number: '01',
    title: 'Closed Die Forging',
    shortLabel: 'Closed Die',
    spec: '0.5 kg – 50 kg per piece · 8 power hammers',
    body: 'Equipped with a battery of 8 Power Hammers. Complex profiles ranging from 0.5 kg – 50 kg a piece. The bread and butter of our line — near-net-shape parts in tight tolerances, run at production volume.',
    illustration: 'closed-die',
    sampleSlug: 'g',
    sampleName: 'Forged Sprocket',
  },
  {
    number: '02',
    title: 'Open Die Forging',
    shortLabel: 'Open Die',
    spec: 'Up to 500 kg per piece · shafts to 2000 mm',
    body: 'Various shapes ranging up to 500 kg a piece. Shafts up to 2000 mm in length. Open-die is where the big stuff happens — large rotors, marine shafts, mill rolls. Heavy hammers, longer cycles, hand-finished by veterans.',
    illustration: 'open-die',
    sampleSlug: 'd',
    sampleName: 'Steam Manifold',
  },
  {
    number: '03',
    title: 'Ring Rolling',
    shortLabel: 'Ring Rolling',
    spec: '150 mm – 1500 mm diameter · seamless',
    body: 'Rings from 150 mm – 1500 mm in diameter. Seamless rolled rings for bearings, flanges, turbines and gearbox housings — forged from a billet, expanded under a roller, finished without a weld in sight.',
    illustration: 'ring',
    sampleSlug: 'h',
    sampleName: 'Hub',
  },
  {
    number: '04',
    title: 'Upset Forging',
    shortLabel: 'Upset',
    spec: 'Up to 6" diameter · shafts to 1000 mm',
    body: 'Shafts up to 6" in diameter and 1000 mm length. The right tool for headed parts and shouldered shafts — bolts, axle stubs, drilling components — formed end-on so grain flow runs continuous through the heaviest section.',
    illustration: 'upset',
    sampleSlug: 'i',
    sampleName: 'Connecting Rod',
  },
];

/**
 * Hero copy for `/solutions`. Kept in the data file so the section
 * component is structural-only.
 */
export const SOLUTIONS_HERO = {
  eyebrow: 'FOUR METHODS · ONE FLOOR',
  headlineLine1: 'Every shape',
  headlineLine2: 'a billet can take.',
  subhead:
    'From half-kilo levers to half-tonne shafts, every part on our line is shaped under heat by one of four forging methods. Eight power hammers, an open-die line, a ring-rolling mill and an upset-forging line — picked to fit the part, never the other way around.',
} as const;

/**
 * Closing slab CTA for `/solutions`. Sits below the four pinned method
 * panels.
 */
export const SOLUTIONS_CLOSING_CTA = {
  eyebrow: 'READY TO BUILD',
  headline: 'Send us your spec.',
  subhead:
    'Drawings, samples, or a paragraph in an email — we will quote the right method for the part and have a price back in a day.',
  primary: { label: 'Send us a spec sheet →', href: '/contact/' },
  secondary: { label: 'Browse our 3D renders', href: '/renders/' },
} as const;
