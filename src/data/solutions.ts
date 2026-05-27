/**
 * Four forging methods surfaced on `/solutions`.
 *
 * Each method becomes a pinned segment with a sticky technical
 * illustration on the left and copy on the right. Specs are lifted
 * from the source ommiforge.com Solutions page.
 */

export type IllustrationShape = 'circle' | 'square' | 'ring' | 'pillar';

export interface ForgingMethod {
  number: string;
  title: string;
  spec: string;
  body: string;
  shape: IllustrationShape;
}

export const FORGING_METHODS: ReadonlyArray<ForgingMethod> = [
  {
    number: '01',
    title: 'Closed Die Forging',
    spec: '0.5 kg – 50 kg per piece',
    body: 'Equipped with a battery of 8 Power Hammers. Complex profiles ranging from 0.5 kg – 50 kg a piece. The bread and butter of our line — near-net-shape parts in tight tolerances, run at production volume.',
    shape: 'square',
  },
  {
    number: '02',
    title: 'Open Die Forging',
    spec: 'Up to 500 kg per piece, 2000 mm length',
    body: 'Various shapes ranging up to 500 kg a piece. Shafts up to 2000 mm in length. Open-die is where the big stuff happens — large rotors, marine shafts, mill rolls. Heavy hammers, longer cycles, hand-finished by veterans.',
    shape: 'pillar',
  },
  {
    number: '03',
    title: 'Ring Rolling',
    spec: '150 mm – 1500 mm diameter',
    body: 'Rings from 150 mm – 1500 mm in diameter. Seamless rolled rings for bearings, flanges, turbines and gearbox housings — forged from a billet, expanded under a roller, finished without a weld in sight.',
    shape: 'ring',
  },
  {
    number: '04',
    title: 'Upset Forging',
    spec: 'Up to 6" diameter, 1000 mm length',
    body: 'Shafts up to 6" in diameter and 1000 mm length. The right tool for headed parts and shouldered shafts — bolts, axle stubs, drilling components — formed end-on so grain flow runs continuous through the heaviest section.',
    shape: 'circle',
  },
];
