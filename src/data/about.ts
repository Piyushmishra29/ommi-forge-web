/**
 * Content for `/about` — heritage chapters, values cards, sustainability
 * paragraphs. Copy is a mix of lifted-verbatim text from the source
 * ommiforge.com About page and natural extensions written in the same
 * voice (modernisation, Malur move, closed-die scale-up).
 */

export interface HeritageChapter {
  year: string;
  heading: string;
  body: string;
}

export const HERITAGE_CHAPTERS: ReadonlyArray<HeritageChapter> = [
  {
    year: '1975',
    heading: 'A line in Vishweshwarya',
    body: 'Ommi Forge Pvt. Ltd. was founded in the year 1975 by BG Ashwath, who saw a demand after his experience in the industry. The journey began on an open forging line, supplying primarily only to general engineering. The plant was located in a then-developing Vishweshwarya industrial area.',
  },
  {
    year: '1985',
    heading: 'Closed-die capacity',
    body: 'Through the eighties the shop floor expanded from a single open hammer to a battery of closed-die hammers, opening the door to higher-volume, near-net-shape parts for tractor, truck and farm-machinery clients. The metallurgical lab moved in-house in the same decade — chemistry-on-arrival became non-negotiable.',
  },
  {
    year: '2000',
    heading: 'Move to Malur',
    body: 'At the turn of the millennium the company relocated to Plot 300–302 in the 3rd Phase of the Malur Industrial Area. The new site was laid out for flow — heat-treatment beside forging, machining beside heat-treatment, packing beside despatch — so a billet could enter on one side of the building and leave a finished part on the other.',
  },
  {
    year: 'Today',
    heading: 'Fifty-one harvests',
    body: 'A second-generation leadership team runs eight power hammers, an open-die line up to 500 kg per piece, a ring-rolling mill, and an upset-forging line. We forge for customers across India, South-East Asia, the Middle East and Europe — and a metallurgist still signs every certificate that leaves the gate.',
  },
];

export interface ValueCard {
  number: string;
  title: string;
  body: string;
}

export const VALUES: ReadonlyArray<ValueCard> = [
  {
    number: '01',
    title: 'Quality',
    body: 'Ommi Forge is driven by passion and care; there is no compromise when it comes to the quality of our products, and production process.',
  },
  {
    number: '02',
    title: 'Enterprising',
    body: 'With our forward-thinking leaders, paving our way into the future, Ommi Forge is constantly being bettered and ahead of the game.',
  },
  {
    number: '03',
    title: 'Partners, not clients',
    body: 'We treat our customers with a great deal of trust and transparency. Our customers are not only clients, but they are a part of our story as an organisation.',
  },
];

export const SUSTAINABILITY = {
  eyebrow: 'STEWARDSHIP',
  heading: 'Greener heat. Quieter water.',
  body1:
    'We are ensuring self reliance for water and food, with our rain water systems and vegetable gardens; with little to no strain on production activities. We limit our use of air conditioners to the clean rooms; and have our office and workshops designed for abundant ventilation, which cuts any unnecessary use of power.',
  body2:
    'We have adopted a greener manufacturing process to be more environmentally conscious and reduce our carbon footprint. The shift to white lubricants from polluting lubricants has already been made; and we are moving away from the use of furnace oil and LDO — and towards electric heating.',
} as const;

export const FOUNDER_QUOTE = {
  body: 'Quality is not a slogan — it is a process.',
  attribution: 'BG Ashwath, Founder',
} as const;
