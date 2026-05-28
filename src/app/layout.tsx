import type { Metadata, Viewport } from 'next';
import { Manrope, Work_Sans, Roboto } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import LenisProvider from '@/components/providers/LenisProvider';
import LegacyRedirects from '@/components/providers/LegacyRedirects';
import RouteResetEffects from '@/components/providers/RouteResetEffects';
import MagneticCursor from '@/components/motion/MagneticCursor';
import PageTransition from '@/components/motion/PageTransition';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

/* ------------------------------------------------------------
 * Optional Plausible analytics. Both env vars are inlined at
 * build time (NEXT_PUBLIC_*) — leaving them unset keeps the
 * site fully analytics-free, which is the default.
 *
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN  → site identifier registered
 *                                   in the Plausible dashboard
 *                                   (e.g. "www.ommiforge.com").
 *   NEXT_PUBLIC_PLAUSIBLE_SRC     → optional override for
 *                                   self-hosted Plausible
 *                                   (full script URL). Defaults
 *                                   to the cloud-hosted script
 *                                   when only DOMAIN is set.
 * ------------------------------------------------------------ */
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js';

/* ------------------------------------------------------------
 * Self-hosted Google fonts via next/font.
 * Each font sets a CSS variable consumed by Tailwind v4's @theme
 * block in globals.css.
 * ------------------------------------------------------------ */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-eyebrow',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
  display: 'swap',
});

/* ------------------------------------------------------------
 * Viewport (Next 16 wants this as its own export, separate from
 * `metadata`). `viewportFit: 'cover'` emits `viewport-fit=cover`
 * in the <meta name="viewport"> tag so `env(safe-area-inset-*)`
 * resolves to real values on notch iPhones — without it the header
 * sits under the notch and the menu sheet collides with the home
 * indicator.
 * ------------------------------------------------------------ */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  // Production defaults to ommiforge.com. For a temp preview (e.g. a
  // Tailscale Funnel link) set NEXT_PUBLIC_SITE_URL at build time so the
  // OG/Twitter card image + canonicals resolve to the preview host and
  // the link-preview thumbnail renders when the URL is shared.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ommiforge.com',
  ),
  title: {
    default: 'Ommi Forge · Forged in India since 1975',
    template: '%s · Ommi Forge',
  },
  description:
    'Indian steel-forging company since 1975. Closed die, open die, ring rolling and upset forging for the world. Plant in Malur, Karnataka.',
  applicationName: 'Ommi Forge',
  openGraph: {
    title: 'Ommi Forge · Forged in India since 1975',
    description:
      'For all your forging needs. Closed/open die, ring rolling, upset forging — built in Malur, Karnataka.',
    siteName: 'Ommi Forge',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ommi Forge — Forged in India since 1975',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ommi Forge · Forged in India since 1975',
    description:
      'For all your forging needs. Closed/open die, ring rolling, upset forging — built in Malur, Karnataka.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ommi Forge — Forged in India since 1975',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      className={`${manrope.variable} ${workSans.variable} ${roboto.variable} antialiased`}
    >
      <body className="min-h-dvh bg-paper text-graphite">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <LegacyRedirects />
        <LenisProvider>
          <RouteResetEffects />
          <MagneticCursor />
          <Header />
          <PageTransition>
            <main
              id="main"
              tabIndex={-1}
              className="min-h-dvh"
              style={{ paddingTop: 'var(--header-h)' }}
            >
              {children}
            </main>
          </PageTransition>
          <Footer />
        </LenisProvider>
        {PLAUSIBLE_DOMAIN ? (
          <Script
            src={PLAUSIBLE_SRC}
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
            defer
          />
        ) : null}
      </body>
    </html>
  );
}
