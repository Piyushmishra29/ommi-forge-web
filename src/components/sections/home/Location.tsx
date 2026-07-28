import Eyebrow from '@/components/ui/Eyebrow';
import RevealHeading from '@/components/motion/RevealHeading';
import { LOCATION } from '@/data/home';

/**
 * Location
 *
 * Two-column section:
 *  - Left: address, phone, email, hours.
 *  - Right: embedded Google Maps iframe centred on the Malur plant.
 *
 * The iframe is wrapped in a paper-toned bordered frame with a soft
 * lift shadow; below it, a small "Open in Maps" link sends the user
 * to a real-world map deep link.
 */
export default function Location() {
  return (
    <section className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Eyebrow>FIND US</Eyebrow>
        <RevealHeading
          as="h2"
          className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.1] text-graphite md:text-6xl"
        >
          Malur, Karnataka — three acres of forge floor.
        </RevealHeading>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Address block */}
          <div className="flex flex-col gap-8">
            <div>
              <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-ember">
                Plant
              </p>
              <address className="mt-3 not-italic font-display text-2xl font-light leading-snug text-graphite md:text-3xl">
                {LOCATION.street}
                <br />
                {LOCATION.area}
                <br />
                {LOCATION.region}
              </address>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-steel">
                  Phone
                </p>
                {/* min-h-11 (44px): a bare inline link at text-lg is only
                    ~27px tall, under the 44×44 minimum — and these two are
                    the section's primary "call / email us" actions on a
                    phone. inline-flex so the box grows, not the text. */}
                <a
                  href={LOCATION.phoneHref}
                  data-magnetic
                  // 18px non-bold is NOT WCAG "large text" (that needs 24px,
                  // or 18.66px bold), so the hover colour has to clear the
                  // full 4.5:1 — mesh is 3.05:1 on paper, ember 5.19:1.
                  className="mt-1 inline-flex min-h-11 items-center font-body text-lg text-graphite transition-colors hover:text-ember"
                >
                  {LOCATION.phone}
                </a>
              </div>
              <div>
                <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-steel">
                  Email
                </p>
                <a
                  href={LOCATION.emailHref}
                  data-magnetic
                  className="mt-1 inline-flex min-h-11 items-center break-all font-body text-lg text-graphite transition-colors hover:text-ember"
                >
                  {LOCATION.email}
                </a>
              </div>
              <div>
                <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-steel">
                  Hours
                </p>
                <p className="mt-2 font-body text-lg text-graphite">
                  {LOCATION.hours}
                </p>
              </div>
              <div>
                <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-steel">
                  GPS
                </p>
                <p className="mt-2 font-body text-lg text-graphite tabular-nums">
                  {LOCATION.lat.toFixed(4)}, {LOCATION.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-graphite/10 bg-render-bg shadow-[0_24px_60px_-32px_rgba(31,33,36,0.35)]">
              <iframe
                title="Ommi Forge plant location — Malur, Karnataka"
                src={LOCATION.embed}
                width="100%"
                height="480"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[420px] w-full md:h-[480px]"
              />
            </div>
            <a
              href={LOCATION.openInMaps}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              // min-h-11: 12px uppercase text alone gives an ~18px tall
              // hit area — well under the 44×44 minimum.
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:text-ember"
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
