import type { Metadata } from 'next';
import MaterialsHero from '@/components/sections/materials/MaterialsHero';
import MaterialsTable from '@/components/sections/materials/MaterialsTable';
import Certifications from '@/components/sections/materials/Certifications';

export const metadata: Metadata = {
  title: 'Materials — Carbon, alloy, stainless, custom',
  description:
    'Four families of steel forged at Ommi — workhorse carbon grades, tunable alloys, stainless for corrosive service, and bespoke chemistries against customer prints.',
};

/**
 * `/materials` — the cold bench. Deliberately, emphatically canvas-free
 * (§5.5): this is the metallurgist's lab, and the absence of 3D here is
 * what makes `/solutions` mean something. The four grade tables are the
 * biggest concentration of paper card on the site.
 */
export default function MaterialsPage() {
  return (
    <>
      <MaterialsHero />
      <MaterialsTable />
      <Certifications />
    </>
  );
}
