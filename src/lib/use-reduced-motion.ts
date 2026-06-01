'use client';

import { useSyncExternalStore } from 'react';

/**
 * useReducedMotion
 *
 * Tiny hand-rolled replacement for framer-motion's `useReducedMotion()`,
 * so files that only need the OS reduced-motion bit don't drag the
 * whole framer-motion runtime into their route's bundle.
 *
 * Backed by `useSyncExternalStore` so we never cascade a `setState`
 * inside an effect — the React 19 lint rule (`react-hooks/set-state-in-effect`)
 * objects to that pattern, and `useSyncExternalStore` is the canonical
 * way to subscribe to an external (matchMedia) source.
 *
 * SSR-safe: returns `false` on the server / before mount (matches the
 * server markup so there's no hydration mismatch), then reflects the
 * current `prefers-reduced-motion: reduce` state and updates if the
 * user toggles it.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
