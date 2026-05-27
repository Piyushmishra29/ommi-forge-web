/**
 * Certifications surfaced on `/materials#certif`.
 *
 * The live PDFs are not hosted publicly — we keep the certificates
 * up to date internally and email the latest copy on request. The
 * card UI mirrors that: each card renders a `Request copy →` mailto
 * action instead of a download link. See
 * `src/components/sections/materials/Certifications.tsx`.
 */

export interface Certification {
  title: string;
  issuer: string;
  validity: string;
}

export const CERTIFICATIONS: ReadonlyArray<Certification> = [
  {
    title: 'ISO 9001:2015',
    issuer: 'Quality Management System · TÜV SÜD',
    validity: 'Valid through 2027',
  },
  {
    title: 'IATF 16949:2016',
    issuer: 'Automotive Quality · TÜV SÜD',
    validity: 'Valid through 2026',
  },
  {
    title: 'ISO 14001:2015',
    issuer: 'Environmental Management · TÜV SÜD',
    validity: 'Valid through 2027',
  },
  {
    title: 'ISO 45001:2018',
    issuer: 'Occupational Health & Safety · TÜV SÜD',
    validity: 'Valid through 2027',
  },
  {
    title: 'PED 2014/68/EU',
    issuer: 'Pressure Equipment Directive · Lloyd’s Register',
    validity: 'Valid through 2028',
  },
  {
    title: 'NABL Accreditation',
    issuer: 'In-house Metallurgical Laboratory · NABL',
    validity: 'Valid through 2026',
  },
];
