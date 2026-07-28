'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import { SOLUTIONS_HERO } from '@/data/solutions';

/**
 * SolutionsHero — the opening frame above the pinned methods act.
 *
 * Deliberately quiet. `/solutions` spends its whole motion budget on the
 * four-panel act below (§5.4), and a second spectacle above it would just
 * make the visitor scroll past both. So this is §4.4 preset #5 — a section
 * header with its eyebrow and rule — and nothing else.
 *
 * No `SplitText` here on purpose: §4.4 restricts the per-character h1
 * stagger to `/` and `/about`. Reserving it for two pages is what keeps it
 * feeling like a decision rather than a default.
 *
 * The v2 version also ran a `scrub: true` fade-out as the hero left the
 * viewport. That is gone twice over: §4.2 bans `scrub: true` (instant
 * tracking is weightless), and a second ScrollTrigger sitting immediately
 * above a 560vh pin is one more thing to re-measure on every refresh for a
 * fade nobody asked for.
 *
 * Reduced motion: the entrance simply does not run. The layout is identical
 * either way — nothing here depends on a tween having fired, so there is no
 * second tree to keep in sync.
 */
export default function SolutionsHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // §4.2 component band: 480ms on `press` (expo.out), 40ms stagger.
      // Nothing overshoots — §4.1 bans `back`/`elastic`/`bounce` outright.
      gsap.from(el.querySelectorAll('[data-rise]'), {
        y: 16,
        opacity: 0,
        duration: 0.48,
        ease: 'expo.out',
        stagger: 0.04,
      });
      gsap.from(el.querySelector('[data-rule]'), {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.62,
        ease: 'expo.out',
        delay: 0.18,
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    /* No `bg-*` anywhere on this route: the page ground is already graphite
       (html/body, globals.css), and an opaque section background would paint
       over the shared canvas layer the methods act below draws into.
       `<main>` already carries `padding-top: var(--header-h)`, so the padding
       here is only the section's own air on top of that. */
    <section
      ref={root}
      className="relative pb-[clamp(64px,8vw,96px)] pt-[clamp(72px,9vw,128px)]"
    >
      <div className="page-x mx-auto max-w-page">
        {/* Wrapper, not `<Eyebrow data-rise>`: `Eyebrow` takes a closed prop
            set and drops anything else, so the attribute would never reach
            the DOM and the selector below would silently miss it. */}
        <div data-rise>
          <Eyebrow>{SOLUTIONS_HERO.eyebrow}</Eyebrow>
        </div>

        {/* Page h1 → `display-l`, per §2.4. `display-xl` is the home h1 and
            nothing else on the site is allowed to claim it. */}
        <h1 className="type-display-l mt-8 max-w-[16ch] text-balance" data-rise>
          {SOLUTIONS_HERO.headlineLine1}{' '}
          <span className="text-saffron">{SOLUTIONS_HERO.headlineLine2}</span>
        </h1>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          {/* 68ch measure — the 7-column track alone runs past 75ch on the
              tablet widths just under `md:`. */}
          <p
            className="type-lede max-w-[68ch] text-pretty md:col-span-7"
            data-rise
          >
            {SOLUTIONS_HERO.subhead}
          </p>

          <div className="md:col-span-4 md:col-start-9 md:self-end" data-rise>
            <p className="type-meta uppercase tracking-[0.26em] text-ink-body">
              Scroll for each method
            </p>
            <span
              aria-hidden
              data-rule
              className="mt-4 block h-px w-16 bg-saffron"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
