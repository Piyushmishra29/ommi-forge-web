import Eyebrow from '@/components/ui/Eyebrow';

/**
 * SolutionsHero — short editorial intro above the pinned methods.
 */
export default function SolutionsHero() {
  return (
    <section className="bg-paper pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow>
          <span className="text-mesh">What we forge</span>
        </Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] text-graphite md:text-6xl">
          Four methods.
          <br />
          Every shape a billet can take.
        </h1>
        <p className="mt-8 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          From half-kilo levers to half-tonne shafts, every part on our line is
          shaped under heat by one of four forging methods. Eight power
          hammers, an open-die line, a ring-rolling mill and an upset-forging
          line — picked to fit the part, never the other way around.
        </p>
      </div>
    </section>
  );
}
