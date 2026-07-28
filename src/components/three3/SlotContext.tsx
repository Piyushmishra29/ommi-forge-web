'use client';

import { createContext, useContext, type RefObject } from 'react';
import type { SceneStore } from '@/lib/three/sceneStore';

/**
 * What a scene can see about the slot it is rendering into.
 *
 * Why this is separate from `Scene3DContext`
 * ------------------------------------------
 * `<SceneSlot>`'s children are portalled into the shared canvas through
 * drei's tunnel. A tunnel moves the *element* to a different position in the
 * React tree, and context is resolved where an element renders, not where it
 * was written — so nothing provided around `<SceneSlot>` in the DOM tree
 * reaches its 3D children. `<SceneSlot>` therefore re-establishes this
 * context on the inside, and everything a scene needs at frame time lives
 * here rather than in the DOM-side context.
 */
export type SlotApi = {
  /** Stable per-slot id, also used as the store key. */
  id: string;
  /**
   * Live "is my box on screen right now" flag, updated by an
   * IntersectionObserver. A ref, not state, because it is read every frame
   * and must never cause a re-render of the scene subtree.
   */
  visibleRef: RefObject<boolean>;
  /** False under `prefers-reduced-motion: reduce`. */
  motion: boolean;
  store: SceneStore;
};

export const SlotContext = createContext<SlotApi | null>(null);

/**
 * Slot the calling component is rendering into. Throws outside a
 * `<SceneSlot>` — a scene that has escaped its slot would render into the
 * root scene, where nothing draws it and nothing pauses it.
 */
export function useSlot(): SlotApi {
  const ctx = useContext(SlotContext);
  if (!ctx) {
    throw new Error(
      'This hook must be called inside <SceneSlot> children (i.e. inside the shared canvas).',
    );
  }
  return ctx;
}

/** Non-throwing variant, for helpers that also work outside a slot. */
export function useOptionalSlot(): SlotApi | null {
  return useContext(SlotContext);
}
