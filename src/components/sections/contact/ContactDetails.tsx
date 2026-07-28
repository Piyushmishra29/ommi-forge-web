/**
 * ContactDetails — address, phone, email, hours, and the embedded
 * Google Maps iframe pointing at the Malur plant.
 *
 * Editorial polish:
 *  - A `Reach us` eyebrow leads the column.
 *  - Email + phone render at display-text scale (clamp 24-32px) so the
 *    page reads like a brand panel, not a corporate contact page.
 *  - The map iframe gets a paper border + rounded corners + a soft
 *    shadow so it doesn't look like a default Google embed.
 *  - A small "Open in Google Maps →" magnetic link sits beneath the
 *    map for visitors who'd rather take the route into a real app.
 *  - Hours hang off a saffron-rule prefix and stay small + quiet.
 *
 * Colour note: every accent here is `ember`, not `mesh`. All of it is
 * small text on `paper`, where mesh only reaches ≈3:1 — ember is the
 * token that clears AA on a light surface.
 */
interface ContactLink {
  label: string;
  display: string;
  href: string;
}

interface ContactBlock {
  label: string;
  lines: ReadonlyArray<string>;
}

const PLANT_BLOCK: ContactBlock = {
  label: 'Plant',
  lines: [
    'Plot No 300, 301 & 302',
    '3rd Phase, Industrial Area',
    'Malur, Karnataka 563160',
  ],
};

const HOURS_BLOCK: ContactBlock = {
  label: 'Hours',
  lines: ['Sunday – Friday', '9 AM – 5 PM IST'],
};

const PHONE_LINK: ContactLink = {
  label: 'Phone',
  display: '+91 8951953866',
  href: 'tel:+918951953866',
};

const EMAIL_LINK: ContactLink = {
  label: 'Email',
  display: 'marketing@ommiforge.com',
  href: 'mailto:marketing@ommiforge.com',
};

const MAPS_EMBED_URL =
  'https://www.google.com/maps?ll=12.993316,77.926169&z=14&output=embed';
const MAPS_OPEN_URL =
  'https://www.google.com/maps/search/?api=1&query=12.993316,77.926169';

export default function ContactDetails() {
  return (
    <div className="space-y-12">
      {/* Reach us — eyebrow above the address block. */}
      <div>
        <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-ember">
          <span
            aria-hidden
            className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
          />
          Reach us
        </p>
        <h2 className="mt-6 font-display text-3xl font-light leading-tight text-graphite md:text-4xl">
          Find us in Malur.
        </h2>
      </div>

      {/* Plant address */}
      <div>
        <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-steel">
          {PLANT_BLOCK.label}
        </p>
        <address className="mt-3 not-italic font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          {PLANT_BLOCK.lines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </address>
      </div>

      {/* Email + phone — promoted to display-text scale. */}
      <dl className="space-y-8">
        {[EMAIL_LINK, PHONE_LINK].map((link) => (
          <div key={link.label}>
            <dt className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-steel">
              {link.label}
            </dt>
            <dd
              className="mt-3 font-display font-light leading-snug text-graphite"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}
            >
              <a
                href={link.href}
                data-magnetic
                className="inline-flex min-h-11 items-center break-words transition-colors hover:text-ember"
              >
                {link.display}
              </a>
            </dd>
          </div>
        ))}
      </dl>

      {/* Map — paper border + rounded + soft shadow. */}
      <div className="space-y-4">
        <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-paper bg-paper shadow-[0_24px_60px_-30px_rgba(31,33,36,0.35)] md:h-[360px]">
          <div className="absolute inset-1 overflow-hidden rounded-xl border border-graphite/10">
            <iframe
              title="Ommi Forge plant location, Malur, Karnataka"
              src={MAPS_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
        <a
          href={MAPS_OPEN_URL}
          target="_blank"
          rel="noreferrer"
          data-magnetic
          className="group inline-flex min-h-11 items-center gap-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:text-ember"
        >
          <span
            aria-hidden
            className="inline-block h-px w-10 bg-saffron transition-all duration-500 group-hover:w-16 group-hover:bg-ember"
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

      {/* Hours — saffron-rule-prefixed quiet block. */}
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-2 inline-block h-px w-8 shrink-0 bg-saffron"
        />
        <div>
          <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-steel">
            {HOURS_BLOCK.label}
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-cinder md:text-base">
            {HOURS_BLOCK.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
