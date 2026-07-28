import Link from 'next/link';
import Image from 'next/image';
import { NAV } from '@/data/nav';

const FOOTER_LINKS = NAV.filter((n) => n.href !== '/');

/**
 * Footer
 *
 * Three columns on desktop:
 *  1. Logo + tagline
 *  2. Quick links (nav minus Home)
 *  3. Contact block (address, phone, email, hours)
 *
 * v3: the ground is graphite now, so a graphite footer is not a slab —
 * it is the page continuing. The footer sits on `slag` behind a `cinder`
 * top hairline, which is exactly what slag exists for (a decorative
 * 1.17:1 lift with a real boundary drawn on top of it). Cinder is the
 * right token for that rule because it is drawn against the graphite
 * page above (3.03:1); the hairlines *inside* the footer, which have
 * slag on both sides, use ash (3.22:1) — cinder falls to 2.60:1 there.
 *
 * Body text is `swarf` (5.31:1 on slag) rather than the v2 `paper/80`
 * and `paper/60` alpha steps: those were never measured against slag,
 * and paper/60 lands under AA on it.
 */
export default function Footer() {
  return (
    <footer className="border-t border-cinder bg-slag text-paper">
      <div className="mx-auto max-w-page px-6 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand block */}
          <div>
            <Link
              href="/"
              aria-label="Ommi Forge — home"
              className="inline-flex items-center"
            >
              <Image
                src="/assets/brand/logo-cropped-679x140.png"
                alt="Ommi Forge"
                width={679}
                height={140}
                className="h-11 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-xs font-display text-base font-light leading-snug text-swarf">
              Forged in India since 1975 · For all your forging needs.
            </p>
          </div>

          {/* Quick links.
              Column titles are real <h2>s, not styled <p>s — screen-reader
              users navigate a footer by its headings, and `heading-hierarchy`
              wants the structure to exist in the markup rather than only in
              the type treatment. Visual styling is unchanged.
              Links get `inline-block py-1` so each row is 28px tall
              instead of the 20px a bare text-sm line gives — clearing the
              24×24 minimum target size, with an 8px gap between targets. */}
          <nav aria-labelledby="footer-explore">
            <h2
              id="footer-explore"
              className="type-eyebrow text-saffron"
            >
              Explore
            </h2>
            <ul className="mt-5 flex flex-col gap-2">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block py-1 font-body text-sm text-swarf transition-colors hover:text-saffron"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact/"
                  className="inline-block py-1 font-body text-sm text-swarf transition-colors hover:text-saffron"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="type-eyebrow text-saffron">
              Get in touch
            </h2>
            <address className="mt-6 not-italic font-body text-sm leading-relaxed text-swarf">
              Plot No 300, 301 &amp; 302, 3rd Phase,
              <br />
              Industrial Area, Malur,
              <br />
              Karnataka 563160
            </address>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm text-swarf">
              <li>
                <a
                  href="tel:+918951953866"
                  className="inline-block py-1 transition-colors hover:text-saffron"
                >
                  +91 8951953866
                </a>
              </li>
              <li>
                <a
                  href="mailto:marketing@ommiforge.com"
                  className="inline-block py-1 transition-colors hover:text-saffron"
                >
                  marketing@ommiforge.com
                </a>
              </li>
              <li className="pt-1 text-swarf">Sun – Fri · 9AM – 5PM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hairline + colophon */}
      <div className="border-t border-ash">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-6 py-6 text-xs text-swarf md:flex-row md:items-center md:justify-between md:px-10">
          <p>© 2026 Ommi Forge Pvt. Ltd. · Forged with intent.</p>
          <p className="font-eyebrow uppercase tracking-[0.18em]">
            Bangalore · Malur · India
          </p>
        </div>
      </div>
    </footer>
  );
}
