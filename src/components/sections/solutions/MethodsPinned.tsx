'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import {
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useModelProgress,
} from '@/components/three3';
import PartPoster from '@/components/three/PartPoster';
import { FORGING_METHODS, type ForgingMethod } from '@/data/solutions';
import MethodIllustration from './MethodIllustration';
import {
  METHOD_SHOTS,
  PANEL_COUNT,
  PANEL_SCROLL_VH,
  type MethodShot,
} from './methodShots';

/**
 * MethodsPinned — the `/solutions` act (§5.4).
 *
 * Four forging methods, four camera moves, one canvas. The stage pins for
 * `PANEL_SCROLL_VH` viewport heights per panel while the copy column
 * advances through the four methods and the 3D stage HANDOFFs each sample
 * part along a travel axis.
 *
 * THE BUG THIS SECTION SHIPPED ONCE
 * ---------------------------------
 * In v2 this component wrapped itself in a `<PinnedSection>` whose shell is
 * `h-screen overflow-hidden`. Under `prefers-reduced-motion: reduce` that
 * component correctly skips the pin — but the crossfade below keys off a
 * scroll progress which then never leaves 0, so methods 02–04 sat at
 * `opacity-0`, `aria-hidden`, clipped out of a viewport-height box. Three
 * quarters of the page was silently unreachable.
 *
 * The fix is not "freeze the animation", it is a genuinely different tree:
 * `<MethodsStacked>` has no pin, no crossfade, no clipping box, no canvas
 * and no scroll dependency at all. Four `<article>`s in document order.
 * §7's acceptance check is to toggle the media query and count them.
 *
 * The reduced-motion path also mounts no `<SceneSlot>`, which means the
 * WebGL context is never created and three.js is never fetched for those
 * visitors — the fallback is not a downgrade, it is a smaller page.
 */

/**
 * `useLayoutEffect` is load-bearing here, not a preference: ScrollTrigger's
 * pin reparents the DOM node it pins, and tearing that down in a passive
 * effect races React's own `removeChild` on SPA navigation — which crashed
 * this project once already. The isomorphic guard is only to keep React
 * quiet during the static export, where layout effects never run anyway.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Loaded on approach. Importing this eagerly would put three.js in the page chunk. */
const MethodsScene = dynamicScene(() => import('./MethodsScene'));

/**
 * §3.6 — depth comes from a CSS vignette over the stage, never from a
 * different clear colour or a rounded, bordered "3D widget" box. It sits
 * over the fallback image too, so the poster and the live canvas are lit
 * the same way and the fade between them is invisible.
 */
const VIGNETTE =
  'radial-gradient(ellipse at 50% 45%, transparent 40%, #1F2124CC 100%)';

export default function MethodsPinned() {
  const reduced = useReducedMotion();
  return reduced ? <MethodsStacked /> : <MethodsAct />;
}

/* -------------------------------------------------------------------------- */
/*  Shared panel content                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One method's copy. Identical in both trees — the two variants drifting
 * apart is how the v2 pass ended up with different headings on the same
 * content, so there is exactly one implementation.
 */
function MethodCopy({ method }: { method: ForgingMethod }) {
  return (
    <>
      {/* Semantic inks, not concrete tokens, throughout this block. A method's
          number, spec and body are exactly the "cold technical information"
          §2.3 says a paper card is for, so this is the content most likely to
          end up inside one — and `--color-ink-*` re-points itself in that
          subtree with no branch here. `text-ink-accent` is saffron on
          graphite (7.57:1) and ember on a sheet (5.42:1); `text-ink-body` is
          swarf (6.19:1) and steel (7.07:1). Both grounds clear AA. */}
      <p className="type-display-m tabular-nums text-ink-accent">
        {method.number}
        <span className="type-meta ml-3 align-middle tracking-[0.26em] text-ink-body">
          of {String(PANEL_COUNT).padStart(2, '0')}
        </span>
      </p>

      {/* h2, not h3: these four are the page's content sections, siblings of
          nothing else. Same level in both trees. */}
      <h2 className="type-display-l mt-5">{method.title}</h2>

      {/* peach, deliberately, and the one place this block names a concrete
          token: §2.2 gives peach to "heat-adjacent numerals" and it measures
          9.79:1 on graphite — the brightest warm available, which is what
          separates the spec line from the saffron numeral above it instead of
          giving the panel two identical oranges. It is dark-only; if this
          block ever moves inside a paper card, this is the one line to
          change. */}
      <p className="type-spec mt-4 text-peach">{method.spec}</p>

      {/* 68ch, not `max-w-lg`: between 640 and 767px the old fixed widths
          let this run to ~84ch, well past the 65–75ch measure. */}
      <p className="type-lede mt-6 max-w-[68ch] text-pretty">{method.body}</p>
    </>
  );
}

/** The sample-part credit that sits under (or beside) the stage. */
function SampleCaption({
  method,
  className,
}: {
  method: ForgingMethod;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="type-eyebrow">Sample part</p>
      <p className="type-display-s mt-2">{method.sampleName}</p>
    </div>
  );
}

function MethodCta({ method }: { method: ForgingMethod }) {
  return (
    <Link
      href="/contact/"
      data-magnetic
      // min-h-11 = the 44px tap-target floor; 12px type with 12px padding
      // lands short of it on its own.
      className="type-eyebrow mt-8 inline-flex min-h-11 items-center justify-center border border-cinder px-6 py-3 transition-colors duration-200 hover:border-mesh hover:text-mesh"
    >
      {`Discuss a ${method.shortLabel} project →`}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Full-motion tree: the pinned act                                          */
/* -------------------------------------------------------------------------- */

function MethodsAct() {
  const outerRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);

  /**
   * Scroll progress across the whole act, as a ref. This is the bridge into
   * the frame loop: `setState` here would reconcile the R3F subtree on every
   * scroll frame at 120 Hz.
   */
  const progress = useRef(0);

  // The one thing that DOES need React: which panel owns the stage. It
  // changes four times across ~560vh of scroll and it drives `inert`,
  // `aria-current`, the crossfade classes and the geometry the scene loads.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const pin = pinRef.current;
    if (!outer || !pin) return;

    const ctx = gsap.context(() => {
      // A proxy tween rather than a bare `ScrollTrigger.create`, because
      // `scrub` smooths a linked ANIMATION's playhead — a trigger with no
      // animation would hand back raw, unsmoothed `self.progress` and the
      // 0.8 in the config would be decoration. §4.2 bans `scrub: true`
      // outright: instant tracking is weightless, and this site is about
      // 4000 tonnes.
      const proxy = { p: 0 };

      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => {
          progress.current = proxy.p;
          const next = Math.min(
            PANEL_COUNT - 1,
            Math.floor(proxy.p * PANEL_COUNT),
          );
          if (next !== activeIndexRef.current) {
            activeIndexRef.current = next;
            setActiveIndex(next);
          }
        },
        scrollTrigger: {
          trigger: outer,
          start: 'top top',
          // §5.4: '+=140%' per panel. `svh`-equivalent via innerHeight,
          // recomputed on refresh so a mobile URL-bar resize re-measures
          // instead of leaving the pin short.
          end: () =>
            `+=${window.innerHeight * PANEL_SCROLL_VH * PANEL_COUNT}`,
          pin,
          pinSpacing: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, outer);

    // Repo landmine: a pin that mounts after its neighbours have already
    // measured leaves the trigger order stale, and the section above ends up
    // computing its end position against a page height that has since grown
    // by 560vh. Debounced so a burst of mounts costs one refresh, not five.
    const settle = window.setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 120);

    return () => {
      window.clearTimeout(settle);
      ctx.revert();
    };
  }, []);

  const shot: MethodShot = METHOD_SHOTS[activeIndex];
  const method = FORGING_METHODS[activeIndex];

  // Warm the NEXT part while the current one is on screen. A panel is ~140vh
  // of scroll away, which is more than enough to hide a 1 MB fetch — and
  // `intent` keeps it behind anything the visitor is actually looking at.
  useEffect(() => {
    const next = METHOD_SHOTS[activeIndex + 1];
    if (next) preloadModel(next.modelUrl, MODEL_PRIORITY.intent);
  }, [activeIndex]);

  const onApproach = useCallback(() => {
    preloadModel(METHOD_SHOTS[0].modelUrl, MODEL_PRIORITY.approaching);
  }, []);

  return (
    /* No background: `Scene3DProvider`'s canvas is a fixed layer at z-index 1,
       so an opaque section background would paint the 3D out of existence.
       The graphite ground comes from html/body. */
    <section
      ref={outerRef}
      aria-labelledby="methods-heading"
      className="relative"
    >
      {/* The act's own heading. Visually hidden because the four method
          titles below ARE the visible headings and a fifth one would fight
          them — but it has to exist, or those four h2s hang off whatever
          heading the hero left behind. */}
      <h2 id="methods-heading" className="sr-only">
        Four forging methods
      </h2>

      <div ref={pinRef} className="h-[100svh] w-full">
        <div className="page-x mx-auto grid h-full max-w-page grid-cols-1 content-center gap-8 md:grid-cols-12 md:items-center md:gap-12">
          {/* ---- Stage ---- */}
          {/* 58svh rather than a full-height column: `fov` is vertical, so a
              very tall, narrow stage forces the camera a long way back just
              to keep the part inside the horizontal frustum, and the part
              ends up small in a lot of empty space. */}
          <div className="relative md:col-span-5 md:h-[58svh]">
            <Stage
              shot={shot}
              method={method}
              activeIndex={activeIndex}
              progress={progress}
              onApproach={onApproach}
            />
          </div>

          {/* ---- Copy ---- */}
          {/* `relative z-10` for the same reason as the vignette: the canvas
              layer sits at z-index 1 and copy has to out-rank it. */}
          <div className="relative z-10 md:col-span-6 md:col-start-7">
            <div className="relative min-h-[380px] md:min-h-[440px]">
              {FORGING_METHODS.map((m, i) => (
                <article
                  key={m.number}
                  // `inert`, not just `pointer-events-none`: each panel holds
                  // a link, and pointer-events does nothing to Tab. Without
                  // this, keyboard users walked into three transparent
                  // panels.
                  inert={i !== activeIndex}
                  aria-hidden={i !== activeIndex}
                  className={cn(
                    // 480ms / `press` — §4.2's component band. No `back`,
                    // no overshoot: 4000 tonnes do not bounce.
                    'transition-[opacity,transform] duration-[480ms] [transition-timing-function:cubic-bezier(0.16,1,0.30,1)]',
                    i === activeIndex
                      ? 'relative translate-y-0 opacity-100'
                      : 'absolute inset-0 translate-y-4 opacity-0',
                  )}
                >
                  <MethodCopy method={m} />
                  <SampleCaption method={m} className="mt-8 md:hidden" />
                  <MethodCta method={m} />
                </article>
              ))}
            </div>

            <MethodRail activeIndex={activeIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage                                                                     */
/* -------------------------------------------------------------------------- */

function Stage({
  shot,
  method,
  activeIndex,
  progress,
  onApproach,
}: {
  shot: MethodShot;
  method: ForgingMethod;
  activeIndex: number;
  progress: React.RefObject<number>;
  onApproach: () => void;
}) {
  // Real byte progress, not a spinner (§6.16). Only shown while the active
  // part is actually in flight, which after the first panel is usually never
  // — the next model is warmed a full panel ahead.
  const { active, progress: bytes } = useModelProgress([shot.modelUrl]);

  return (
    <>
      <SceneSlot
        accessibleName={`${method.sampleName} — a forged part shown as ${method.title.toLowerCase()} is explained`}
        description={shot.describe}
        className="h-[34svh] w-full md:h-full"
        onApproach={onApproach}
        fallback={
          // The poster twin of this exact part (§5.9): a real render, on the
          // same graphite ground, so a no-WebGL visitor gets the part rather
          // than an empty box — and so the canvas fading in over it is a
          // change of state, not a change of medium.
          // `contain` because the stage is much taller than it is wide and a
          // crop would cut the part; the render's background IS the page
          // ground, so there is no letterbox to see.
          <PartPoster
            model={shot.modelUrl}
            alt={`${method.sampleName} — a forged part made by ${method.title.toLowerCase()}`}
            fit="contain"
            className="h-full w-full"
          />
        }
      >
        <MethodsScene progress={progress} activeIndex={activeIndex} />
      </SceneSlot>

      {/* §3.6 — no border, no radius, no shadow. Depth is this and nothing
          else.
          `z-10` is not cosmetic: the shared canvas is a fixed layer at
          z-index 1, so anything that must read ON TOP of the render — this
          vignette, the caption below — has to out-rank it explicitly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: VIGNETTE }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4">
        <SampleCaption method={method} className="hidden md:block" />
        {active && (
          <p className="type-meta tabular-nums bg-graphite/70 px-2 py-1 text-saffron">
            {Math.round(bytes * 100)}%
          </p>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step rail                                                                 */
/* -------------------------------------------------------------------------- */

function MethodRail({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="mt-10 flex gap-4">
      {FORGING_METHODS.map((m, i) => (
        <li
          key={m.number}
          className="flex flex-1 flex-col gap-2"
          // A token, not a boolean — `aria-current` takes one, and "step"
          // is what this rail actually marks.
          aria-current={i === activeIndex ? 'step' : undefined}
        >
          <span
            aria-hidden
            className={cn(
              'h-px w-full transition-colors duration-500',
              i <= activeIndex ? 'bg-saffron' : 'bg-cinder',
            )}
          />
          <span
            className={cn(
              'type-meta transition-colors duration-200',
              // swarf (6.19:1), never cinder or ash: at 12px these are the
              // only place the other three method names appear while the act
              // is pinned, so they are content, not decoration.
              i === activeIndex ? 'text-ink' : 'text-ink-body',
            )}
          >
            {m.shortLabel}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reduced-motion tree: four stacked panels                                  */
/* -------------------------------------------------------------------------- */

/**
 * All four methods as ordinary page content. No pin, no crossfade, no
 * viewport-height box, no canvas, no scroll dependency — nothing here can
 * be hidden by an animation that did not run.
 *
 * Each illustration is held at its FINISHED frame via `staticIndex`, so the
 * drawings read as completed operations (hammer down, ring grown) rather
 * than frame 0 of something that never started.
 */
function MethodsStacked() {
  return (
    <section aria-labelledby="methods-heading">
      <h2 id="methods-heading" className="sr-only">
        Four forging methods
      </h2>

      <ol className="page-x section-y mx-auto max-w-page">
        {FORGING_METHODS.map((m, i) => (
          <li
            key={m.number}
            className="grid grid-cols-1 items-center gap-10 border-t border-cinder py-16 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-12 md:gap-12 md:py-20"
          >
            <div className="md:col-span-5">
              {/* The method's own schematic carries the panel, because the
                  panel is about the OPERATION — a die closing, a ring
                  growing. `progress` is ignored whenever `staticIndex` is
                  set, which holds each drawing at its finished frame rather
                  than at frame 0 of an animation that never ran. */}
              <MethodIllustration
                progress={0}
                staticIndex={i}
                className="mx-auto"
              />
              <div className="mt-6 flex items-center gap-4">
                {/* 6 KB of real render, so `sampleName` is a thing you can
                    see and not just a string.
                    Sized by this wrapper, not by a class on `PartPoster`:
                    `cn` is a plain join with no tailwind-merge, so the
                    component's own `h-full w-full` and an `h-20 w-20` passed
                    in both survive into the class list and CSS source order
                    decides the winner — which it did, at 180px. */}
                <div className="h-20 w-20 shrink-0">
                  <PartPoster model={METHOD_SHOTS[i].modelUrl} fit="cover" />
                </div>
                <SampleCaption method={m} />
              </div>
            </div>
            <article className="md:col-span-6 md:col-start-7">
              <MethodCopy method={m} />
              <MethodCta method={m} />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
