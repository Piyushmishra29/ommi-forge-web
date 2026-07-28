'use client';

import { useCallback, useRef } from 'react';
import {
  MODELS,
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useModelProgress,
  useScrollProgress,
} from '@/components/three3';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import PartPoster from '@/components/three/PartPoster';
import Eyebrow from '@/components/ui/Eyebrow';
import { HERITAGE_CHAPTERS } from '@/data/about';

/**
 * HeritageEssay — heritage as a material state change (§5.2).
 *
 * Four chapters in ordinary document order down the left, one sticky 3D
 * stage on the right. As the chapters scroll past, `trunnion-85000103`
 * makes a single 180° turn and its surface lerps from as-forged mill scale
 * to a machined finish. Surface finish is time.
 *
 * WHY THIS IS STICKY AND NOT PINNED
 * ---------------------------------
 * `position: sticky` costs no ScrollTrigger, no pin reparenting and no
 * refresh ordering — the three things that make a GSAP pin a liability (a
 * pin torn down in a passive effect crashed SPA navigation on this project
 * once). It also degrades perfectly: the four chapters are plain flow
 * content, so a reduced-motion visitor, a no-WebGL visitor and a crawler all
 * get the same four chapters in the same order with nothing hidden behind a
 * trigger that never fired. The only thing the degraded paths lose is the
 * render itself.
 *
 * The v2 version of this file spliced two extra chapters (2015, 2022) into
 * the shared data locally — IATF certification dates, an export volume, a
 * second metallurgist. None of that is in `src/data/*` and none of it came
 * from the client, so §6.23 (no invented facts) takes them out. The four
 * real `HERITAGE_CHAPTERS` are the page.
 */

/** Loaded on approach. Eager-importing this would put three.js in the page chunk. */
const HeritageScene = dynamicScene(() => import('./HeritageScene'));

/** §3.6 — depth on a 3D stage is a CSS vignette, never a border or a radius. */
const VIGNETTE =
  'radial-gradient(ellipse at 50% 45%, transparent 40%, #1F2124CC 100%)';

/**
 * The part on the stage, in words.
 *
 * Doubles as the `<SceneSlot>` description (a `<canvas>` exposes nothing to
 * assistive tech) and as the visible caption in the no-WebGL plate below.
 * Every fact here is real: the part is `trunnion-85000103.glb` in
 * `public/assets/models/`, and 85000103 is its actual part number.
 */
const PART = {
  name: 'Trunnion',
  number: '85000103',
  description:
    'A forged trunnion — the stub axle a heavy assembly pivots on — turning slowly against a dark stage. Over the four chapters its surface changes from the dark blue-grey mill scale of a part straight off the hammer to the pale, directional finish of one that has been machined.',
} as const;

export default function HeritageEssay() {
  const chaptersRef = useRef<HTMLOListElement | null>(null);
  const reduced = useReducedMotion();

  /**
   * 0–1 across the chapter column, as a ref. Lenis has already smoothed the
   * scroll this reads from, so no scrub is needed on top — and unlike a
   * scrubbed tween it keeps working under reduced motion, where the progress
   * is the visitor's own scrolling rather than an autonomous animation.
   */
  const progress = useScrollProgress(chaptersRef, {
    start: 'top center',
    end: 'bottom center',
  });

  const { active, progress: bytes } = useModelProgress([MODELS.trunnion.url]);

  const onApproach = useCallback(() => {
    preloadModel(MODELS.trunnion.url, MODEL_PRIORITY.hero);
  }, []);

  return (
    <section aria-labelledby="heritage-heading" className="relative">
      <div className="page-x section-y mx-auto max-w-page">
        <header className="max-w-[24ch]">
          <Eyebrow>Heritage</Eyebrow>
          <h2 id="heritage-heading" className="type-display-l mt-8 text-balance">
            Five decades — written one heat at a time.
          </h2>
        </header>

        <div className="mt-16 md:mt-24 md:grid md:grid-cols-12 md:gap-12">
          {/* ---- Stage. Second in the DOM so a screen reader hears the
                  chapters first; `md:order-2` puts it on the right. ---- */}
          <div className="md:order-2 md:col-span-5 md:col-start-8">
            <div className="relative h-[38svh] md:sticky md:top-[calc(var(--header-h)+2rem)] md:h-[64svh]">
              {reduced ? (
                // §4.5: under reduced motion the canvas is replaced by the
                // beat's poster. Not a fallback so much as the specified
                // experience — and it is also the only *correct* one here.
                // The engine's frame driver runs demand-based in
                // reduced-motion mode, advancing on scroll and resize; a
                // model that finishes streaming after the visitor has
                // stopped scrolling therefore never gets a frame drawn, and
                // the stage sits empty until they scroll again. Measured.
                // Not mounting the slot at all sidesteps it entirely and
                // costs these visitors zero three.js bytes.
                <PartPlate />
              ) : (
                <SceneSlot
                  accessibleName={`${PART.name}, part number ${PART.number}, turning slowly on a dark stage`}
                  description={PART.description}
                  // `h-full w-full`, NOT `absolute inset-0`: `SceneSlot`
                  // prepends `relative` to whatever className it is given,
                  // and Tailwind emits `relative` after `absolute`, so
                  // `relative` wins the cascade and `inset-0` then sizes
                  // nothing. The box measured 407×0, drei's `View` scissored
                  // to a zero-height rectangle, and the stage rendered empty
                  // with no error anywhere. Give the slot a real height.
                  className="h-full w-full"
                  onApproach={onApproach}
                  fallback={<PartPlate />}
                >
                  <HeritageScene progress={progress} />
                </SceneSlot>
              )}

              {/* z-10 because the shared canvas is a fixed layer at z-index 1;
                  anything that must read on top of the render out-ranks it
                  explicitly. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10"
                style={{ backgroundImage: VIGNETTE }}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4">
                {/* `paper`, not `swarf`: this caption sits over rendered
                    pixels whose value we do not control. swarf measures
                    6.19:1 on graphite but only 4.13:1 on the 3D floor tone
                    (#3A3E44), and the part itself is brighter still by the
                    end of the page. Only a near-white holds over all of it.
                    Same reasoning as `PhotoBreak`'s caption over a photo. */}
                <p className="type-spec text-paper">
                  {/* The separator was `cinder` — 3.03:1, which is a hairline
                      value, not a text value. It is a glyph, so it takes the
                      text colour and earns its subordination from spacing. */}
                  {PART.name} · <span className="text-peach">{PART.number}</span>
                </p>
                {/* Real byte progress, not a spinner (§6.16). */}
                {active && (
                  <p className="type-meta bg-graphite/70 px-2 py-1 tabular-nums text-saffron">
                    {Math.round(bytes * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ---- Chapters ---- */}
          <ol ref={chaptersRef} className="md:order-1 md:col-span-6">
            {HERITAGE_CHAPTERS.map((c) => (
              <li
                key={c.year}
                className="flex min-h-[60svh] flex-col justify-center border-t border-cinder py-14 first:border-t-0 first:pt-0 last:pb-0 md:min-h-[68svh]"
              >
                <p className="type-eyebrow tabular-nums">{c.year}</p>
                <h3 className="type-display-m mt-5 text-balance">{c.heading}</h3>
                {/* 68ch: the 6-column track alone runs past 75ch at the
                    tablet widths just below `md:`, where the column is still
                    full-bleed. */}
                <p className="type-lede mt-6 max-w-[68ch] text-pretty">
                  {c.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  No-WebGL / pre-hydration plate                                            */
/* -------------------------------------------------------------------------- */

/**
 * What ships in the exported HTML, what a crawler indexes, and what a
 * WebGL-less browser keeps: the poster still of this exact part (§5.9),
 * rendered offline from the same rig as the live scene.
 *
 * `contain` because the stage is much taller than it is wide; the render's
 * background is the graphite page ground, so there is no letterbox to see.
 *
 * One caveat worth knowing: the posters are rendered in the `MACHINED`
 * material state, which is where this page *ends* rather than where it
 * starts. That is the right compromise here — the still shows the part at
 * its most legible — but it means the canvas fades in slightly darker than
 * the poster it replaces. Raised with the lane that owns the poster script.
 *
 * The part number and name sit OUTSIDE the slot, in the caption row, so they
 * are present in every path rather than only in the fallback.
 */
function PartPlate() {
  return (
    <PartPoster
      model={MODELS.trunnion.url}
      alt={`${PART.name}, part number ${PART.number} — a forged stub axle, shown as machined steel.`}
      fit="contain"
      className="h-full w-full"
    />
  );
}
