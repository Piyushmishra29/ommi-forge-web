import { MATERIALS, type Material } from '@/data/materials';
import { cn } from '@/lib/cn';

/**
 * MaterialsTable
 *
 * One large block per family — copy on the left, sub-family grade list
 * on the right. Alternating bg keeps the eye moving down the page.
 */
const ACCENTS: ReadonlyArray<{
  bg: string;
  text: string;
  accent: string;
  border: string;
}> = [
  {
    bg: 'bg-paper',
    text: 'text-graphite',
    accent: 'text-mesh',
    border: 'border-graphite/10',
  },
  {
    bg: 'bg-graphite',
    text: 'text-paper',
    accent: 'text-mesh',
    border: 'border-paper/10',
  },
  {
    bg: 'bg-peach',
    text: 'text-graphite',
    accent: 'text-mesh',
    border: 'border-graphite/15',
  },
  {
    bg: 'bg-graphite',
    text: 'text-paper',
    accent: 'text-saffron',
    border: 'border-paper/10',
  },
];

export default function MaterialsTable() {
  return (
    <>
      {MATERIALS.map((m: Material, i) => {
        const a = ACCENTS[i % ACCENTS.length];
        return (
          <section
            key={m.slug}
            id={m.slug}
            className={cn(a.bg, a.text, 'py-24 md:py-32')}
          >
            <div className="mx-auto grid max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
              <div className="md:col-span-6">
                <p
                  className={cn(
                    'mb-6 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em]',
                    a.accent,
                  )}
                >
                  <span aria-hidden className="mr-3 inline-block h-px w-8 align-middle bg-current" />
                  Family {m.number}
                </p>
                <h2 className="font-display text-3xl font-light leading-tight md:text-5xl">
                  {m.name}
                </h2>
                <p className={cn('mt-4 font-display text-lg italic md:text-xl', a.accent)}>
                  {m.tagline}
                </p>
                <p className="mt-8 max-w-lg font-body text-base leading-relaxed opacity-90 md:text-lg md:leading-[1.7]">
                  {m.blurb}
                </p>
              </div>

              <div className="md:col-span-6">
                <ul className={cn('divide-y', a.border)}>
                  {m.families.map((f) => (
                    <li key={f.name} className="py-5">
                      <div className="flex items-baseline justify-between gap-6">
                        <span className={cn('font-display text-xl font-light md:text-2xl')}>
                          {f.name}
                        </span>
                      </div>
                      <p className="mt-2 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                        {f.grades}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
