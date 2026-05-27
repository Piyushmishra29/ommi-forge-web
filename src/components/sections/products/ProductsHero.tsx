import Eyebrow from '@/components/ui/Eyebrow';

export default function ProductsHero() {
  return (
    <section className="bg-paper pt-32 pb-12 md:pt-40 md:pb-16">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow>
          <span className="text-mesh">Catalogue</span>
        </Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] text-graphite md:text-6xl">
          Forged products to meet your expectations.
        </h1>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Through the talents and can-do initiatives of our employees, the
          science of metallurgy and the latest advances in metal forging
          technology — we provide forged products that perform as promised.
        </p>
      </div>
    </section>
  );
}
