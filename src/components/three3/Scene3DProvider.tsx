'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { createSceneStore, type SceneStore } from '@/lib/three/sceneStore';
import { detectWebGL, resetWebGLProbe } from '@/lib/three/webgl';
import { SceneStats } from './SceneStats';

/**
 * State of the one WebGL context this route owns.
 *
 * `probing` is the server + pre-hydration value. It is deliberately NOT
 * "assume it works": rendering the static fallback first means the exported
 * HTML ships real content (render stills + copy), which is what a crawler,
 * a no-JS visitor and a WebGL-less browser all get, with no flash of an
 * empty canvas for anyone.
 */
export type WebGLState = 'probing' | 'ok' | 'unsupported' | 'lost';

export type Scene3DContextValue = {
  store: SceneStore;
  webgl: WebGLState;
  /** `true` when scene animation is allowed to run (i.e. NOT reduced-motion). */
  motion: boolean;
  /** Raw OS preference, if a scene needs to branch on it directly. */
  reducedMotion: boolean;
  /** Called by `SceneSlot` on WebGL context loss / restore. Internal. */
  reportContextLost: () => void;
  reportContextRestored: () => void;
  reportCanvasError: () => void;
};

const Scene3DContext = createContext<Scene3DContextValue | null>(null);

/**
 * Access the route's 3D context from anywhere in the DOM tree under
 * `<Scene3DProvider>`.
 *
 * NOT available inside `<SceneSlot>` children — those are portalled into the
 * canvas through a tunnel, so React context from the DOM tree does not reach
 * them. Inside a slot, use `useSlot()` / `useSceneFrame()` instead, which
 * read the equivalent values from a context the slot re-establishes on the
 * canvas side.
 */
export function useScene3D(): Scene3DContextValue {
  const ctx = useContext(Scene3DContext);
  if (!ctx) {
    throw new Error(
      '3D components must be rendered inside <Scene3DProvider>. ' +
        'Wrap the route (or the whole page body) in it exactly once.',
    );
  }
  return ctx;
}

/**
 * Non-throwing variant, for components that must survive a missing provider.
 *
 * `<SceneSlot>` uses this rather than `useScene3D()` deliberately. Under
 * `output: 'export'` every route is prerendered at build time, so a throw
 * from a slot rendered outside a provider does not produce a broken section —
 * it aborts `next build` for the whole site. Degrading to the slot's static
 * fallback (plus a loud console error in dev) keeps one author's missing
 * wrapper from blocking everyone else's deploy.
 */
export function useOptionalScene3D(): Scene3DContextValue | null {
  return useContext(Scene3DContext);
}

/**
 * The canvas host is loaded on demand. It is the only module in this layer
 * that pulls three.js + drei, so keeping it behind `next/dynamic` is what
 * makes "nothing 3D on first paint" true at the bundle level, not just at
 * the network level. `ssr: false` because a WebGLRenderer cannot be
 * constructed during the static export.
 */
const SceneCanvas = dynamic(
  () => import('./SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false },
);

export type Scene3DProviderProps = {
  children: ReactNode;
  /**
   * Stacking order of the fixed canvas layer. Default 1: above the page's
   * opaque `--color-paper` background (otherwise nothing would ever be
   * visible) and far below the header's `z-[1000]`.
   *
   * Consequence scene authors must know: DOM that has to read ON TOP of the
   * 3D — headlines, captions, buttons — needs its own stacking context above
   * this, i.e. `relative z-10` on the overlay wrapper.
   */
  zIndex?: number;
};

const NO_SUBSCRIBE = () => () => {};

/**
 * One 3D context per route.
 *
 * Mount this once, as high in the route as possible — above `<PageTransition>`
 * if you can, and never inside an ancestor that sets `transform`, `filter` or
 * `perspective`, because any of those would make the fixed canvas position
 * itself against that ancestor instead of the viewport.
 *
 * It renders `children` normally and appends a single fixed, pointer-events-
 * none `<canvas>` layer. The canvas is not created until the first
 * `<SceneSlot>` reports that it is approaching the viewport.
 *
 * @example
 * // src/app/page.tsx (client component)
 * <Scene3DProvider>
 *   <main id="main">
 *     <HeroScene />     // contains a <SceneSlot>
 *     <Showroom />      // contains another
 *   </main>
 * </Scene3DProvider>
 */
export function Scene3DProvider({ children, zIndex = 1 }: Scene3DProviderProps) {
  const [store] = useState(createSceneStore);
  const reducedMotion = useReducedMotion();

  // `detectWebGL` is memoised internally and returns a primitive, so it is a
  // valid `getSnapshot`. Using useSyncExternalStore rather than
  // `useEffect(() => setState(detect()))` keeps us clear of
  // `react-hooks/set-state-in-effect` and gives a clean server value.
  const probe = useSyncExternalStore<WebGLState>(
    NO_SUBSCRIBE,
    detectWebGL,
    () => 'probing',
  );

  // Runtime failures the probe cannot predict: the boundary catching a
  // renderer constructor throw, or the driver losing the context later.
  const [failure, setFailure] = useState<'unsupported' | 'lost' | null>(null);
  const [contextEpoch, setContextEpoch] = useState(0);

  const reportCanvasError = useCallback(() => setFailure('unsupported'), []);
  const reportContextLost = useCallback(() => setFailure('lost'), []);
  const reportContextRestored = useCallback(() => {
    // The old probe result described a context that no longer exists.
    resetWebGLProbe();
    setFailure(null);
    // Remount the whole canvas rather than trusting the restored context.
    // three re-initialises GL state on restore, but every geometry, texture
    // and compiled program from the dead context is gone; a fresh mount is
    // both simpler to reason about and cheaper than debugging a half-alive
    // renderer in the field.
    setContextEpoch((e) => e + 1);
  }, []);

  const webgl: WebGLState = failure ?? probe;

  const value = useMemo<Scene3DContextValue>(
    () => ({
      store,
      webgl,
      motion: !reducedMotion,
      reducedMotion,
      reportContextLost,
      reportContextRestored,
      reportCanvasError,
    }),
    [
      store,
      webgl,
      reducedMotion,
      reportContextLost,
      reportContextRestored,
      reportCanvasError,
    ],
  );

  // Re-render when the store arms, so the canvas mounts on first approach.
  useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  const armed = store.isArmed();

  return (
    <Scene3DContext.Provider value={value}>
      {children}
      {/* Kept mounted while `lost` so the browser still has a canvas element
          to fire `webglcontextrestored` at — unmounting on loss would mean
          the page never recovers. Slots show their fallbacks meanwhile. */}
      {(webgl === 'ok' || webgl === 'lost') && armed && (
        <SceneCanvas
          key={contextEpoch}
          store={store}
          motion={!reducedMotion}
          zIndex={zIndex}
        />
      )}
      {/* Renders nothing unless `?stats=1` or NEXT_PUBLIC_SCENE_STATS=1. */}
      <SceneStats />
    </Scene3DContext.Provider>
  );
}

export default Scene3DProvider;
