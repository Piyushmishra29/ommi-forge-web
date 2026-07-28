import PaperCard from '@/components/ui/PaperCard';
import { MATERIALS, type Material } from '@/data/materials';

/**
 * MaterialsTable
 *
 * The four steel families, each as a paper card on the dark ground —
 * the biggest concentration of light surface on the site (§5.5). v2
 * alternated four *page-wide* background treatments (paper / graphite /
 * peach / graphite) and needed a four-entry ACCENTS table to keep each
 * one's accent above AA. All of that is gone: every family is now the
 * same printed sheet, so there is exactly one surface to reason about,
 * and its contrast rules come from `.paper-card` rather than from a
 * lookup table an author has to keep in sync. Measured inside a card:
 * graphite 16.14:1, steel 7.07:1, ember 5.42:1, cinder 5.33:1, and the
 * ash hairlines 4.29:1 — all on snow.
 *
 * The grade list is genuine two-column tabular data (sub-family →
 * example grade designations), so it renders as a real `<table>` with
 * a `<caption>`, a `<th scope="col">` header row and a
 * `<th scope="row">` per sub-family. A screen reader then announces
 * "Low carbon, Example grades: C10, C15…" instead of two unrelated
 * lines.
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
export default function MaterialsTable() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-16 page-x pb-24 md:gap-24 md:pb-32">
      {MATERIALS.map((m: Material) => (
        <PaperCard
          key={m.slug}
          as="section"
          id={m.slug}
          topRule
          aria-labelledby={`${m.slug}-name`}
          className="p-8 md:p-12 lg:p-16"
        >
          {/* Sheet header. The eyebrow takes no colour prop — inside a
              paper card `--color-ink-accent` is already ember. */}
          <p className="type-eyebrow">
            <span aria-hidden className="mr-3 inline-block h-px w-8 align-middle bg-current" />
            Family {m.number}
          </p>
          <h2 id={`${m.slug}-name`} className="type-display-l mt-6">
            {m.name}
          </h2>
          <p className="type-display-s mt-4 font-display italic text-ink-accent">
            {m.tagline}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-10 md:mt-12 md:grid-cols-12 md:gap-12">
            {/* 5/7, not 6/6 (§2.5). The blurb runs ~52ch at this width. */}
            <div className="md:col-span-5">
              <p className="type-body text-pretty">{m.blurb}</p>
            </div>

            <div className="md:col-span-7">
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
                    <tr className="border-b border-rule">
                      <th
                        scope="col"
                        className="type-eyebrow w-[38%] pb-3 pr-4 text-left text-ink-muted"
                      >
                        Sub-family
                      </th>
                      <th
                        scope="col"
                        className="type-eyebrow pb-3 text-left text-ink-muted"
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
                      hairline. */}
                  <tbody>
                    {m.families.map((f) => (
                      <tr
                        key={f.name}
                        className="border-b border-rule last:border-b-0"
                      >
                        <th
                          scope="row"
                          className="type-display-s py-5 pr-4 text-left align-baseline"
                        >
                          {f.name}
                        </th>
                        {/* The `spec` type role (§2.4): Roboto 600, 14px,
                            tabular-nums — so the digits in C10 / C45 /
                            42CrMo4 sit on a common width and the column
                            reads as a column. v2 set these uppercase with
                            0.18em tracking, which turned real grade
                            designations into decoration and made
                            "SS 304L" a size wider than it is. */}
                        <td className="type-spec py-5 align-baseline text-ink">
                          {f.grades}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </PaperCard>
      ))}
    </div>
  );
}
