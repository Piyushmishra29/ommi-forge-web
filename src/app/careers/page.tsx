import type { Metadata } from 'next';
import CareersHero from '@/components/sections/careers/CareersHero';
import CareersListings from '@/components/sections/careers/CareersListings';

export const metadata: Metadata = {
  title: 'Careers — Open roles in Malur',
  description:
    'Current openings at Ommi Forge — metallurgical engineer, CNC machinist, quality assurance lead, and a process improvement internship.',
};

export default function CareersPage() {
  return (
    <>
      <CareersHero />
      <CareersListings />
    </>
  );
}
