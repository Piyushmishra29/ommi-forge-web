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
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow>
          <span className="text-mesh">Certifications</span>
        </Eyebrow>
        <h2 className="mt-6 max-w-3xl font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
          Audited. Accredited. On the wall.
        </h2>
        <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Certifications are kept current and shared on request. Email{' '}
          <a
            href="mailto:marketing@ommiforge.com"
            data-magnetic
            className="text-mesh underline-offset-4 hover:underline"
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
                className="group relative flex h-full flex-col justify-between gap-8 bg-paper p-8 transition-colors hover:bg-graphite hover:text-paper"
              >
                <div>
                  <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] text-mesh">
                    Available on request
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-light leading-tight md:text-3xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed opacity-80">
                    {c.issuer}
                  </p>
                </div>

                <div className="flex items-center justify-between font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em]">
                  <span className="opacity-70">{c.validity}</span>
                  <span className="flex items-center gap-2 text-mesh transition-transform group-hover:translate-x-1">
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
