import Eyebrow from '@/components/ui/Eyebrow';
import { LOCATION } from '@/data/home';

/**
 * The plant, as a datasheet.
 *
 * §2.3 names the location block as a paper-card case, and it is the right
 * one: an address, a phone number and a pair of coordinates are cold
 * technical information, printed. The map sits on the dark ground beside it
 * with a cinder hairline — square, unshadowed, because a rounded card with a
 * lift is exactly the "floating UI card" this system does not use.
 *
 * Everything here comes from `LOCATION`; nothing on this page is typed by
 * hand twice.
 */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="type-meta uppercase text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

export default function Location() {
  return (
    <section className="relative w-full section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>FIND US</Eyebrow>
        <h2 className="type-display-l mt-6 max-w-[18ch]">
          Malur, Karnataka — three acres of forge floor.
        </h2>

        {/* 7/5, never 6/6 (§2.5). */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="paper-card p-8 md:p-10" data-rule="saffron">
              <Field label="Plant">
                <address className="type-display-s mt-3 not-italic">
                  {LOCATION.street}
                  <br />
                  {LOCATION.area}
                  <br />
                  {LOCATION.region}
                </address>
              </Field>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <Field label="Phone">
                  {/* min-h-11 (44px): a bare inline link at this size is only
                      ~27px tall, and on a phone this is the section's primary
                      action. inline-flex so the box grows, not the text. */}
                  <a
                    href={LOCATION.phoneHref}
                    data-magnetic
                    className="type-body inline-flex min-h-11 items-center text-ink transition-colors hover:text-ink-accent"
                  >
                    {LOCATION.phone}
                  </a>
                </Field>
                <Field label="Email">
                  <a
                    href={LOCATION.emailHref}
                    data-magnetic
                    className="type-body inline-flex min-h-11 items-center break-all text-ink transition-colors hover:text-ink-accent"
                  >
                    {LOCATION.email}
                  </a>
                </Field>
                <Field label="Hours">
                  <p className="type-body mt-2 text-ink">{LOCATION.hours}</p>
                </Field>
                <Field label="GPS">
                  <p className="type-spec mt-2 text-ink">
                    {LOCATION.lat.toFixed(4)}, {LOCATION.lng.toFixed(4)}
                  </p>
                </Field>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-rule">
              <iframe
                title="Ommi Forge plant location — Malur, Karnataka"
                src={LOCATION.embed}
                width="100%"
                height="480"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[360px] w-full lg:h-[420px]"
              />
            </div>
            <a
              href={LOCATION.openInMaps}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-saffron transition-colors hover:text-mesh"
            >
              Open in Maps
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
