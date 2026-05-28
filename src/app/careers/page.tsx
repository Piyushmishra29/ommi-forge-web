import type { Metadata } from 'next';
import CareersHero from '@/components/sections/careers/CareersHero';
import CareersListings from '@/components/sections/careers/CareersListings';

export const metadata: Metadata = {
  title: 'Careers — Build with steel',
  description:
    'Ommi Forge hires people we meet — through site visits, supplier relationships, and referrals. No posted-roles board; send us your CV at marketing@ommiforge.com.',
};

export default function CareersPage() {
  return (
    <>
      <CareersHero />
      <CareersListings />
    </>
  );
}
