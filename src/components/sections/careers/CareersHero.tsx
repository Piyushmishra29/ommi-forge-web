import Eyebrow from '@/components/ui/Eyebrow';

export default function CareersHero() {
  return (
    <section className="bg-paper pt-32 pb-12 md:pt-40 md:pb-16">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow>
          <span className="text-mesh">Join us</span>
        </Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] text-graphite md:text-6xl">
          Build with steel.
          <br />
          Talk to us.
        </h1>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Forty-eight harvests in, Ommi Forge still hires for grit, taste and
          metallurgical curiosity. We don&apos;t keep a posted roles board —
          if the work below sounds like yours, write anyway.
        </p>
      </div>
    </section>
  );
}
