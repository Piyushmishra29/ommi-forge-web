/**
 * ContactDetails — address, phone, email, hours, and the embedded
 * Google Maps iframe pointing at the Malur plant.
 */
interface ContactDetail {
  label: string;
  lines: ReadonlyArray<string>;
  href?: string;
}

const DETAILS: ReadonlyArray<ContactDetail> = [
  {
    label: 'Plant',
    lines: [
      'Plot No 300, 301 & 302',
      '3rd Phase, Industrial Area',
      'Malur, Karnataka 563160',
    ],
  },
  {
    label: 'Phone',
    lines: ['+91 8951953866'],
    href: 'tel:+918951953866',
  },
  {
    label: 'Email',
    lines: ['marketing@ommiforge.com'],
    href: 'mailto:marketing@ommiforge.com',
  },
  {
    label: 'Hours',
    lines: ['Sunday – Friday', '9 AM – 5 PM IST'],
  },
];

export default function ContactDetails() {
  return (
    <div className="space-y-12">
      <h2 className="font-display text-2xl md:text-3xl text-graphite mb-6">
        Find us in Malur.
      </h2>
      <dl className="space-y-8">
        {DETAILS.map((d) => (
          <div key={d.label}>
            <dt className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
              {d.label}
            </dt>
            <dd className="mt-3 font-display text-xl font-light leading-snug text-graphite md:text-2xl">
              {d.href ? (
                <a
                  href={d.href}
                  data-magnetic
                  className="transition-colors hover:text-mesh"
                >
                  {d.lines[0]}
                </a>
              ) : (
                d.lines.map((l, i) => (
                  <span key={l} className="block">
                    {l}
                    {i < d.lines.length - 1 && <br aria-hidden />}
                  </span>
                ))
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative h-[280px] w-full overflow-hidden border border-graphite/10 md:h-[360px]">
        <iframe
          title="Ommi Forge plant location, Malur, Karnataka"
          src="https://www.google.com/maps?ll=12.993316,77.926169&z=14&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
