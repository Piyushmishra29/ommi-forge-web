'use client';

import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { BRAND_HEX } from '@/lib/brand';

/**
 * Procedural image-based lighting for forged steel — zero bytes downloaded.
 *
 * Why not an HDRI, and why not drei's `<Environment preset>`
 * ---------------------------------------------------------
 * Metal is almost entirely reflection. A `meshStandardMaterial` with
 * `metalness: 0.9` and no environment map renders as a nearly black
 * silhouette with a couple of specular dots — which is why v2's viewers had
 * to sit at `metalness: 0.7` under three analytic lights and still read as
 * plastic. Real image-based lighting is the single biggest visual upgrade
 * available here.
 *
 * The two obvious ways to get it are both disallowed:
 *   - a real `.hdr` file is 1–4 MB, and v2 explicitly deleted a 1.6 MB
 *     `empty_warehouse_01_1k.hdr` for exactly that reason;
 *   - drei's `<Environment preset="warehouse">` *downloads* its HDRI from
 *     the pmndrs CDN at runtime. Nothing about that is bundled, it is a
 *     multi-megabyte third-party request on a site that ships as static
 *     files, and it would blow the 12 MB route budget on its own.
 *
 * So the environment is built in the browser: a handful of emissive quads
 * arranged like a forge shop — hard overhead key, a tall narrow strip that
 * rakes one side (the specular streak that makes machined steel read as
 * metal rather than as grey plastic), a cool rear wall, dark surround — and
 * run through three's `PMREMGenerator`, which is the same prefiltering
 * every HDRI goes through anyway.
 *
 * COST: one 256px cube render of ~6 quads plus the PMREM mip chain, once
 * per renderer, on the frame the first slot arms. Measured in single-digit
 * milliseconds and zero bytes over the network. The result is cached per
 * renderer + options, so five slots share one texture.
 */

export type ForgeEnvironmentOptions = {
  /** Overhead roof-strip brightness. Raise for harder, more contrasted highlights. */
  keyIntensity?: number;
  /** Brightness of the raking side strip — the machined-edge highlight. */
  rakeIntensity?: number;
  /** Brightness of the cool rear panel (see `coolColor`). */
  rimIntensity?: number;
  /**
   * Level of the enclosing shell. **Do not take this below ~0.6.** At a low
   * value the shell is near-black, so any face not pointing at a panel
   * reflects a void and the part reads as a black cutout with chrome edges
   * rather than as metal standing in a room.
   */
  roomIntensity?: number;
  /**
   * Colour of the roof lights and the raking strip — §3.3's ~4800K shop
   * white, `#FFF4E8`.
   *
   * **Do not make this orange.** These two panels are most of what a
   * `metalness: 1` surface reflects, so tinting them warm renders the steel
   * bronze — a direct violation of §6.5 ("the part is grey steel lit by
   * something orange, never orange steel") and the thing §7.7 screenshots
   * for. This defaulted to brand peach until v3-showroom caught it.
   */
  warmColor?: string;
  /**
   * Colour of the rear panel. **Keep it cool (`#8FA6BC`). Do not make it
   * orange.**
   *
   * This defaulted to §3.3's forge-mouth orange (`#FF7A2B`) and it was wrong:
   * a warm rear wall is the single biggest source of reflected colour on a
   * part's back-facing surfaces, and on MACHINED faces it turns them bronze.
   * Measured on the shipped rig, machined, before and after:
   *
   *   part-f (Crank)          +16.5 / 29.7% orange  →  −5.5 / 0.4%
   *   part-i (Connecting Rod) +19.3 / 25.0%         →  −3.9 / 2.0%
   *
   * Found by v3-showroom, who spotted a copper stripe down the crank's shank.
   * It needs a broad face angled at the back wall to show up, which is why a
   * part-d / as-forged sample misses it entirely — as-forged's roughness 0.58
   * blurs the reflection that machined's 0.42 keeps sharp. Dimming the wall
   * was not enough (still 12.3% at quarter brightness); it had to stop being
   * orange.
   *
   * §3.3's forge heat is not lost — it lives on the **rim light** in
   * `<ForgeLights>`, at full saffron strength, which is where §3.3 puts it
   * and where it separates the silhouette instead of staining the surface.
   */
  coolColor?: string;
};

export type ForgeEnvironmentProps = ForgeEnvironmentOptions & {
  /**
   * `scene.environmentIntensity`. The cheapest exposure control you have —
   * change this before changing the light rig. Defaults to 1.15, the
   * exposure v3-showroom verified on screen (`STAGE_ENV_INTENSITY`).
   */
  intensity?: number;
  /**
   * Y rotation of the environment, in radians. Spinning the *environment*
   * instead of the part is how you move a highlight across a static surface
   * without the part appearing to move.
   */
  rotationY?: number;
};

/**
 * V3-DIRECTION §3.3, as verified on screen by v3-showroom (their
 * `STAGE_ENV`). These are the defaults, not a preset, because a consumer who
 * passes nothing must get a correct rig — earlier defaults (peach warm
 * colour, near-black shell, and later an orange rear wall) each rendered the
 * steel bronze, and every lane using them was wrong.
 */
const DEFAULTS: Required<ForgeEnvironmentOptions> = {
  keyIntensity: 4.0,
  rakeIntensity: 2.0,
  rimIntensity: 1.4,
  roomIntensity: 1.0,
  warmColor: '#FFF4E8',
  coolColor: '#8FA6BC',
};

type Panel = {
  size: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  intensity: number;
};

/**
 * The rig, in world units. The part sits at the origin with radius ~1
 * (see `geometryCache`'s `targetRadius`), so these distances are all
 * "several part-widths away" — far enough that the reflections read as room
 * lighting rather than as visible rectangles.
 *
 * DELIBERATE DIVERGENCE FROM §3.3 — DO NOT "FIX" THIS BACK.
 * §3.3 specifies *two* parallel roof strips ("do not merge them into one; a
 * single streak reads as a studio softbox"). This rig has one broad overhead
 * panel plus one narrow raking strip on the camera-right side, which
 * produces the same two-streak read from a different geometry.
 *
 * It stays that way because the panel layout is baked into artefacts, not
 * just into this file: `scripts/posters/poster.html` mirrors these panels by
 * hand to render the 22 offline posters, and §5.9 requires poster and live
 * canvas to be visually identical — that identity is what makes the canvas
 * fade-in invisible instead of a visible pop. Every lane has also
 * screenshot-verified its sections against *this* geometry. Changing the
 * panels would invalidate all of it to match a spec written before the rig
 * existed. Ruled on and accepted by the lead: the rendered artefact wins
 * over the document.
 *
 * Colours and intensities are a different matter — those are just numbers,
 * they match §3.3, and they should stay matching it.
 */
function panels(o: Required<ForgeEnvironmentOptions>): Panel[] {
  return [
    // Overhead roof light — broad, directly above, slightly forward.
    // `warmColor` rather than a hardcoded white: §3.3's roof strips are
    // #FFF4E8 (~4800K shop light), and a `warmColor` that did not actually
    // colour the roof light made the prop's documentation a lie.
    {
      size: [9, 6],
      position: [0, 5.4, 1],
      rotation: [-Math.PI / 2, 0, 0],
      color: o.warmColor,
      intensity: o.keyIntensity,
    },
    // Raking strip, camera-right. Narrow and tall on purpose: a wide light
    // gives a soft wash, a narrow one gives the hard specular line along an
    // edge that says "machined".
    {
      size: [1.1, 8],
      position: [6, 0.5, 1.5],
      rotation: [0, -Math.PI / 2, 0],
      color: o.warmColor,
      intensity: o.rakeIntensity,
    },
    // Soft fill, camera-left, so the shadow side is not dead.
    {
      size: [6, 6],
      position: [-6, 0, 1],
      rotation: [0, Math.PI / 2, 0],
      color: o.warmColor,
      intensity: o.rakeIntensity * 0.28,
    },
    // Rear wall. COOL, deliberately — see `coolColor`. A warm wall here is
    // the biggest source of reflected colour on back-facing surfaces and
    // turns machined faces bronze. The forge heat lives on the rim light.
    {
      size: [7, 2.4],
      position: [0, 1.2, -6.5],
      rotation: [0, 0, 0],
      color: o.coolColor,
      intensity: o.rimIntensity,
    },
    // Shop floor: dark, but not black, so downward-facing surfaces are not
    // voids.
    {
      size: [18, 18],
      position: [0, -4.2, 0],
      rotation: [-Math.PI / 2, 0, 0],
      color: BRAND_HEX.graphite,
      intensity: o.roomIntensity * 2.5,
    },
  ];
}

function buildEnvScene(o: Required<ForgeEnvironmentOptions>): THREE.Scene {
  const scene = new THREE.Scene();

  // Enclosing shell so the metal has a defined dark surround instead of
  // reflecting the clear colour. BackSide: we are inside it.
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(BRAND_HEX.graphite).multiplyScalar(o.roomIntensity),
      side: THREE.BackSide,
    }),
  );
  scene.add(shell);

  for (const p of panels(o)) {
    // DoubleSide so panel orientation can be reasoned about as "where is it"
    // rather than "which way does a plane's normal point".
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({
        // Values above 1 are what make these read as *lights* rather than as
        // white paper. The PMREM target is half-float, so it keeps them.
        color: new THREE.Color(p.color).multiplyScalar(p.intensity),
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(...p.position);
    mesh.rotation.set(...p.rotation);
    scene.add(mesh);
  }

  return scene;
}

function disposeEnvScene(scene: THREE.Scene): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    const material = obj.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material.dispose();
  });
}

/**
 * One PMREM texture per renderer + option set. A WeakMap so a renderer that
 * goes away (route change, context loss remount) takes its cache with it.
 */
const cache = new WeakMap<THREE.WebGLRenderer, Map<string, THREE.Texture>>();

/** Build (or reuse) the forge environment map for a renderer. */
export function getForgeEnvironment(
  renderer: THREE.WebGLRenderer,
  options: ForgeEnvironmentOptions = {},
): THREE.Texture {
  // `{ ...DEFAULTS, ...options }` is WRONG here and was a real bug: a React
  // component that destructures optional props hands this function an object
  // whose keys all exist with the value `undefined`, and object spread
  // happily overwrites a default with an explicit `undefined`. Every panel
  // colour then became `new THREE.Color(undefined).multiplyScalar(undefined)`
  // — NaN — which produced a NaN cube map. The failure mode was brutal to
  // read: not a dark environment, but *every* `meshStandardMaterial` in the
  // scene rendering pure black, lights and all, because a NaN sample poisons
  // the whole fragment. Resolve each key explicitly instead.
  const o: Required<ForgeEnvironmentOptions> = {
    keyIntensity: options.keyIntensity ?? DEFAULTS.keyIntensity,
    rakeIntensity: options.rakeIntensity ?? DEFAULTS.rakeIntensity,
    rimIntensity: options.rimIntensity ?? DEFAULTS.rimIntensity,
    roomIntensity: options.roomIntensity ?? DEFAULTS.roomIntensity,
    warmColor: options.warmColor ?? DEFAULTS.warmColor,
    coolColor: options.coolColor ?? DEFAULTS.coolColor,
  };
  const key = JSON.stringify(o);

  let perRenderer = cache.get(renderer);
  if (!perRenderer) {
    perRenderer = new Map();
    cache.set(renderer, perRenderer);
  }
  const hit = perRenderer.get(key);
  if (hit) return hit;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = buildEnvScene(o);
  // sigma 0.04 softens the panel edges just enough that a mirror-smooth
  // surface does not show hard rectangles.
  const target = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  disposeEnvScene(envScene);

  perRenderer.set(key, target.texture);
  return target.texture;
}

/**
 * Install the environment on a scene and hand back the restore function.
 *
 * A plain function rather than inline effect code for two reasons: three's
 * environment API *is* mutation of a scene object, and doing that directly on
 * a value returned by `useThree` inside a component body trips React 19's
 * `react-hooks/immutability` rule. drei's own `<Environment>` factors it out
 * the same way.
 */
function applyEnvironment(
  scene: THREE.Scene,
  texture: THREE.Texture,
  intensity: number,
  rotationY: number,
): () => void {
  const previousEnv = scene.environment;
  const previousIntensity = scene.environmentIntensity;
  const previousRotation = scene.environmentRotation.clone();

  scene.environment = texture;
  scene.environmentIntensity = intensity;
  scene.environmentRotation.set(0, rotationY, 0);

  return () => {
    // The texture itself is cache-owned and outlives this mount — restore
    // what was there, never dispose.
    scene.environment = previousEnv;
    scene.environmentIntensity = previousIntensity;
    scene.environmentRotation.copy(previousRotation);
  };
}

/**
 * Applies the forge environment to the scene it is mounted in.
 *
 * Put one inside every `<SceneSlot>` that shows metal. Inside a slot this
 * targets that slot's own portalled scene, so different sections can run
 * different exposures without fighting each other.
 *
 * @example
 * <SceneSlot …>
 *   <ForgeEnvironment intensity={1.1} />
 *   <ForgeLights preset="hero" />
 *   <ForgedPart url={MODELS.i.url} />
 * </SceneSlot>
 */
export function ForgeEnvironment({
  intensity = 1.15,
  rotationY = 0,
  ...options
}: ForgeEnvironmentProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const {
    keyIntensity,
    rakeIntensity,
    rimIntensity,
    roomIntensity,
    warmColor,
    coolColor,
  } = options;

  // Built inside the effect, not in `useMemo`, and that placement is
  // load-bearing. `PMREMGenerator.fromScene()` issues real `gl.render()`
  // calls; doing that from the render phase — while React is still
  // committing the R3F tree and, with `frameloop="never"`, before the
  // renderer has drawn a single frame — produced a silently corrupt cube
  // map here. Every `meshStandardMaterial` in the scene then sampled it and
  // rendered pure black, lights and all, because the bad samples poison the
  // whole fragment, not just the reflection. Running after commit fixes it.
  // The texture is cached per renderer + options, so this stays a one-time
  // cost even though the effect can re-run.
  useEffect(() => {
    const texture = getForgeEnvironment(gl, {
      keyIntensity,
      rakeIntensity,
      rimIntensity,
      roomIntensity,
      warmColor,
      coolColor,
    });
    return applyEnvironment(scene, texture, intensity, rotationY);
  }, [
    gl,
    scene,
    intensity,
    rotationY,
    keyIntensity,
    rakeIntensity,
    rimIntensity,
    roomIntensity,
    warmColor,
    coolColor,
  ]);

  return null;
}

export default ForgeEnvironment;
