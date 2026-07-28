'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';

/**
 * ContactHero
 *
 * Editorial opener for `/contact/`, on the dark ground. No 3D on this
 * route (§5.8) — everything below is a paper card, because a form is a
 * document.
 *
 *  - Eyebrow `QUOTE TO PART · IN A DAY`, saffron on graphite. v2 forced
 *    `text-ember` here because the ground was paper; on graphite ember
 *    is 2.98:1 and forbidden, and `<Eyebrow>` now resolves the right
 *    token per surface on its own.
 *  - `display-l`, the page-h1 role (§2.4). v2 ran the home hero's scale.
 *  - Sub-headline naming the three things we accept (a drawing, a
 *    sample, a paragraph) so the form below feels earned.
 *
 * Reduced-motion: the per-char stagger is skipped so the headline
 * renders at rest — `gsap.from()` is never reached, so nothing is left
 * parked at `opacity: 0`.
 */
export default function ContactHero() {
  const root = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('[data-contact-headline] [data-char]');
      const fades = el.querySelectorAll('[data-fade]');

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(chars, {
        yPercent: 110,
        opacity: 0,
        duration: 1.0,
        ease: 'power4.out',
        stagger: 0.014,
      }).from(
        fades,
        {
          y: 20,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
        },
        '-=0.55',
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative section-y pb-0">
      <div className="mx-auto max-w-page page-x">
        {/* See CareersHero: <Eyebrow> does not spread unknown props, so
            `data-fade` has to sit on a wrapper to actually be selected. */}
        <div data-fade>
          <Eyebrow>Quote to part · in a day</Eyebrow>
        </div>

        <h1
          data-contact-headline
          className="type-display-l mt-8 max-w-4xl text-balance"
        >
          <SplitText as="span">{`Quote to part in a day.`}</SplitText>
        </h1>

        <p data-fade className="type-lede mt-10 max-w-[68ch] text-pretty">
          Send us a drawing, a sample, or a paragraph in an email. We&apos;ll
          come back with a method and a price — often within a day, from a
          real human at the marketing desk.
        </p>
      </div>
    </section>
  );
}
