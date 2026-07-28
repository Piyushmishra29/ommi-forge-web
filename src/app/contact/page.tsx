import type { Metadata } from 'next';
import ContactHero from '@/components/sections/contact/ContactHero';
import ContactForm from '@/components/sections/contact/ContactForm';
import ContactDetails from '@/components/sections/contact/ContactDetails';

export const metadata: Metadata = {
  title: 'Contact — Request a quote',
  description:
    'Reach Ommi Forge in Malur, Karnataka — quote requests, technical inquiries, careers. Two-business-day response from a real human.',
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <section className="bg-paper pb-32 md:pb-40">
        <div className="mx-auto grid max-w-page grid-cols-1 gap-16 px-6 md:grid-cols-12 md:gap-20 md:px-10">
          <div className="md:col-span-7">
            <ContactForm />
          </div>
          <div className="md:col-span-5">
            <ContactDetails />
          </div>
        </div>
      </section>
    </>
  );
}
