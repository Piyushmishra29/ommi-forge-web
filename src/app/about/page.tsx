import type { Metadata } from 'next';
import AboutHero from '@/components/sections/about/AboutHero';
import HeritageEssay from '@/components/sections/about/HeritageEssay';
import Values3Up from '@/components/sections/about/Values3Up';
import Sustainability from '@/components/sections/about/Sustainability';

export const metadata: Metadata = {
  title: 'About — A forging house since 1975',
  description:
    'Ommi Forge was founded in 1975 by BG Ashwath. Five decades on, a second-generation team runs eight power hammers and an open-die line out of Malur, Karnataka.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <HeritageEssay />
      <Values3Up />
      <Sustainability />
    </>
  );
}
