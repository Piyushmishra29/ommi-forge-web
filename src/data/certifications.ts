/**
 * Certification PDFs surfaced on `/materials#certif`.
 *
 * Hard-coded so the static export pipeline doesn't depend on a
 * populated public folder at build time. If a file is missing on disk
 * the link 404s gracefully — the card still renders and the page is
 * fine. Replace the `href` paths once the real PDFs land in
 * `public/assets/pdf/`.
 */

export interface Certification {
  title: string;
  issuer: string;
  validity: string;
  href: string;
}

export const CERTIFICATIONS: ReadonlyArray<Certification> = [
  {
    title: 'ISO 9001:2015',
    issuer: 'Quality Management System · TÜV SÜD',
    validity: 'Valid through 2027',
    href: '/assets/pdf/iso-9001-2015.pdf',
  },
  {
    title: 'IATF 16949:2016',
    issuer: 'Automotive Quality · TÜV SÜD',
    validity: 'Valid through 2026',
    href: '/assets/pdf/iatf-16949.pdf',
  },
  {
    title: 'ISO 14001:2015',
    issuer: 'Environmental Management · TÜV SÜD',
    validity: 'Valid through 2027',
    href: '/assets/pdf/iso-14001.pdf',
  },
  {
    title: 'ISO 45001:2018',
    issuer: 'Occupational Health & Safety · TÜV SÜD',
    validity: 'Valid through 2027',
    href: '/assets/pdf/iso-45001.pdf',
  },
  {
    title: 'PED 2014/68/EU',
    issuer: 'Pressure Equipment Directive · Lloyd’s Register',
    validity: 'Valid through 2028',
    href: '/assets/pdf/ped-2014-68-eu.pdf',
  },
  {
    title: 'NABL Accreditation',
    issuer: 'In-house Metallurgical Laboratory · NABL',
    validity: 'Valid through 2026',
    href: '/assets/pdf/nabl-accreditation.pdf',
  },
];
