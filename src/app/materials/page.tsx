import type { Metadata } from 'next';
import MaterialsHero from '@/components/sections/materials/MaterialsHero';
import MaterialsTable from '@/components/sections/materials/MaterialsTable';
import Certifications from '@/components/sections/materials/Certifications';

export const metadata: Metadata = {
  title: 'Materials — Carbon, alloy, stainless, custom',
  description:
    'Four families of steel forged at Ommi — workhorse carbon grades, tunable alloys, stainless for corrosive service, and bespoke chemistries against customer prints.',
};

export default function MaterialsPage() {
  return (
    <>
      <MaterialsHero />
      <MaterialsTable />
      <Certifications />
    </>
  );
}
