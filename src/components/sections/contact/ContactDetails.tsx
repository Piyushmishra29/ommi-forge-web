import PaperCard from '@/components/ui/PaperCard';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * ContactDetails — the LOCATION block (§5.8).
 *
 * Two pieces, on two grounds, deliberately:
 *
 *  1. A paper card holding the address, email, phone and hours as a
 *     labelled spec list with `ash` hairlines — the same treatment the
 *     `/materials` grade tables get, because it is the same kind of
 *     information: cold, checkable, printable.
 *  2. The Google Maps embed BELOW the card, on the dark ground behind a
 *     `cinder` hairline. A live third-party iframe is not cold technical
 *     information and it does not belong inside a datasheet; it also
 *     renders its own light UI, so nesting it in a snow card produced two
 *     different whites meeting at a border.
 *
 * v2 wrapped the map in `rounded-2xl` + `shadow-[0_24px_60px_...]` +
 * a nested inset border. All three are out: §2.3 caps corners at 2px and
 * bans drop shadows outright.
 *
 * Colour: every accent inside the card is `ember`, resolved through
 * `--color-ink-accent` rather than hard-coded, so it is impossible for a
 * later edit to leave a saffron accent (2.13:1) on the sheet.
 */
interface ContactRow {
  label: string;
  /** Rendered as a link when `href` is present. */
  href?: string;
  lines: ReadonlyArray<string>;
  /** Address semantics for the plant row. */
  address?: boolean;
}

const ROWS: ReadonlyArray<ContactRow> = [
  {
    label: 'Plant',
    address: true,
    lines: [
      'Plot No 300, 301 & 302',
      '3rd Phase, Industrial Area',
      'Malur, Karnataka 563160',
    ],
  },
  {
    label: 'Email',
    href: 'mailto:marketing@ommiforge.com',
    lines: ['marketing@ommiforge.com'],
  },
  {
    label: 'Phone',
    href: 'tel:+918951953866',
    lines: ['+91 8951953866'],
  },
  {
    label: 'Hours',
    lines: ['Sunday – Friday', '9 AM – 5 PM IST'],
  },
];

const MAPS_EMBED_URL =
  'https://www.google.com/maps?ll=12.993316,77.926169&z=14&output=embed';
const MAPS_OPEN_URL =
  'https://www.google.com/maps/search/?api=1&query=12.993316,77.926169';

export default function ContactDetails() {
  return (
    <>
      <PaperCard
        as="section"
        topRule
        aria-labelledby="reach-us"
        className="p-8 md:p-12 lg:p-16"
      >
        <Eyebrow>Reach us</Eyebrow>
        <h2 id="reach-us" className="type-display-l mt-6">
          Find us in Malur.
        </h2>

        <dl className="mt-10 md:mt-12">
          {ROWS.map((row) => (
            <div
              key={row.label}
              // Hairlines on the row wrapper, never on a `divide-y` parent:
              // preflight resets children to `border: 0 solid currentColor`,
              // so a colour set on the parent never reaches them and the
              // rules render at full-strength ink instead of an ash hairline.
              className="grid grid-cols-1 gap-2 border-b border-rule py-6 first:border-t first:pt-6 last:border-b md:grid-cols-12 md:gap-8"
            >
              <dt className="type-eyebrow md:col-span-3 md:pt-2">{row.label}</dt>
              <dd className="md:col-span-9">
                {row.href ? (
                  <a
                    href={row.href}
                    data-magnetic
                    className="type-display-s inline-flex min-h-11 items-center break-words font-display text-ink underline decoration-ember decoration-1 underline-offset-4 transition-colors hover:text-ink-accent"
                  >
                    {row.lines[0]}
                  </a>
                ) : row.address ? (
                  <address className="type-body not-italic">
                    {row.lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </address>
                ) : (
                  <p className="type-body">
                    {row.lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </PaperCard>

      {/* Map — on the dark ground, cinder hairline, square corners. */}
      <div className="mt-8">
        <div className="relative h-[280px] w-full overflow-hidden border border-cinder md:h-[420px]">
          <iframe
            title="Ommi Forge plant location, Malur, Karnataka"
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <a
          href={MAPS_OPEN_URL}
          target="_blank"
          rel="noreferrer"
          data-magnetic
          className="type-eyebrow group mt-6 inline-flex min-h-11 items-center gap-3 text-saffron transition-colors hover:text-mesh"
        >
          <span
            aria-hidden
            className="inline-block h-px w-10 bg-current transition-all duration-500 group-hover:w-16"
          />
          Open in Google Maps
          <span className="sr-only"> (opens in a new tab)</span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>
    </>
  );
}
