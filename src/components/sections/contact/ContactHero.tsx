'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';

/**
 * ContactHero
 *
 * Editorial opener for `/contact/`. Promotes the page to the same
 * cinematic register as `/`, `/about`, `/solutions`, `/products`:
 *
 *  - Eyebrow `QUOTE TO PART · IN A DAY`.
 *  - Display headline at `clamp(56px, 10vw, 110px)`, split per-char
 *    and swept in via GSAP on mount.
 *  - Strong sub-headline naming the three things we accept (a
 *    drawing, a sample, a paragraph) so the form below feels earned
 *    rather than merely present.
 *
 * Reduced-motion: the per-char stagger is skipped so the headline
 * renders at rest.
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
    <section
      ref={root}
      className="relative bg-paper pt-32 pb-12 md:pt-40 md:pb-20"
    >
      <div className="mx-auto max-w-[var(--container-page)] px-6 md:px-10">
        <Eyebrow data-fade>
          <span className="text-mesh">Quote to part · in a day</span>
        </Eyebrow>

        <h1
          data-contact-headline
          className="mt-8 max-w-5xl font-display font-light leading-[0.98] text-graphite"
          style={{ fontSize: 'clamp(56px, 10vw, 110px)' }}
        >
          <SplitText as="span">{`Quote to part in a day.`}</SplitText>
        </h1>

        <p
          data-fade
          className="mt-10 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]"
        >
          Send us a drawing, a sample, or a paragraph in an email. We&apos;ll
          come back with a method and a price — often within a day, from a
          real human at the marketing desk.
        </p>
      </div>
    </section>
  );
}
