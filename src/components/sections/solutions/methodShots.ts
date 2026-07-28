import { FORGING_METHODS } from '@/data/solutions';
import { getRenderBySlug } from '@/data/renders';
import { MODELS, type ModelKey } from '@/lib/three/modelManifest';

/**
 * The shot list for `/solutions` — one entry per forging method, in
 * `FORGING_METHODS` order.
 *
 * This module is THREE-FREE on purpose. It is imported by both halves of
 * the act: the DOM side (`MethodsPinned`) reads `modelUrl` to warm the
 * loader and `describe` to caption the stage, and the lazily-loaded scene
 * (`MethodsScene`) reads `move` and `baseRotation` to pose the camera. If
 * the table lived in the scene module the DOM side could not touch it
 * without pulling the renderer into the first-paint chunk; if it lived in
 * `MethodsPinned` the scene would import the DOM tree. Hence a third file.
 *
 * §5.4 assigns each method a camera verb, and the reason is the concept:
 * *the motion is the method*. Closed-die is a press coming down, so the
 * camera comes down the die axis. Ring rolling is literally rotation, so
 * the part turns and the camera does not. Nobody has to read a caption to
 * understand which is which.
 */

/** The four permitted moves. Each maps to one of §4.3's three scroll verbs. */
export type CameraMove =
  /** DOLLY, vertical: camera descends the die axis, y 2.4 → 0.3. Method 01. */
  | 'push'
  /** A 90° orbit about the world Y axis — the long-axis walk-around. Method 02. */
  | 'arc'
  /** INDEX: camera holds, the part turns 220° on its ring axis. Method 03. */
  | 'index'
  /** DOLLY, end-on down the shaft: z 4.2 → 2.4. Method 04. */
  | 'dolly';

export type MethodShot = {
  /** Key into `MODELS`, resolved from the method's `sampleSlug`. */
  modelKey: ModelKey;
  /** GLB url — the exact string the loader and the manifest agree on. */
  modelUrl: string;
  /** Expected transfer size, for the progress readout. */
  modelBytes: number;
  move: CameraMove;
  /**
   * Resting orientation of the part, in radians, before the scroll-driven
   * pose is applied. Each method is framed so its *defining* axis faces the
   * camera move: the sprocket's face toward a descending camera, the
   * manifold's length across an orbiting one, and so on.
   */
  baseRotation: [number, number, number];
  /**
   * What a sighted visitor learns from watching this panel's 3D. Becomes the
   * `<SceneSlot>` description, and the alt-equivalent when WebGL is absent —
   * a `<canvas>` exposes nothing at all to assistive tech.
   */
  describe: string;
};

/**
 * `sampleSlug` on a `ForgingMethod` is a `RENDERS` slug (`'a'`–`'i'`), and
 * every one of those is also a `MODELS` key. Asserting that here rather
 * than casting at each use site means a future data edit that points a
 * method at a part with no GLB fails loudly at module load instead of
 * rendering an empty stage.
 */
function modelKeyFor(slug: string): ModelKey {
  if (!(slug in MODELS)) {
    throw new Error(
      `[solutions] FORGING_METHODS sampleSlug "${slug}" has no entry in MODELS. ` +
        'Every method must point at a GLB that exists in public/assets/models/.',
    );
  }
  return slug as ModelKey;
}

/** Per-method camera verb + framing, keyed by `number` so it survives reordering. */
const SHOT_BY_NUMBER: Record<string, { move: CameraMove; baseRotation: [number, number, number] }> = {
  // 01 Closed Die — the sprocket lies face-up under the descending camera,
  // the way it lies in the bottom die.
  '01': { move: 'push', baseRotation: [-Math.PI / 2, 0, 0] },
  // 02 Open Die — the manifold is a long part, and in its native
  // orientation the arc looks straight down its nose: it reads as a small
  // blob rather than as the 2000 mm shaft the copy is describing. This is
  // the same pose `scripts/posters/poster.html` frames every part in, which
  // shows the length broadside at the middle of the swing.
  '02': { move: 'arc', baseRotation: [0.2, -0.7, 0] },
  // 03 Ring Rolling — the hub is tipped so its bore is oblique to the
  // camera; a dead-on ring would make 220° of rotation invisible.
  '03': { move: 'index', baseRotation: [-1.15, 0, 0.2] },
  // 04 Upset — the rod points at the camera, which then dollies down the
  // shaft toward the upset end.
  '04': { move: 'dolly', baseRotation: [0, Math.PI / 2, 0] },
};

function describeFor(index: number): string {
  const m = FORGING_METHODS[index];
  const sample = getRenderBySlug(m.sampleSlug);
  const blurb = sample?.blurb ?? '';
  const shot = SHOT_BY_NUMBER[m.number];
  const motion: Record<CameraMove, string> = {
    push: 'The view descends the die axis toward it, the way the top die comes down, and the steel takes a brief heat as the stroke bottoms out before cooling again.',
    arc: 'The view walks a quarter-turn around its long axis, the length a 2000 mm open-die shaft would occupy.',
    index: 'It turns most of a full revolution on its own ring axis while the view holds still — rolling a ring is rotation, so the part is what moves.',
    dolly: 'The view travels end-on down the shaft toward the upset head, where the grain flow gathers.',
  };
  return `${m.sampleName}, a real Ommi Forge part, shown as cold grey steel on a dark stage. ${blurb} ${motion[shot.move]}`;
}

export const METHOD_SHOTS: ReadonlyArray<MethodShot> = FORGING_METHODS.map(
  (m, i) => {
    const key = modelKeyFor(m.sampleSlug);
    const shot = SHOT_BY_NUMBER[m.number];
    if (!shot) {
      throw new Error(
        `[solutions] No camera shot defined for method "${m.number}". ` +
          'Add one to SHOT_BY_NUMBER in methodShots.ts.',
      );
    }
    return {
      modelKey: key,
      modelUrl: MODELS[key].url,
      modelBytes: MODELS[key].bytes,
      move: shot.move,
      baseRotation: shot.baseRotation,
      describe: describeFor(i),
    };
  },
);

export const PANEL_COUNT = METHOD_SHOTS.length;

/**
 * Scroll distance the pinned act occupies, in viewport heights.
 * §5.4: `end: '+=140%'` per panel.
 */
export const PANEL_SCROLL_VH = 1.4;
