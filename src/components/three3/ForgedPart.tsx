'use client';

import type { ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import type { ShadingMode } from '@/lib/three/geometryCache';
import { MODEL_PRIORITY } from '@/lib/three/modelManifest';
import { useModelGeometry } from './useModel';
import { ForgedSteelMaterial } from './ForgedSteelMaterial';

export type ForgedPartProps = Omit<ThreeElements['group'], 'children'> & {
  /** GLB url — use `MODELS.<key>.url` so the size is known to the loader. */
  url: string;
  /** Queue tier. See `MODEL_PRIORITY`. */
  priority?: number;
  /** Bounding-sphere radius to normalise to. Default 1. */
  targetRadius?: number;
  /**
   * `'creased'` splits sharp edges so they catch light like machined steel.
   * It de-indexes the geometry (~3x GPU buffer), so it is worth it for a
   * hero part and wasteful for a thumbnail. Default `'smooth'`.
   */
  shading?: ShadingMode;
  /** 0–1 emissive heat ramp — see `ForgedSteelMaterial`. */
  heat?: number;
  /**
   * Rendered in place of the mesh while the model streams in. R3F nodes
   * only. Leave undefined to render nothing (the usual choice when the DOM
   * side is already showing a percentage).
   */
  placeholder?: ReactNode;
};

/**
 * A forged part, loaded and framed, with the house material on it.
 *
 * This exists so that "show one of the eleven GLBs" has exactly one
 * implementation instead of four. It is intentionally a thin composition of
 * `useModelGeometry` + `<ForgedSteelMaterial>` — if a scene needs something
 * this cannot express (multiple materials, a custom shader, instancing), use
 * `useModelGeometry` directly rather than adding props here.
 *
 * The geometry is cache-owned and shared with every other scene showing the
 * same part, which is why the mesh carries `dispose={null}`: without it,
 * R3F's unmount cleanup would dispose a buffer other slots are still
 * drawing from.
 *
 * @example
 * <SceneSlot …>
 *   <ForgeEnvironment />
 *   <ForgeLights preset="hero" />
 *   <ForgedPart
 *     url={MODELS.i.url}
 *     priority={MODEL_PRIORITY.hero}
 *     shading="creased"
 *     rotation={[0, Math.PI / 4, 0]}
 *   />
 * </SceneSlot>
 */
export function ForgedPart({
  url,
  priority = MODEL_PRIORITY.approaching,
  targetRadius = 1,
  shading = 'smooth',
  heat = 0,
  placeholder,
  ...groupProps
}: ForgedPartProps) {
  const { geometry } = useModelGeometry(url, {
    priority,
    targetRadius,
    shading,
  });

  return (
    <group {...groupProps}>
      {geometry ? (
        <mesh geometry={geometry.geometry} dispose={null}>
          <ForgedSteelMaterial heat={heat} />
        </mesh>
      ) : (
        placeholder
      )}
    </group>
  );
}

export default ForgedPart;
