import Eyebrow from '@/components/ui/Eyebrow';

export default function ContactHero() {
  return (
    <section className="bg-paper pt-32 pb-12 md:pt-40 md:pb-16">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow>
          <span className="text-mesh">Contact</span>
        </Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] text-graphite md:text-6xl">
          Quote to part in two weeks.
        </h1>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Send us a message and we&apos;ll get back to you within 2 business
          days!
        </p>
      </div>
    </section>
  );
}
