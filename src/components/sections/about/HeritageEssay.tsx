'use client';

import { useSyncExternalStore } from 'react';
import PinnedSection, { useScroll } from '@/components/motion/PinnedSection';
import { HERITAGE_CHAPTERS, type HeritageChapter } from '@/data/about';
import { cn } from '@/lib/cn';

/**
 * Heritage chapter rail — the canonical list. The shared
 * `HERITAGE_CHAPTERS` data in `src/data/about.ts` ships four chapters
 * (1975, 1985, 2000, Today); the modernisation arc reads more
 * naturally with two extra waypoints (2015, 2022), so we splice them
 * in locally without touching shared data.
 *
 * The voice deliberately matches the existing four — quiet, declarative,
 * grounded in shop-floor detail.
 */
const EXTRA_CHAPTERS: ReadonlyArray<HeritageChapter> = [
  {
    year: '2015',
    heading: 'Heat-treat under one roof',
    body: 'A continuous-belt furnace and a normalising line were commissioned alongside the forging bays, bringing every thermal cycle — annealing, normalising, isothermal anneal — inside the same building as the hammers. Lead times collapsed; certificates stopped needing a courier.',
  },
  {
    year: '2022',
    heading: 'Exports and certification',
    body: 'IATF 16949 and ISO 9001 audits cleared in the same financial year. Closed-die volumes for European drive-train customers crossed a million pieces. A second metallurgist joined the lab, and chemistry-on-arrival became chemistry-on-arrival-twice — once at the gate, again before the billet sees a hammer.',
  },
];

function buildChapters(): ReadonlyArray<HeritageChapter> {
  // Order: 1975, 1985, 2000, 2015, 2022, Today.
  const byYear = new Map<string, HeritageChapter>();
  for (const c of HERITAGE_CHAPTERS) byYear.set(c.year, c);
  for (const c of EXTRA_CHAPTERS) byYear.set(c.year, c);
  const order = ['1975', '1985', '2000', '2015', '2022', 'Today'];
  const out: HeritageChapter[] = [];
  for (const y of order) {
    const c = byYear.get(y);
    if (c) out.push(c);
  }
  return out;
}

const CHAPTERS = buildChapters();

/* -------------------------------------------------------------------------- */
/*  Reduced-motion subscription (no setState-in-effect)                       */
/* -------------------------------------------------------------------------- */
function subscribeRM(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getRMSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function getRMServer() {
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Reduced-motion fallback                                                   */
/* -------------------------------------------------------------------------- */
function StaticEssay() {
  return (
    <section className="bg-paper text-graphite">
      <div className="mx-auto grid max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 py-32 md:grid-cols-12 md:gap-16 md:px-10 md:py-40">
        <aside className="md:col-span-4">
          <p className="mb-8 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span
              aria-hidden
              className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
            />
            Heritage
          </p>
          <h2 className="font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
            Five decades of forging — written one heat at a time.
          </h2>
        </aside>
        <div className="md:col-span-8 md:pl-4">
          <div className="space-y-16">
            {CHAPTERS.map((c) => (
              <div key={c.year}>
                <p className="mb-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                  {c.year} · {c.heading}
                </p>
                <p className="font-body text-lg leading-relaxed text-steel md:text-xl md:leading-[1.65]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pinned inner: progress-driven chapter rotation                            */
/* -------------------------------------------------------------------------- */
function PinnedHeritage() {
  const { progress } = useScroll();
  // Six chapters → six slots. `activeIndex` clamps to the last chapter
  // so progress === 1 doesn't fall off the end.
  const total = CHAPTERS.length;
  const activeIndex = Math.min(
    total - 1,
    Math.max(0, Math.floor(progress * total)),
  );

  // Progress-dot offset down the rail. Each chapter occupies one slot.
  const dotProgress = Math.min(1, Math.max(0, progress));

  return (
    <div className="relative h-full w-full bg-paper text-graphite">
      <div className="mx-auto grid h-full max-w-[var(--container-page)] grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-12 md:gap-16 md:px-10 md:py-24">
        {/* Chapter rail — left column on desktop. */}
        <aside className="md:col-span-4">
          <p className="mb-8 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span
              aria-hidden
              className="mr-3 inline-block h-px w-8 align-middle bg-mesh"
            />
            Heritage
          </p>
          <div className="relative">
            {/* Rail line + saffron progress dot. The dot rides
                `dotProgress` along the rail height. */}
            <div
              aria-hidden
              className="absolute left-0 top-0 h-full w-px bg-graphite/12"
            />
            <div
              aria-hidden
              className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-saffron shadow-[0_0_0_4px_rgba(255,153,51,0.18)]"
              style={{
                top: `calc(${dotProgress * 100}% - 3.5px)`,
                willChange: 'top',
              }}
            />
            <ol className="space-y-5 pl-6">
              {CHAPTERS.map((c, i) => (
                <li key={c.year}>
                  <p
                    className={cn(
                      'font-display text-2xl font-light leading-tight transition-colors duration-500 md:text-3xl',
                      i === activeIndex ? 'text-graphite' : 'text-steel',
                    )}
                  >
                    {c.year}
                  </p>
                  <p
                    className={cn(
                      'mt-1 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors duration-500',
                      i === activeIndex ? 'text-mesh' : 'text-steel/55',
                    )}
                  >
                    {c.heading}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Prose stage — only the active chapter is visible; the rest
            are stacked behind at opacity 0. CSS transitions handle the
            fade so we don't need a per-frame React update. */}
        <div className="md:col-span-8 md:pl-4">
          <h2 className="mb-12 max-w-2xl font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
            Five decades — written one heat at a time.
          </h2>
          <div className="relative min-h-[260px] md:min-h-[320px]">
            {CHAPTERS.map((c, i) => (
              <article
                key={c.year}
                aria-hidden={i !== activeIndex}
                className={cn(
                  'transition-all duration-700 ease-out',
                  i === activeIndex
                    ? 'pointer-events-auto relative translate-y-0 opacity-100'
                    : 'pointer-events-none absolute inset-0 translate-y-4 opacity-0',
                )}
              >
                <p className="mb-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
                  {c.year} · {c.heading}
                </p>
                <p className="font-body text-lg leading-relaxed text-steel md:text-xl md:leading-[1.65]">
                  {c.body}
                </p>
              </article>
            ))}
          </div>

          {/* Step pips — six dots that fill saffron as the active
              chapter advances. A second cue for the rail. */}
          <ol
            aria-hidden
            className="mt-12 flex items-center gap-2"
          >
            {CHAPTERS.map((c, i) => (
              <li
                key={c.year}
                className={cn(
                  'h-1 w-10 transition-colors duration-500',
                  i <= activeIndex ? 'bg-saffron' : 'bg-graphite/10',
                )}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * HeritageEssay
 *
 * Pinned chapter scroll. While pinned (`length=3` = ~3 viewport
 * heights of scroll), the saffron progress dot on the left rail
 * descends through 1975 → 1985 → 2000 → 2015 → 2022 → Today, and the
 * matching body paragraph crossfades into the right column.
 *
 * Reduced-motion: degrades to a stacked prose layout with all six
 * chapters visible at once — same content, no pin, no motion.
 */
export default function HeritageEssay() {
  const reduced = useSyncExternalStore(
    subscribeRM,
    getRMSnapshot,
    getRMServer,
  );
  if (reduced) return <StaticEssay />;
  return (
    <PinnedSection length={3} className="bg-paper">
      <PinnedHeritage />
    </PinnedSection>
  );
}
