'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import { VALUES } from '@/data/about';

/**
 * Values3Up — the three real values, on the dark ground (§5.2).
 *
 * TWO THINGS THAT CHANGED FROM v2, BOTH RULES RATHER THAN TASTE
 *
 * 1. **The horizontal-scroll pin is gone.** v2 delivered these three as a
 *    300vw track translating under a 3× viewport pin. §6.18 rules out
 *    horizontal-scroll sections outright, and §6.19 allows no scroll-jacking
 *    beyond the two specified pins — neither of which is here. What is left
 *    is a 3-up, which is what §5.2 asked for in the first place.
 *
 * 2. **There is now ONE tree, not two.** The pinned version and its
 *    reduced-motion fallback had drifted into different layouts with
 *    different headings, which is how a section ends up accessible in one
 *    branch and not the other. With no pin there is nothing to fall back
 *    from: reduced motion skips the entrance reveal and changes nothing
 *    else. The `<h2>` is a real, visible heading in every path — it exists
 *    so the three `<h3>`s below have a parent, instead of hanging off the
 *    heritage section's heading.
 *
 * Copy is `VALUES` verbatim. §6.25 exists because "Innovation / Excellence /
 * Quality" is what gets written when nobody reads the data file — this
 * company's actual third value is "Partners, not clients", which is a
 * sentence with a point of view.
 */
export default function Values3Up() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // §4.4 preset #7 at our numbers: 480ms on `press`, 40ms stagger,
      // `top 90%`, and `play none none reverse` so scrolling back up
      // re-arms rather than stranding a half-played state.
      gsap.from(el.querySelectorAll('[data-value]'), {
        y: 16,
        opacity: 0,
        duration: 0.48,
        ease: 'expo.out',
        stagger: 0.04,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} aria-labelledby="values-heading" className="relative">
      <div className="page-x section-y mx-auto max-w-page">
        <header className="max-w-[24ch]">
          <Eyebrow>How we work</Eyebrow>
          <h2 id="values-heading" className="type-display-l mt-8 text-balance">
            Three values. Non-negotiable.
          </h2>
        </header>

        {/* `gap-px` over an `ash` ground draws the hairlines between panels
            instead of bordering each one — no doubled 2px rules where two
            panels meet, and the grid itself is the rule. */}
        <ol className="mt-14 grid grid-cols-1 gap-px bg-ash md:mt-20 md:grid-cols-3">
          {VALUES.map((v) => (
            <li
              key={v.number}
              data-value
              className="flex flex-col justify-between gap-12 bg-graphite p-8 md:min-h-[420px] md:p-10"
            >
              {/* A real figure, so `type-data` with tabular figures — but at
                  the display end of the ramp, where saffron measures 7.57:1
                  on graphite. No counter animation: §6.17 reserves those for
                  the STATS block, which counts actual quantities. */}
              <p
                aria-hidden
                className="type-data text-saffron"
                style={{ fontSize: 'clamp(56px, 5vw, 76px)' }}
              >
                {v.number}
              </p>
              <div>
                <h3 className="type-display-m text-balance">{v.title}</h3>
                <p className="type-body mt-4 max-w-[68ch] text-pretty">
                  {v.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 md:mt-20">
          <Link
            href="/contact/"
            data-magnetic
            className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-cinder px-8 py-4 transition-colors duration-200 hover:border-mesh hover:text-mesh"
          >
            Start a project with us →
          </Link>
        </div>
      </div>
    </section>
  );
}
