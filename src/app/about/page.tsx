import type { Metadata } from 'next';
import AboutHero from '@/components/sections/about/AboutHero';
import HeritageEssay from '@/components/sections/about/HeritageEssay';
import Values3Up from '@/components/sections/about/Values3Up';
import Sustainability from '@/components/sections/about/Sustainability';
import PhotoBreak from '@/components/sections/about/PhotoBreak';

export const metadata: Metadata = {
  title: 'About — A forging house since 1975',
  description:
    'Ommi Forge was founded in 1975 by BG Ashwath. Five decades on, a second-generation team runs eight power hammers and an open-die line out of Malur, Karnataka.',
};

/**
 * /about
 *
 * Editorial rhythm:
 *   AboutHero            — full-viewport opener with parallax bg
 *   PhotoBreak (DSC09309) — plant interior, mid-shot
 *   HeritageEssay        — pinned 6-chapter scroll (1975 → Today)
 *   PhotoBreak (DSC09326) — close-up, anchoring the values block
 *   Values3Up            — horizontal-scroll pinned triptych
 *   PhotoBreak (DSC09350) — wide-shot before sustainability
 *   Sustainability       — stewardship copy + plant CTA
 */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <PhotoBreak
        src="/assets/images/DSC09309.jpg"
        alt="Inside the Malur shop floor — billets travelling toward the hammers."
        caption="Shop floor · Malur"
      />
      <HeritageEssay />
      <PhotoBreak
        src="/assets/images/DSC09326.jpg"
        alt="A power hammer mid-stroke, scale flying from the billet."
        caption="Strike 04 of 11"
        tone="short"
      />
      <Values3Up />
      <PhotoBreak
        src="/assets/images/DSC09350.jpg"
        alt="Wide view of the forging bay — hammers in a row under daylight."
        caption="Bay 02 · Closed-die line"
      />
      <Sustainability />
    </>
  );
}
