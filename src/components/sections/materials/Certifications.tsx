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
 * and shared on request, so each card renders a `Request copy →` mailto
 * action with a pre-filled subject + body instead of a download link.
 * Data lives in `src/data/certifications.ts`.
 *
 * Sits on the dark ground, not on paper (§5.5) — these are not a spec
 * sheet, they are six links.
 *
 * THE HOVER FLIP, RE-MEASURED FOR DARK. v2 flipped paper → graphite on
 * hover/focus, which meant every foreground colour had to clear AA twice.
 * That constraint survives the inversion; the surfaces do not. The card
 * now flips slag → graphite (a recess, which is the right gesture on a
 * forge site) and gains a saffron edge, and both states were measured:
 *
 *                       on slag (rest)   on graphite (hover/focus)
 *   title      paper       13.25:1              15.46:1
 *   issuer     swarf        5.31:1               6.19:1
 *   validity   swarf        5.31:1               6.19:1
 *   accent     saffron      6.49:1               7.57:1
 *   edge       ash          3.22:1 / 3.76:1  →  saffron 7.57:1
 *
 * Note what is NOT here: the v2 card used `ember` for its rest-state
 * accent and swapped to `saffron` on the dark hover state. On a
 * permanently dark card ember is 2.98:1 and fails outright, so the
 * swap collapses to saffron in both states — one token, no branch.
 * The rest-state edge is `ash`, not `cinder`, because these cards are
 * focusable: their edge carries meaning, and cinder is only 2.60:1
 * against a slag fill even though it is 3.03:1 against graphite.
 */
export default function Certifications() {
  return (
    <section id="certif" className="section-y-lg border-t border-cinder">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>Certifications</Eyebrow>
        <h2 className="type-display-l mt-8 max-w-3xl text-balance">
          Audited. Accredited. On the wall.
        </h2>
        <p className="type-lede mt-8 max-w-[68ch] text-pretty">
          Certifications are kept current and shared on request. Email{' '}
          <a
            href="mailto:marketing@ommiforge.com"
            data-magnetic
            // Underlined at rest, not only on hover: saffron against swarf
            // body copy is a hue shift, and hue alone cannot carry "this is
            // a link" (WCAG 1.4.1).
            className="text-saffron underline decoration-1 underline-offset-4 transition-colors hover:text-mesh"
          >
            marketing@ommiforge.com
          </a>{' '}
          and we’ll send the latest PDF within one business day.
        </p>

        <ul className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((c) => (
            <li key={c.title}>
              <a
                href={buildMailto(c)}
                data-magnetic
                // The link's own text is "ISO 9001:2015 … Request copy",
                // which doesn't say what activating it does. Spell the
                // action out for anyone tabbing a list of six of these.
                aria-label={`Request a copy of ${c.title} by email`}
                className="group flex h-full flex-col justify-between gap-8 border border-ash bg-slag p-8 transition-colors hover:border-saffron hover:bg-graphite focus-visible:border-saffron focus-visible:bg-graphite"
              >
                <div>
                  <p className="type-eyebrow text-saffron">
                    Available on request
                  </p>
                  <h3 className="type-display-m mt-4">{c.title}</h3>
                  <p className="type-small mt-3">{c.issuer}</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="type-meta">{c.validity}</span>
                  <span className="type-eyebrow flex items-center gap-2 text-saffron transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1">
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
