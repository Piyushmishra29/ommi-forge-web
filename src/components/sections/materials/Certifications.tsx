import Eyebrow from '@/components/ui/Eyebrow';
import { CERTIFICATIONS, type Certification } from '@/data/certifications';

const RequestIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

/**
 * Build a `mailto:` URL pre-filled with subject + body for one cert.
 * Each character is URL-encoded so spaces, em-dashes and slashes
 * survive intact in the visitor's mail client.
 */
function buildMailto({ title }: Certification): string {
  const subject = encodeURIComponent(`Certification copy request — ${title}`);
  const body = encodeURIComponent(
    `Please send the latest copy of ${title}.`,
  );
  return `mailto:marketing@ommiforge.com?subject=${subject}&body=${body}`;
}

/**
 * Certifications — anchored at #certif so legacy `/materials/#certif`
 * inbound links keep working. Certificates are kept current internally
 * and shared on request, so each card now renders a `Request copy →`
 * mailto action with a pre-filled subject + body instead of a download
 * link. Data lives in `src/data/certifications.ts`.
 */
export default function Certifications() {
  return (
    <section id="certif" className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Eyebrow>
          <span className="text-ember">Certifications</span>
        </Eyebrow>
        <h2 className="mt-6 max-w-3xl font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
          Audited. Accredited. On the wall.
        </h2>
        <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Certifications are kept current and shared on request. Email{' '}
          <a
            href="mailto:marketing@ommiforge.com"
            data-magnetic
            className="text-ember underline-offset-4 hover:underline"
          >
            marketing@ommiforge.com
          </a>{' '}
          and we’ll send the latest PDF within one business day.
        </p>

        <ul className="mt-16 grid grid-cols-1 gap-px bg-graphite/10 md:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((c) => (
            <li key={c.title} className="bg-paper">
              <a
                href={buildMailto(c)}
                data-magnetic
                // The link's own text is "ISO 9001:2015 … Request copy",
                // which doesn't say what activating it does. Spell the
                // action out for anyone tabbing a list of six of these.
                aria-label={`Request a copy of ${c.title} by email`}
                className="group relative flex h-full flex-col justify-between gap-8 bg-paper p-8 transition-colors hover:bg-graphite hover:text-paper focus-visible:bg-graphite focus-visible:text-paper"
              >
                <div>
                  {/* ember is the small-text accent on paper (≈5.3:1) but
                      collapses to ≈2:1 once the card flips to graphite on
                      hover/focus — saffron is the dark-surface accent. */}
                  <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-ember transition-colors group-hover:text-saffron group-focus-visible:text-saffron">
                    Available on request
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-light leading-tight md:text-3xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed opacity-80">
                    {c.issuer}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em]">
                  {/* opacity-70 lands at ≈4.3:1 for 10px text on paper —
                      80 clears AA on both the paper and graphite states. */}
                  <span className="opacity-80">{c.validity}</span>
                  <span className="flex items-center gap-2 text-ember transition-all group-hover:translate-x-1 group-hover:text-saffron group-focus-visible:translate-x-1 group-focus-visible:text-saffron">
                    Request copy <RequestIcon />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
