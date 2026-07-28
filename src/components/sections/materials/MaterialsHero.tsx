import Eyebrow from '@/components/ui/Eyebrow';
import { MATERIALS_INTRO } from '@/data/materials';

/**
 * MaterialsHero — the page opener, on the dark ground.
 *
 * No 3D here and none anywhere below it (§5.5). `/materials` is the
 * metallurgist's lab: fluorescent light, printed sheets, no fire. The
 * hero is the one warm-ish moment (a saffron eyebrow) before the page
 * hands over entirely to paper cards.
 *
 * `<Eyebrow>` needs no colour prop now — it reads `--color-ink-accent`,
 * which is saffron out here (7.57:1) and ember inside a card (5.19:1).
 * The v2 `<span className="text-ember">` override was doing that job by
 * hand and would have been silently wrong on graphite (2.98:1).
 */
export default function MaterialsHero() {
  return (
    <section className="section-y">
      <div className="mx-auto max-w-page page-x">
        <Eyebrow>Materials</Eyebrow>
        <h1 className="type-display-l mt-8 max-w-3xl text-balance">
          The grade in your hand matches the grade on the cert.
        </h1>
        {/* 68ch cap per §2.5 — `max-w-2xl` ran to ~78ch at the lede's
            upper clamp. */}
        <p className="type-lede mt-10 max-w-[68ch] text-pretty">
          {MATERIALS_INTRO}
        </p>
      </div>
    </section>
  );
}
