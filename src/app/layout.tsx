import type { Metadata } from 'next';
import { Manrope, Work_Sans, Roboto } from 'next/font/google';
import './globals.css';

import LenisProvider from '@/components/providers/LenisProvider';
import LegacyRedirects from '@/components/providers/LegacyRedirects';
import RouteResetEffects from '@/components/providers/RouteResetEffects';
import MagneticCursor from '@/components/motion/MagneticCursor';
import PageTransition, { PageWipe } from '@/components/motion/PageTransition';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ommiforge.com'),
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
        <LegacyRedirects />
        <LenisProvider>
          <RouteResetEffects />
          <MagneticCursor />
          <Header />
          <PageTransition>
            <main
              id="main"
              className="min-h-dvh"
              style={{ paddingTop: 'var(--header-h)' }}
            >
              {children}
            </main>
          </PageTransition>
          <Footer />
        </LenisProvider>
        <PageWipe />
      </body>
    </html>
  );
}
