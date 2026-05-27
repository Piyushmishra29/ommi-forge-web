import type { Metadata } from 'next';
import SolutionsHero from '@/components/sections/solutions/SolutionsHero';
import MethodsPinned from '@/components/sections/solutions/MethodsPinned';

export const metadata: Metadata = {
  title: 'Solutions — Closed die, open die, ring rolling, upset',
  description:
    'Eight power hammers for closed-die forgings to 50 kg, an open-die line to 500 kg, a ring-rolling mill to 1500 mm, and an upset-forging line for shafts to 6 inch diameter.',
};

export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />
      <MethodsPinned />
    </>
  );
}
