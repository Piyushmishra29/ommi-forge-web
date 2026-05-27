'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { VALUES } from '@/data/about';

/**
 * Values3Up
 *
 * Three full-bleed value cards. On desktop they reveal sequentially as
 * the section scrolls into view (staggered y-translate + fade). On
 * mobile they just stack — same content, no animation overhead.
 *
 * The accent colours rotate through graphite / mesh / saffron so the
 * trio reads as a triptych, not three identical tiles.
 */
const ACCENTS = [
  { bg: 'bg-graphite', text: 'text-paper', num: 'text-mesh' },
  { bg: 'bg-mesh', text: 'text-graphite', num: 'text-graphite' },
  { bg: 'bg-saffron', text: 'text-graphite', num: 'text-graphite' },
] as const;

export default function Values3Up() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) return;

    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-value-card]'), {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      });
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section ref={rootRef} className="bg-paper py-32 md:py-40">
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <div className="mb-16 max-w-2xl md:mb-24">
          <p className="mb-6 font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
            <span aria-hidden className="mr-3 inline-block h-px w-8 align-middle bg-mesh" />
            How we work
          </p>
          <h2 className="font-display text-3xl font-light leading-tight text-graphite md:text-5xl">
            Three values. Non-negotiable.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {VALUES.map((v, i) => {
            const a = ACCENTS[i % ACCENTS.length];
            return (
              <article
                key={v.number}
                data-value-card
                className={`${a.bg} ${a.text} relative flex min-h-[420px] flex-col justify-between p-8 md:p-10`}
              >
                <span
                  className={`${a.num} font-display text-6xl font-light md:text-7xl`}
                >
                  {v.number}
                </span>
                <div>
                  <h3 className="mb-4 font-display text-2xl font-light leading-tight md:text-3xl">
                    {v.title}
                  </h3>
                  <p className="font-body text-base leading-relaxed opacity-90 md:text-lg">
                    {v.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center md:mt-24">
          <Link
            href="/contact/"
            data-magnetic
            className="inline-flex items-center justify-center bg-graphite px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:bg-saffron hover:text-graphite"
          >
            Start a project with us →
          </Link>
        </div>
      </div>
    </section>
  );
}
