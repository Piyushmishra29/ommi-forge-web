'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useModelProgress,
  useScrollProgress,
} from '@/components/three3';
import PartPoster from '@/components/three/PartPoster';
import { HANDOFF_MS } from '@/components/three/stage-rig';
import Eyebrow from '@/components/ui/Eyebrow';
import { RENDERS, getRenderBySlug } from '@/data/renders';
import { RendersGrid } from '@/app/renders/renders-grid';

/**
 * The scene body is fetched on the frame the stage arms, not when the page
 * renders. Without this boundary the page would statically import
 * `three3/scene` through the JSX below and three.js would land in the route's
 * first-paint chunk — the slot's own laziness defeated by its children.
 */
const StageScene = dynamicScene(() => import('./StageScene'));

/** §5.6: "Default state (nothing hovered) shows part-g, the protagonist." */
const DEFAULT_SLUG = 'g';

/**
 * Dwell before a hover commits, in ms.
 *
 * The point is the drag-across-the-grid stampede: without it, sweeping the
 * pointer over nine tiles queues nine GLB fetches and nine meshopt decodes —
 * ~5 MB and a stutter for a visitor who was aiming at the last one. 150ms is
 * long enough to filter a traverse and short enough that a deliberate hover
 * still feels immediate.
 */
const DWELL_MS = 150;

/** §3.6 — depth comes from a CSS vignette over the canvas, not from a
 *  different clear colour, because a different clear colour is a visible
 *  rectangle and this canvas must not look like a canvas. */
const VIGNETTE =
  'radial-gradient(ellipse at 50% 45%, transparent 40%, var(--color-graphite) 100%)';

/**
 * `/renders` — the hub (§5.6). One canvas, nine parts, hover-driven.
 *
 * A persistent stage carries whichever part the visitor is pointing at; the
 * nine tiles beside it are static posters. Explicitly **not** nine canvases:
 * nine WebGL contexts is instant context loss.
 *
 * Loading discipline, in the order it matters:
 *   1. Nothing 3D on first paint. The stage shows `part-g`'s poster; the
 *      canvas, three.js and the first GLB are all fetched on approach.
 *   2. Fetch on *dwell*, never on hover-start.
 *   3. `MODEL_PRIORITY.intent` for speculative warms, `hero` for the part
 *      actually on stage, and the queue's concurrency cap of 2 keeps two
 *      meshopt decodes from landing in one frame.
 *
 * Degraded paths are the same page. Without WebGL `<SceneSlot>` keeps
 * rendering the poster and the caption, and every part remains reachable
 * through its tile link. Under `prefers-reduced-motion` the part is posed
 * from scroll rather than animated, the handoff is a cut rather than a
 * travel, and no content is behind a transition that never fires.
 */
export default function RendersShowroom() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progress = useScrollProgress(sectionRef, {
    start: 'top bottom',
    end: 'bottom top',
  });

  // `displayed` is what the stage is drawing; `target` is where the visitor
  // has pointed. They differ only for the length of a handoff.
  const [displayed, setDisplayed] = useState(DEFAULT_SLUG);
  const [exiting, setExiting] = useState(false);

  const dwellTimer = useRef<number | undefined>(undefined);
  const swapTimer = useRef<number | undefined>(undefined);

  /**
   * Commit a part to the stage.
   *
   * The two-step timing lives here, in an event handler, rather than in an
   * effect watching `target`: React 19's `set-state-in-effect` rule aside,
   * the swap has to land *while the outgoing part is off-frame*, and that is
   * a schedule, not a derivation. `HANDOFF_MS` is the travel-out leg; the
   * scene damps the incoming part in from the far side on its own.
   */
  const commit = useCallback(
    (slug: string) => {
      if (slug === displayed || !getRenderBySlug(slug)) return;

      window.clearTimeout(swapTimer.current);

      // Reduced motion: no travel, so no window to hide the swap in. Cut.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayed(slug);
        return;
      }

      setExiting(true);
      swapTimer.current = window.setTimeout(() => {
        setDisplayed(slug);
        setExiting(false);
      }, HANDOFF_MS);
    },
    [displayed],
  );

  const handleIntent = useCallback(
    (slug: string) => {
      window.clearTimeout(dwellTimer.current);
      dwellTimer.current = window.setTimeout(() => {
        const render = getRenderBySlug(slug);
        if (render) preloadModel(render.model, MODEL_PRIORITY.intent);
        commit(slug);
      }, DWELL_MS);
    },
    [commit],
  );

  const handleIntentEnd = useCallback(() => {
    // Only the *pending* dwell is cancelled. A part that made it to the stage
    // stays there — snapping back to the default the moment the pointer
    // leaves would make the stage flicker across a grid traverse.
    window.clearTimeout(dwellTimer.current);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(dwellTimer.current);
      window.clearTimeout(swapTimer.current);
    },
    [],
  );

  const render = getRenderBySlug(displayed) ?? RENDERS[0];
  const { active: loading, progress: loadProgress } = useModelProgress([render.model]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="catalogue-heading"
      className="section-y relative"
    >
      <div className="mx-auto max-w-page page-x">
        <header className="relative z-10 max-w-2xl">
          <Eyebrow>The catalogue</Eyebrow>
          <h2 id="catalogue-heading" className="type-display-l mt-6">
            Nine parts, one stage.
          </h2>
          <p className="type-lede mt-6">
            Point at a tile and the part moves onto the stage. Open it for the
            full viewer and the STL.
          </p>
        </header>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* ---- Stage ------------------------------------------------- */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)]">
              {/* The box the shared canvas is scissored to. No border, no
                  radius, no shadow — §6.10. Sized in `svh` rather than `vh`
                  so a mobile URL-bar resize does not restate the height. */}
              <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-[58svh]">
                <SceneSlot
                  accessibleName={`${render.productName}, a forged part turning slowly on a dark stage`}
                  description={render.blurb}
                  className="h-full w-full"
                  // Half a screen of warning is enough to hide the GLB fetch
                  // and the three.js chunk behind the scroll.
                  approachMargin="700px 0px"
                  onApproach={() => preloadModel(render.model, MODEL_PRIORITY.hero)}
                  fallback={
                    // The still is rendered from this exact rig, so when the
                    // canvas does come up it replaces the poster with the
                    // same picture. `contain`, because the stage is wider
                    // than the square master and cropping would clip a part.
                    <PartPoster
                      model={render.model}
                      alt={`${render.productName} — render of the forged part`}
                      fit="contain"
                      priority
                    />
                  }
                >
                  <StageScene
                    modelUrl={render.model}
                    exiting={exiting}
                    progress={progress}
                  />
                </SceneSlot>

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[2]"
                  style={{ background: VIGNETTE }}
                />

                {/* Real byte progress, not a spinner (§6.16). `bg-graphite/70`
                    is a legibility scrim over the stage — the one place blur
                    is allowed on this site (§6.2) — and saffron on it stays
                    above 7:1. */}
                {loading && (
                  <p
                    role="status"
                    className="type-eyebrow absolute bottom-4 left-1/2 z-[3] -translate-x-1/2 bg-graphite/70 px-4 py-2 backdrop-blur"
                  >
                    Loading {Math.round(loadProgress * 100)}%
                  </p>
                )}
              </div>

              {/* Caption. Keyed so it re-enters on `press` when the part
                  lands — a keyed `motion.div`, never `AnimatePresence`,
                  which on framer-motion 12 + React 19 never unmounts. */}
              <motion.div
                key={render.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 mt-8 max-w-xl"
              >
                <p className="type-eyebrow">{render.title}</p>
                <h3 className="type-display-m mt-3">{render.productName}</h3>
                <p className="type-body mt-4">{render.blurb}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {render.tags.map((tag) => (
                    <li
                      key={tag}
                      className="type-meta border border-cinder px-2.5 py-1 uppercase tracking-[0.16em]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>

          {/* ---- Grid -------------------------------------------------- */}
          {/* `z-10`: the shared canvas is a fixed layer at z-index 1, so any
              DOM that must read on top of the 3D needs its own stacking
              context above it. */}
          <div className="relative z-10 lg:col-span-5">
            <RendersGrid
              renders={RENDERS}
              activeSlug={displayed}
              onIntent={handleIntent}
              onIntentEnd={handleIntentEnd}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
