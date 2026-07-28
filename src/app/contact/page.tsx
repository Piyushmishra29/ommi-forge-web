import type { Metadata } from 'next';
import PaperCard from '@/components/ui/PaperCard';
import ContactHero from '@/components/sections/contact/ContactHero';
import ContactForm from '@/components/sections/contact/ContactForm';
import ContactDetails from '@/components/sections/contact/ContactDetails';

export const metadata: Metadata = {
  title: 'Contact — Request a quote',
  description:
    'Reach Ommi Forge in Malur, Karnataka — quote requests, technical inquiries, careers. Two-business-day response from a real human.',
};

/**
 * `/contact` — no part, no 3D (§5.8). The form and the location block are
 * paper cards, because a form is a document; the map sits on the dark
 * ground with a cinder hairline (see ContactDetails).
 *
 * Stacked full-width cards rather than v2's 7/5 side-by-side split: a
 * paper card has a 480px floor, and a 5-of-12 column inside `max-w-page`
 * is 455px — the location card would have been a chip, which is the one
 * thing §2.3 rules out. Each card runs the container width and does its
 * own internal columns instead.
 */
export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <section className="section-y">
        <div className="mx-auto flex max-w-page flex-col gap-16 page-x md:gap-24">
          <PaperCard topRule className="p-8 md:p-12 lg:p-16">
            <ContactForm />
          </PaperCard>
          <ContactDetails />
        </div>
      </section>
    </>
  );
}
