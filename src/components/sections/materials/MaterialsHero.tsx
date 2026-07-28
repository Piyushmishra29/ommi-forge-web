import Eyebrow from '@/components/ui/Eyebrow';
import { MATERIALS_INTRO } from '@/data/materials';

export default function MaterialsHero() {
  return (
    <section className="bg-paper pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="mx-auto max-w-page px-6 md:px-10">
        {/* ember, not mesh — mesh is ≈3:1 on paper at this size, and
            Certifications further down the page already uses ember. */}
        <Eyebrow>
          <span className="text-ember">Materials</span>
        </Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] text-graphite md:text-6xl">
          The grade in your hand
          <br className="hidden md:block" /> matches the grade on the cert.
        </h1>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          {MATERIALS_INTRO}
        </p>
      </div>
    </section>
  );
}
