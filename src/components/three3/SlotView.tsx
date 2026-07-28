'use client';

import { View } from '@react-three/drei';
import type { ReactNode } from 'react';

/**
 * The three.js half of `<SceneSlot>`, isolated in its own module purely so
 * it can be `next/dynamic`-imported.
 *
 * This is the only file in the slot path that imports drei, and therefore
 * the only one that pulls three.js into a chunk. Keeping it behind a dynamic
 * boundary is what lets a page render its `<SceneSlot>` boxes, headings and
 * fallback imagery on first paint with zero three.js bytes, and fetch the
 * renderer only once a slot approaches the viewport.
 *
 * `<View>` tunnels these children into the single `<View.Port>` inside
 * `<SceneCanvas>` and, every frame, scissors the shared canvas to this
 * element's bounding box before drawing them — one WebGL context, N
 * independent viewports.
 */
export type SlotViewProps = {
  /**
   * Paint order among slots. Higher draws later (on top) and, because drei
   * uses it as the `useFrame` priority, must stay >= 1 so R3F switches the
   * renderer into manual mode.
   */
  index: number;
  className?: string;
  children: ReactNode;
};

export function SlotView({ index, className, children }: SlotViewProps) {
  return (
    <View index={index} className={className}>
      {children}
    </View>
  );
}

export default SlotView;
