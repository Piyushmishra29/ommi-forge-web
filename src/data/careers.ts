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
