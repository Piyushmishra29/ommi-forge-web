import { MATERIALS, type Material } from '@/data/materials';
import { cn } from '@/lib/cn';

/**
 * MaterialsTable
 *
 * One large block per family — copy on the left, sub-family grade
 * table on the right. Alternating bg keeps the eye moving down the
 * page.
 *
 * The grade list is genuine two-column tabular data (sub-family →
 * example grade designations), so it renders as a real `<table>` with
 * a `<caption>`, a `<th scope="col">` header row and a
 * `<th scope="row">` per sub-family. A screen reader then announces
 * "Low carbon, Example grades: C10, C15…" instead of two unrelated
 * lines. It used to be a `<ul>` of stacked `<div>`s, which carried
 * none of that.
 *
 * Responsive: the table wraps in an `overflow-x-auto` region rather
 * than collapsing to cards — with only two columns it fits a 375px
 * viewport by wrapping, and the wrapper is the safety net if a future
 * grade string is long enough to push past it. The wrapper is
 * focusable and labelled so a keyboard user can still reach and pan a
 * scrolling table.
 *
 * On the `tabIndex={0}`: measured against the current data it never
 * fires. The widest unbreakable tokens are "Customer-" (col 1, breaks
 * on the hyphen) and "42CrMo4," (col 2, breaks on the comma), so
 * min-content is ~177px against the 272px available at a 320px
 * viewport — i.e. page zoom to 400% still does not overflow. It is
 * kept anyway because *text-only* zoom scales the type without
 * scaling the container: at 200% those same tokens need ~322px and
 * the region really does become scrollable. Dropping the tabIndex
 * would make that state unreachable by keyboard, which is why the
 * usual guidance is to make a responsive table's scroll container
 * focusable unconditionally rather than guess at the content. Don't
 * remove it on the grounds that the tables "always fit" — they fit at
 * the default text size only.
 */
const ACCENTS: ReadonlyArray<{
  bg: string;
  text: string;
  accent: string;
  border: string;
}> = [
  {
    // Paper bg: small accent text needs the darker ember to pass AA.
    bg: 'bg-paper',
    text: 'text-graphite',
    accent: 'text-ember',
    border: 'border-graphite/10',
  },
  {
    // Graphite bg: mesh passes contrast on dark — keep it.
    bg: 'bg-graphite',
    text: 'text-paper',
    accent: 'text-mesh',
    border: 'border-paper/10',
  },
  {
    // Peach card: mesh ≈1.9:1 on peach fails, and ember only reaches
    // ≈3.3:1 — under AA for the 12px eyebrow and the 20px tagline,
    // neither of which qualifies as "large text". Graphite clears at
    // ≈9.8:1 but leaves the peach band with no accent hue at all, so the
    // accent slot takes `oxide` (≈5.3:1 here) — the darkest step of the
    // same warm ramp, added for exactly this surface. See globals.css.
    bg: 'bg-peach',
    text: 'text-graphite',
    accent: 'text-oxide',
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
            <div className="mx-auto grid max-w-page grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
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
                <div
                  role="region"
                  aria-label={`${m.name} — grades by sub-family`}
                  tabIndex={0}
                  className="overflow-x-auto"
                >
                  <table className="w-full border-collapse text-left">
                    <caption className="sr-only">
                      {`${m.name}: example grade designations for each sub-family.`}
                    </caption>
                    <thead>
                      <tr className={cn('border-b', a.border)}>
                        <th
                          scope="col"
                          className="w-[42%] pb-3 pr-4 text-left font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80"
                        >
                          Sub-family
                        </th>
                        <th
                          scope="col"
                          className="pb-3 text-left font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80"
                        >
                          Example grades
                        </th>
                      </tr>
                    </thead>
                    {/* Hairline rules sit on the rows themselves, not on a
                        `divide-y` parent: preflight resets every element to
                        `border: 0 solid`, so a colour set on the parent never
                        reaches the divided children and the rules render at
                        full-strength currentColor instead of the intended
                        /10 hairline. */}
                    <tbody>
                      {m.families.map((f) => (
                        <tr
                          key={f.name}
                          className={cn('border-b last:border-b-0', a.border)}
                        >
                          <th
                            scope="row"
                            className="py-5 pr-4 text-left align-baseline font-display text-xl font-light md:text-2xl"
                          >
                            {f.name}
                          </th>
                          {/* tabular-nums keeps the digits in C10 / C45 /
                              42CrMo4 on a common width so the column reads
                              as a column, not a ragged sentence. */}
                          <td className="py-5 align-baseline font-eyebrow text-xs font-semibold uppercase tracking-[0.12em] tabular-nums opacity-80 md:tracking-[0.18em]">
                            {f.grades}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
