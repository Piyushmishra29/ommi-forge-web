'use client';

import { useEffect, useRef, useState } from 'react';
import { HERITAGE_CHAPTERS } from '@/data/about';
import { cn } from '@/lib/cn';

/**
 * HeritageEssay
 *
 * Two-column scroll:
 *  - Left column: sticky list of chapter labels (1975 / 1985 / 2000 / Today).
 *  - Right column: long-form prose, one paragraph per chapter.
 * The active chapter highlights as the matching paragraph crosses the
 * page center.
 *
 * No GSAP needed — a single IntersectionObserver on the paragraphs is
 * enough and degrades cleanly under reduced-motion.
 */
export default function HeritageEssay() {
  const [activeIndex, setActiveIndex] = useState(0);
  const paragraphRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport center.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - window.innerHeight / 2) -
              Math.abs(b.boundingClientRect.top - window.innerHeight / 2),
          );
        if (visible[0]) {
          const idx = Number(visible[0].target.getAttribute('data-idx'));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      {
        rootMargin: '-35% 0px -35% 0px',
        threshold: 0,
      },
    );

    for (const el of paragraphRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-paper text-graphite">
      <div className="mx-auto grid max-w-[var(--container-page)] grid-cols-1 gap-12 px-6 py-32 md:grid-cols-12 md:gap-16 md:px-10 md:py-40">
        {/* Sticky chapter rail */}
        <aside className="md:sticky md:top-32 md:col-span-4 md:h-fit">
          <p className="mb-8 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span aria-hidden className="mr-3 inline-block h-px w-8 align-middle bg-mesh" />
            Heritage
          </p>
          <ol className="space-y-5 border-l border-graphite/10 pl-6">
            {HERITAGE_CHAPTERS.map((c, i) => (
              <li key={c.year}>
                <button
                  type="button"
                  onClick={() => {
                    paragraphRefs.current[i]?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }}
                  className={cn(
                    'block text-left font-display text-2xl font-light transition-colors md:text-3xl',
                    i === activeIndex ? 'text-graphite' : 'text-ash/60',
                  )}
                >
                  {c.year}
                </button>
                <span
                  className={cn(
                    'mt-1 block font-eyebrow text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors',
                    i === activeIndex ? 'text-mesh' : 'text-ash/40',
                  )}
                >
                  {c.heading}
                </span>
              </li>
            ))}
          </ol>
        </aside>

        {/* Prose column */}
        <div className="md:col-span-8 md:pl-4">
          <h2 className="mb-16 max-w-2xl font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
            Five decades of forging — written one heat at a time.
          </h2>
          <div className="space-y-24">
            {HERITAGE_CHAPTERS.map((c, i) => (
              <div
                key={c.year}
                ref={(el) => {
                  paragraphRefs.current[i] = el;
                }}
                data-idx={i}
                className="relative"
              >
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
