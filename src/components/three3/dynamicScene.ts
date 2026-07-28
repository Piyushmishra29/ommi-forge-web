'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Wrap a scene module so it is fetched only when it first renders.
 *
 * This is the load-bearing half of the "nothing 3D on first paint" promise,
 * and the one thing a scene author has to remember.
 *
 * `<SceneSlot>` already defers the canvas and drei. But the *contents* of a
 * slot — your `<ForgeLights>`, your `<ForgedPart>`, anything importing from
 * `three3/scene` — are written as JSX in the page component, so the page
 * statically imports them, so three.js ends up in the page chunk anyway. The
 * slot's laziness is defeated by its own children.
 *
 * Putting the scene body in its own module behind this wrapper fixes that:
 * the page holds only a reference, and the module is fetched on the frame
 * the slot goes live (i.e. on approach).
 *
 * `ssr: false` is not optional — a `WebGLRenderer` cannot be constructed
 * during the static export.
 *
 * @example
 * // HeroSection.tsx — imports nothing from three3/scene
 * const HeroContent = dynamicScene(() => import('./HeroContent'));
 *
 * <SceneSlot accessibleName={…} description={…} fallback={<HeroStill />}>
 *   <HeroContent progress={progressRef} />
 * </SceneSlot>
 *
 * // HeroContent.tsx — default-exports the R3F subtree, imports three3/scene
 */
export function dynamicScene<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  return dynamic(loader, { ssr: false }) as ComponentType<P>;
}
