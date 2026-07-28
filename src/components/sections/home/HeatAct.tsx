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
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';
import SplitText from '@/components/motion/SplitText';
import {
  MODELS,
  MODEL_PRIORITY,
  SceneSlot,
  dynamicScene,
  preloadModel,
  useModelProgress,
  useScene3D,
} from '@/components/three3';
import { HAMMER_INTRO_WORDS, HERO_COPY } from '@/data/home';
import { useFrameSequence } from './useFrameSequence';

/**
 * The home act — beats 0 through 3 of §5.1, and the only pinned section on
 * the page.
 *
 * The concept in one component: the site is one heat. The visitor lands on a
 * cold forging in a dark shop (beat 0, the pin's own resting state); scroll
 * puts it in the furnace (beat 1); the ram falls (beat 2, real footage);
 * the part comes back struck and cooling (beat 3). Heat is a position on a
 * timeline and it only ever falls afterwards.
 *
 * Why the hero and the act are ONE section
 * ----------------------------------------
 * §5.1 gives `/` one canvas, one pinned act and one part. Splitting the hero
 * off would mean either a second 3D slot showing the same part (which then
 * has to match pose across a section boundary, and jumps if it does not) or
 * a hero with no part in it at all. Making the hero the pin's progress-zero
 * state gives the page a single continuous camera, and it is why the h1 can
 * hand over to `HAMMER_INTRO_WORDS` in the same visual slot.
 *
 * Layer order inside the section, and why it is not obvious: the shared WebGL
 * canvas is a `position: fixed` sibling at `z-index: 1` (see
 * `Scene3DProvider`), so anything of ours that must read *over* the 3D needs
 * its own z-index above that, and the `<SceneSlot>` box itself — which is
 * only a tracking rectangle plus the no-WebGL fallback — deliberately stays
 * below it.
 */

/* -------------------------------------------------------------------------- */
/*  Assets + timing                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The strike beat is real footage of a real power hammer, not a render, and
 * it costs nothing new: the sequence already ships for v2. 108 frames,
 * 2.08 MB at the 960 tier / 1.16 MB at 640. Per MEDIA_MANIFEST the four
 * spark-burst impacts land at frames 28, 53, 76 and 100.
 */
const HAMMER_FRAMES = 108;
const hammerFrame = (dir: 960 | 640) => (i: number) =>
  `/assets/frames/hammer/${dir}/f-${String(i + 1).padStart(3, '0')}.webp`;
const hammerSrc = hammerFrame(960);
const hammerSrcMobile = hammerFrame(640);

/**
 * The hero still.
 *
 * `public/assets/posters/part-g.*` is an offline render of this exact part
 * through the same `<ForgeStage>` rig the canvas mounts, which is what §3.6
 * asks for: poster and canvas are the same picture, so the hand-off between
 * them is invisible rather than a pop. 6.5 KB WebP / 3.9 KB AVIF.
 *
 * This is not a degraded-path asset. `Scene3DProvider` starts at `probing`
 * on the server and pre-hydration, so the slot's fallback is what ships in
 * the exported HTML: it is what a crawler indexes, what a no-JS visitor
 * reads, and what every visitor sees before hydration.
 */
const POSTER = '/assets/posters/part-g.webp';
const POSTER_AVIF = '/assets/posters/part-g.avif';
const POSTER_ALT =
  'The Forged Sprocket — a closed-die forging in dark grey steel, lit from ' +
  'behind by the forge.';

/**
 * Where the footage covers the canvas. Kept in step with `BEATS` in
 * `homeStage.tsx`: the part stops drawing at 0.34 and resumes at 0.64, so
 * the layer must be fully opaque across exactly that span or the part pops
 * in and out at the seam.
 */
const FOOTAGE_IN = 0.28;
const FOOTAGE_FULL = 0.34;
const FOOTAGE_OUT_START = 0.64;
const FOOTAGE_OUT_END = 0.7;

/** Past this the hero copy is gone; its CTAs go inert at the same point. */
const HERO_FADE_END = 0.1;

/**
 * Triangular opacity window: 0 → 1 across [start, peak], 1 → 0 across
 * [peak, end]. The three beat words cross-fade through these rather than
 * cutting, so no two are ever legible at once.
 */
function windowOpacity(p: number, start: number, peak: number, end: number) {
  if (p <= start || p >= end) return 0;
  if (p < peak) return (p - start) / (peak - start);
  return 1 - (p - peak) / (end - peak);
}

/** Heat · Strike · Forge, keyed to the beats they narrate. */
const WORD_WINDOWS: Array<[start: number, peak: number, end: number]> = [
  [0.09, 0.2, 0.33],
  [0.36, 0.49, 0.62],
  // Forge holds to the end of the act — the pin releases on a visible word.
  [0.68, 0.82, Number.POSITIVE_INFINITY],
];

const ramp = (p: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (p - from) / (to - from)));

/** The 3D scene body. Held by reference only — three.js is fetched on arm. */
const HeatActScene = dynamicScene(() => import('./HeatActScene'));

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The act's text equivalent. A `<canvas>` exposes nothing at all to
 * assistive tech, and `aria-label` on a bare `<div>` is ignored — ARIA does
 * not let a generic element take a name from the author. A real heading is
 * the only thing that keeps this full-viewport section out of the reading
 * order's blind spot, and it keeps h1 → h2 sequential.
 */
function ActHeading() {
  return (
    <h2 className="sr-only">
      Heat. Strike. Forge. — one forged sprocket goes into the furnace, is
      struck by a power hammer, and comes back cooling.
    </h2>
  );
}

const SCENE_DESCRIPTION =
  'A forged sprocket in dark grey mill scale turns slowly on a dark stage. ' +
  'It brightens from within as it heats, is struck, and then cools back to ' +
  'cold steel as it turns to show its teeth.';

/**
 * Poster + prose. It is the pre-hydration and no-WebGL state, and it is laid
 * out to land where the live part lands — right of the headline on a
 * landscape viewport, centred on a portrait one, at about the size the
 * canvas draws it — so the swap to the canvas moves nothing.
 */
function HeatStill({ withCaption = false }: { withCaption?: boolean }) {
  return (
    <figure className="absolute inset-0 m-0 flex items-center justify-center">
      <picture>
        <source srcSet={POSTER_AVIF} type="image/avif" />
        {/* Sized and placed to land where the canvas draws the part — right
            of the headline on landscape, centred on portrait — so the swap
            from still to canvas moves nothing. The percentages track
            `OFFSET_X` / `OFFSET_Y` and the 0.62 group scale in
            `HeatActScene`; change them together. */}
        <img
          src={POSTER}
          alt={POSTER_ALT}
          width={1000}
          height={1000}
          fetchPriority="high"
          decoding="async"
          className="w-[78%] max-w-[420px] lg:absolute lg:right-[1%] lg:top-[59%] lg:w-[53%] lg:max-w-[720px] lg:-translate-y-1/2"
        />
      </picture>
      {withCaption ? (
        <figcaption className="sr-only">{SCENE_DESCRIPTION}</figcaption>
      ) : null}
    </figure>
  );
}

/** §3.6 — depth comes from a CSS vignette over the canvas, never from a
 *  different clear colour and never from a border on the 3D box. */
function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        background:
          'radial-gradient(ellipse at 50% 45%, transparent 40%, #1F2124CC 100%)',
      }}
    />
  );
}

function HeroCta({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-start gap-4 sm:flex-row ${
        compact ? 'mt-8' : 'mt-10'
      }`}
    >
      <Link
        href={HERO_COPY.primaryCta.href}
        data-magnetic
        className="inline-flex min-h-11 items-center justify-center bg-saffron px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
      >
        {HERO_COPY.primaryCta.label}
      </Link>
      <Link
        href={HERO_COPY.secondaryCta.href}
        data-magnetic
        className="inline-flex min-h-11 items-center justify-center border border-cinder px-7 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.26em] text-paper transition-colors hover:border-saffron hover:text-saffron"
      >
        {HERO_COPY.secondaryCta.label}
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reduced motion — a different tree, not a frozen one                       */
/* -------------------------------------------------------------------------- */

/**
 * Every beat, in document order, as stacked static sections (§4.5).
 *
 * This is deliberately not "the same markup with the animation switched
 * off": the v2 pass shipped two bugs where reduced-motion visitors lost
 * content because a section stayed at `opacity: 0` waiting for a
 * ScrollTrigger that never fired. Nothing here depends on scroll, nothing
 * is transparent, nothing is clipped, and the beat copy that only existed
 * inside the scrub is promoted to real prose.
 */
function HeatActStatic() {
  const beats = [
    {
      word: HAMMER_INTRO_WORDS[0],
      frame: 14,
      caption:
        'The billet goes into the furnace. It leaves at forging temperature, bright enough to light the shop around it.',
      alt: 'A steel bar glowing orange as it is drawn from the furnace on the Malur floor.',
    },
    {
      word: HAMMER_INTRO_WORDS[1],
      frame: 53,
      caption:
        'The ram falls. Ommi Forge runs eight power hammers; this is the moment all of them exist for.',
      alt: 'A power hammer striking a glowing steel bar, sparks bursting from the die.',
    },
    {
      word: HAMMER_INTRO_WORDS[2],
      frame: 100,
      caption:
        'The part is formed and already cooling. From here it is inspected, machined and shipped — the same forging, one heat later.',
      alt: 'The struck bar resting on the anvil, its glow fading as it cools.',
    },
  ];

  return (
    <section className="relative w-full">
      <div className="mx-auto max-w-page page-x section-y">
        <Eyebrow>{HERO_COPY.eyebrow}</Eyebrow>
        <h1 className="type-display-xl mt-8 max-w-[15ch]">
          {HERO_COPY.headlineLine1}
          <span className="block">{HERO_COPY.headlineLine2}</span>
        </h1>
        <p className="type-lede mt-8 max-w-[46ch]">{HERO_COPY.subhead}</p>
        <HeroCta />
      </div>

      <div className="mx-auto max-w-page page-x pb-[clamp(96px,11vw,144px)]">
        <ActHeading />
        <ol className="grid gap-16">
          {beats.map((beat) => (
            <li key={beat.word}>
              {/* A <picture>, not `next/image`: `images.unoptimized: true`
                  is forced by `output: 'export'`, so next/image is a
                  passthrough here and the media split is the only thing that
                  actually saves a phone the desktop encode. */}
              <picture>
                <source
                  media="(min-width: 1024px)"
                  srcSet={hammerFrame(960)(beat.frame)}
                />
                <img
                  src={hammerFrame(640)(beat.frame)}
                  alt={beat.alt}
                  width={960}
                  height={540}
                  loading="lazy"
                  decoding="async"
                  className="block w-full"
                />
              </picture>
              <p className="type-display-l mt-8">{beat.word}.</p>
              <p className="type-body mt-4 max-w-[62ch]">{beat.caption}</p>
            </li>
          ))}
        </ol>
        <p className="type-body mt-16 max-w-[62ch]">{SCENE_DESCRIPTION}</p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  The act                                                                   */
/* -------------------------------------------------------------------------- */

function HeatActScrub() {
  const section = useRef<HTMLElement>(null);
  const heroCopy = useRef<HTMLDivElement>(null);
  const ctaRow = useRef<HTMLDivElement>(null);
  const footage = useRef<HTMLDivElement>(null);
  const hammerCanvas = useRef<HTMLCanvasElement>(null);
  const words = useRef<Array<HTMLSpanElement | null>>([null, null, null]);

  /** Act progress, shared with the scene across the canvas tunnel. */
  const progress = useRef(0);

  const { webgl } = useScene3D();
  const model = useModelProgress([MODELS.g.url]);
  const partReady = model.progress >= 1;

  // The footage is the single heaviest asset on the route. It stays
  // unrequested until the visitor has committed to the act — measured from
  // their own scrolling, not from a timer, so a visitor who lands and leaves
  // never pays for it.
  const [footageArmed, setFootageArmed] = useState(false);
  const drawFrame = useFrameSequence({
    canvasRef: hammerCanvas,
    count: HAMMER_FRAMES,
    src: hammerSrc,
    srcMobile: hammerSrcMobile,
    enabled: footageArmed,
  });

  const warmPart = useCallback(() => {
    preloadModel(MODELS.g.url, MODEL_PRIORITY.hero);
  }, []);

  /** Everything the act writes per scroll frame. Refs and inline styles
   *  only — a `setState` here would reconcile the page on every tick. */
  const render = useCallback(
    (p: number) => {
      progress.current = p;

      const copy = heroCopy.current;
      if (copy) copy.style.opacity = String(1 - ramp(p, 0, HERO_FADE_END));

      // Transparent links are still tabbable, which is how a keyboard user
      // ends up focusing a control they cannot see. `inert` removes them
      // from the tab order without touching the h1, which stays in the
      // heading outline at every scroll position.
      const cta = ctaRow.current;
      if (cta) {
        const gone = p > HERO_FADE_END;
        if (cta.inert !== gone) cta.inert = gone;
        cta.style.pointerEvents = gone ? 'none' : '';
      }

      for (let i = 0; i < words.current.length; i += 1) {
        const node = words.current[i];
        if (!node) continue;
        const [start, peak, end] = WORD_WINDOWS[i];
        const o = windowOpacity(p, start, peak, end);
        node.style.opacity = String(o);
        // Arrives on `press` — it travels a short distance and settles. No
        // overshoot: 4000 tonnes do not spring.
        node.style.transform = `translateY(${(1 - o) * 24}px)`;
      }

      const layer = footage.current;
      if (layer) {
        const o =
          p < FOOTAGE_FULL
            ? ramp(p, FOOTAGE_IN, FOOTAGE_FULL)
            : 1 - ramp(p, FOOTAGE_OUT_START, FOOTAGE_OUT_END);
        layer.style.opacity = String(o);
        // `visibility` rather than unmounting: the canvas keeps its decoded
        // frames and its backing-store size across the whole act.
        layer.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
      }

      if (p > 0.015 && !footageArmed) setFootageArmed(true);
      drawFrame.current(
        (p - FOOTAGE_FULL) / (FOOTAGE_OUT_START - FOOTAGE_FULL),
      );
    },
    [drawFrame, footageArmed],
  );

  const renderRef = useRef(render);
  useEffect(() => {
    renderRef.current = render;
  }, [render]);

  /**
   * The pin.
   *
   * `useLayoutEffect` is load-bearing, not stylistic: pinning reparents the
   * section into a GSAP `.pin-spacer`, and React's own `removeChild` on
   * route change then targets a node whose parent has silently changed and
   * throws `NotFoundError`, unmounting the app to the router's error screen.
   * Layout-effect cleanups run in the mutation phase, before React detaches
   * the DOM; passive cleanups run after, which is too late.
   *
   * The scrub rides a dummy tween rather than a bare `ScrollTrigger.create`
   * because `scrub` only smooths an *animation*; on a bare trigger it is
   * silently ignored and the act tracks the scroll instantly, which reads as
   * weightless. `scrub: 1.2` is §4.2's value for this act.
   */
  useLayoutEffect(() => {
    const el = section.current;
    if (!el) return;

    const state = { p: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: '+=200%',
        pin: true,
        pinSpacing: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
        // A refresh (font load, resize, a lazy section changing the page
        // height) can move the section without a scroll event; re-seed so
        // the act never poses from a stale value.
        onRefresh: () => renderRef.current(state.p),
      },
    });
    tl.to(state, {
      p: 1,
      duration: 1,
      ease: 'none',
      onUpdate: () => renderRef.current(state.p),
    });

    // This pin just added a spacer to the document flow. Triggers created
    // before it — anything below on the page — are now measured short by the
    // spacer height. `sort()` first, because `refresh()` processes triggers
    // in creation order and lazily-mounted scrubs come after page-load ones.
    const refresh = window.setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 200);

    renderRef.current(0);

    return () => {
      window.clearTimeout(refresh);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  /** Headline entrance — GSAP preset #9 retuned to §4.1: flat y + opacity on
   *  `press`, no `rotateX`, no overshoot, and only ever on an h1. */
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll(
        '[data-hero-headline] [data-char], [data-hero-headline] [data-word]',
      );
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from(chars, { y: 28, opacity: 0, duration: 0.9, stagger: 0.015 })
        .from(
          '[data-hero-sub]',
          { y: 16, opacity: 0, duration: 0.6 },
          '-=0.45',
        );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={section}
      // Full-bleed under the fixed header: `<main>` pads itself down by the
      // header height, and the act cancels exactly that. `100svh`, not
      // `100vh` — a mobile URL bar resizing the viewport would otherwise
      // retrigger `ScrollTrigger.refresh()` and jump the pin.
      style={{ marginTop: 'calc(-1 * var(--header-h))' }}
      className="relative h-[100svh] w-full overflow-hidden"
    >
      {/*
        The poster. It is the first paint of the page and it never moves, so
        it can be the LCP element without costing a layout shift; the canvas
        comes up over it and it fades out only once the part has actually
        drawn (§3.6). Mounted only when WebGL is live — otherwise the slot's
        own fallback is showing this same image and this would stack a
        duplicate on top of it.
      */}
      {webgl === 'ok' ? (
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-[400ms] ease-out"
          style={{ opacity: partReady ? 0 : 1 }}
        >
          <HeatStill />
        </div>
      ) : null}

      {/*
        The slot needs a wrapper to be full-bleed. `<SceneSlot>` hard-codes
        `position: relative` on its own box and merges `className` after it —
        and Tailwind emits `.relative` after `.absolute`, so passing
        `absolute inset-0` here loses: the box stays in flow, collapses to
        zero height, and drei's `<View>` scissors the canvas to a 0px
        rectangle. The draw call still happens and `gl.info` still counts the
        triangles, which is what makes it look like a shading bug rather than
        a layout one. Size the slot, position the wrapper.
      */}
      <div className="absolute inset-0">
        <SceneSlot
          accessibleName="Forged sprocket heating, struck and cooling on a dark stage"
          description={SCENE_DESCRIPTION}
          className="h-full w-full"
          onApproach={warmPart}
          fallback={<HeatStill withCaption />}
        >
          <HeatActScene progress={progress} />
        </SceneSlot>
      </div>

      {/* Beat 2. Above the shared canvas (z-index 1) so it covers the part
          rather than compositing with it — §6 rule 20 bans ghosting one
          subject through another. */}
      <div
        ref={footage}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <canvas ref={hammerCanvas} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite/85 via-graphite/45 to-graphite/20" />
      </div>

      <Vignette />

      {/* Copy */}
      <div className="absolute inset-0 z-30">
        <div className="mx-auto flex h-full max-w-page flex-col justify-center page-x">
          <div ref={heroCopy}>
            <Eyebrow>{HERO_COPY.eyebrow}</Eyebrow>
            <div data-hero-headline className="mt-8">
              <h1 className="type-display-xl max-w-[15ch]">
                <SplitText as="span">{HERO_COPY.headlineLine1}</SplitText>
                <SplitText as="span" byWord className="block">
                  {HERO_COPY.headlineLine2}
                </SplitText>
              </h1>
            </div>
            <div data-hero-sub>
              <p className="type-lede mt-8 max-w-[46ch]">{HERO_COPY.subhead}</p>
              <div ref={ctaRow}>
                <HeroCta />
              </div>
            </div>
          </div>
        </div>

        <ActHeading />

        {/* The three beat words occupy the slot the headline vacates. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {HAMMER_INTRO_WORDS.map((word, i) => (
            <span
              key={word}
              ref={(node) => {
                words.current[i] = node;
              }}
              className="type-display-l absolute inset-0 mx-auto flex max-w-page items-center page-x"
              style={{ opacity: 0 }}
            >
              {word}.
            </span>
          ))}
        </div>
      </div>

      {/* Determinate byte progress while the part streams in. A percentage is
          more honest — and more on-brand — than a spinner (§6 rule 16), and
          it is gone the moment the part is on screen. */}
      {webgl === 'ok' && model.active && !partReady ? (
        <p className="type-meta absolute bottom-6 right-6 z-30 bg-graphite/70 px-3 py-2 text-saffron tabular-nums">
          Loading part · {Math.round(model.progress * 100)}%
        </p>
      ) : null}
    </section>
  );
}

export default function HeatAct() {
  const reduced = useReducedMotion();
  return reduced ? <HeatActStatic /> : <HeatActScrub />;
}
