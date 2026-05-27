/**
 * Careers content for `/careers`.
 *
 * Per editorial direction: Ommi Forge does not run a posted-roles board.
 * Hiring happens through site visits, supplier relationships, and direct
 * referrals. The page therefore renders a single "send us your CV" panel
 * instead of a list of invented openings.
 *
 * `CAREER_LISTINGS` is exported as an empty array (typed) so the
 * existing component contracts continue to compile, and so a future
 * curated list of real openings can be dropped in without touching the
 * UI.
 */

export interface CareerListing {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  blurb: string;
  responsibilities: string[];
  requirements: string[];
}

export const CAREER_LISTINGS: ReadonlyArray<CareerListing> = [];

export const CAREERS_CTA = {
  eyebrow: 'We hire when we hire',
  heading: 'Send us your CV.',
  body:
    'Ommi Forge does not run a posted-roles board. We hire people we meet — through site visits, supplier relationships, and direct referrals. If you make great parts or believe you would, write to us.',
  email: 'marketing@ommiforge.com',
} as const;

/**
 * `WHAT_WE_LOOK_FOR`
 *
 * The 3-up "what we look for" traits rendered beneath the CV panel
 * when `CAREER_LISTINGS` is empty. Each card is a graphite-on-paper
 * editorial beat — eyebrow + numeric tag + one-line description.
 *
 * Editorial direction: these are not soft skills. They are the three
 * attributes that survive both the floor and the foundry — the shape
 * of people we hire for the long arc.
 */
export interface CareerTrait {
  readonly number: string;
  readonly tag: string;
  readonly body: string;
}

export const WHAT_WE_LOOK_FOR: ReadonlyArray<CareerTrait> = [
  {
    number: '01',
    tag: 'Curiosity',
    body:
      "If you've ever taken a screwdriver to something just to see how it works, we want to talk.",
  },
  {
    number: '02',
    tag: 'Care',
    body: "Steel doesn't forgive sloppy. Neither do we.",
  },
  {
    number: '03',
    tag: 'Continuity',
    body: 'Our oldest hands have been here 30+ years. We hire for the long arc.',
  },
] as const;
