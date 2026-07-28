import type { Metadata } from 'next';
import { Scene3DProvider } from '@/components/three3';
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
 * /about — heritage as a material state change (§5.2).
 *
 *   AboutHero      full-viewport opener, per-char h1 (one of two routes §4.4
 *                  allows it on), ±8% parallax backdrop
 *   HeritageEssay  the page's only 3D: four chapters scrolling past a sticky
 *                  trunnion whose surface lerps as-forged → machined
 *   PhotoBreak     shop floor, real photograph
 *   Values3Up      the three real VALUES on the dark ground
 *   PhotoBreak     forging bay, before the closing block
 *   Sustainability stewardship copy + the plant CTA
 *
 * `Scene3DProvider` is mounted once, here — one WebGL context for the route,
 * and it does not create the canvas at all until the heritage slot reports
 * that it is approaching the viewport. Under `prefers-reduced-motion` the
 * slot still mounts (the scrub is the visitor's own scrolling, not an
 * autonomous animation, so it stays correct); under no-WebGL the slot shows
 * the part's datasheet instead and the page loses nothing but the render.
 *
 * v2 ran three `PhotoBreak`s. Two survive: with a photographic hero, a
 * canvas and a full-bleed photo inside `Sustainability` already on the page,
 * the third was punctuation on punctuation — and it cost ~1 MB.
 */
export default function AboutPage() {
  return (
    <Scene3DProvider>
      <AboutHero />
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
    </Scene3DProvider>
  );
}
