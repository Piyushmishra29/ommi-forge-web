import Eyebrow from '@/components/ui/Eyebrow';
import { MILESTONES } from '@/data/home';

/**
 * Beat 7 — heritage, 1975 → 2026.
 *
 * v2 pinned this and scrolled it sideways. v3 does not: `/` spends its one
 * pin on the act at the top (§5.1), and a horizontal track is a hijacked
 * scroll axis (§6 rule 18) that also had to carry a whole second static
 * implementation for phones and reduced motion. One layout, every viewport,
 * every motion preference — and it is now a server component, so the
 * section costs no client JS at all.
 *
 * The 2026 entry is `inProgress`: an electric-forging pilot that has not
 * landed yet. It gets a dashed saffron rule where the finished milestones
 * get a solid cinder one — the same distinction a drawing makes between a
 * dimension and a proposed one, and it is legible without relying on the
 * "(in progress)" label alone.
 */
export default function HeritageTimeline() {
  return (
    <section className="relative w-full section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>HERITAGE</Eyebrow>
        <h2 className="type-display-l mt-6 max-w-[16ch]">
          Fifty-one years on the floor.
        </h2>

        <ol className="mt-16 grid gap-12 md:grid-cols-2 md:gap-x-16">
          {MILESTONES.map((m) => (
            <li
              key={m.year}
              className={
                m.inProgress
                  ? 'border-t-2 border-dashed border-saffron pt-6'
                  : 'border-t border-rule pt-6'
              }
            >
              {/* Real figures, so `.type-data` and its tabular figures —
                  the same role the stats use, one step down in size. */}
              <p className="type-data text-[clamp(40px,4.5vw,64px)] text-saffron">
                {m.year}
              </p>
              <h3 className="type-display-s mt-5">
                {m.title}
                {m.inProgress ? (
                  // saffron, not ember: ember measures 2.98:1 on graphite and
                  // is forbidden on the dark ground (§2.2).
                  <span className="type-meta ml-3 align-middle uppercase text-saffron">
                    (in progress)
                  </span>
                ) : null}
              </h3>
              <p className="type-body mt-3 max-w-[52ch]">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
