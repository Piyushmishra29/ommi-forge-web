/**
 * The tiny mutable store shared by the DOM side of the 3D layer (provider,
 * slots) and the inside-canvas side (frame driver, renderer, stats).
 *
 * Why this file exists
 * --------------------
 * Two facts have to travel between components that live in different React
 * subtrees and update at very different rates:
 *
 *   - "is any slot currently on screen?" — read by the frame driver up to
 *     144 times a second. Routing that through React state would re-render
 *     the whole canvas subtree on every scroll-in/scroll-out.
 *   - "what quality tier are we on?" — written by the performance monitor,
 *     read by scenes that want to shed detail.
 *
 * So: plain mutable object, `subscribe` + version counter for the handful of
 * consumers that genuinely need to re-render, direct field reads for the
 * per-frame hot path. Same external-store shape as `modelCache`, for the
 * same `useSyncExternalStore` reason.
 */

export type QualityTier = 'high' | 'medium' | 'low';

export type SceneStore = {
  /** Register a slot. Returns an unregister function. */
  registerSlot: (id: string) => () => void;
  /**
   * Report whether a slot's tracked box currently intersects the viewport.
   * Cheap and idempotent — safe to call from an IntersectionObserver.
   */
  setSlotVisible: (id: string, visible: boolean) => void;
  /** Number of slots on screen right now. Read per frame; never allocates. */
  getVisibleCount: () => number;
  /** Ids of the visible slots, for the dev overlay. */
  getVisibleIds: () => string[];

  /**
   * Called by the first slot to enter its approach margin. Until this
   * happens the provider renders NO `<Canvas>` at all, which is what keeps
   * three.js out of the first-paint critical path: the renderer, the
   * WebGL context and the drei chunk are all created on approach, not on
   * mount. One-way latch — re-arming after a slot scrolls away would tear
   * down and re-create the GL context, which is far more expensive than
   * keeping an idle (never-advanced) one alive.
   */
  arm: () => void;
  isArmed: () => boolean;

  /**
   * Ask for more rendered frames. Only meaningful in reduced-motion mode,
   * where the driver is otherwise idle: a model finished loading, the
   * viewport resized, the user scrolled, a scene changed something. Ignored
   * (harmlessly) when motion is on, because every frame renders anyway.
   *
   * Defaults to **three** frames rather than one, deliberately. A single
   * frame is not enough to settle a change: three compiles a material's
   * shader and uploads its geometry during the draw that first needs them,
   * and drei's `<View>` measures its own rectangle inside the frame
   * callback — so the frame that reveals a newly-loaded part is often the
   * frame *before* the one that draws it correctly. Two spare frames cost
   * nothing on an idle page and remove a whole class of "reduced-motion
   * users see a blank box" bug.
   */
  requestRender: (frames?: number) => void;
  /** Driver-side: true if a frame is owed, and consumes one. */
  consumeRenderRequest: () => boolean;

  /** Current adaptive quality tier, written by the performance monitor. */
  getQuality: () => QualityTier;
  setQuality: (tier: QualityTier) => void;

  /** Live device pixel ratio in use, for the dev overlay. */
  getDpr: () => number;
  setDpr: (dpr: number) => void;

  subscribe: (cb: () => void) => () => void;
  getVersion: () => number;
};

export function createSceneStore(): SceneStore {
  const slots = new Map<string, boolean>();
  const subscribers = new Set<() => void>();
  let version = 0;
  let visibleCount = 0;
  let pendingFrames = 3; // paint as soon as the first slot appears
  let quality: QualityTier = 'high';
  let dpr = 1;
  let armed = false;

  const notify = () => {
    version += 1;
    for (const cb of subscribers) cb();
  };

  const recount = () => {
    let n = 0;
    for (const v of slots.values()) if (v) n += 1;
    visibleCount = n;
  };

  return {
    registerSlot(id) {
      slots.set(id, false);
      notify();
      return () => {
        slots.delete(id);
        recount();
        notify();
      };
    },

    setSlotVisible(id, visible) {
      if (slots.get(id) === visible) return;
      slots.set(id, visible);
      recount();
      // A slot appearing or disappearing changes what must be painted, so
      // the reduced-motion driver needs frames even though nothing is
      // animating.
      pendingFrames = Math.max(pendingFrames, 3);
      notify();
    },

    getVisibleCount: () => visibleCount,
    getVisibleIds: () => [...slots.entries()].filter(([, v]) => v).map(([k]) => k),

    arm() {
      if (armed) return;
      armed = true;
      notify();
    },
    isArmed: () => armed,

    requestRender(frames = 3) {
      pendingFrames = Math.max(pendingFrames, frames);
    },
    consumeRenderRequest() {
      if (pendingFrames <= 0) return false;
      pendingFrames -= 1;
      return true;
    },

    getQuality: () => quality,
    setQuality(tier) {
      if (quality === tier) return;
      quality = tier;
      pendingFrames = Math.max(pendingFrames, 3);
      notify();
    },

    getDpr: () => dpr,
    setDpr(next) {
      if (dpr === next) return;
      dpr = next;
      pendingFrames = Math.max(pendingFrames, 3);
      notify();
    },

    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    getVersion: () => version,
  };
}
