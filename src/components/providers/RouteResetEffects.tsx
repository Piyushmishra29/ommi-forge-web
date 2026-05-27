'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * RouteResetEffects
 *
 * Mounts inside the LenisProvider tree. On every pathname change it:
 *
 *  1. Snaps Lenis back to the top of the new document (`immediate: true`),
 *     because Lenis owns the scroll position and the App Router's native
 *     scroll-to-top runs against `window.scrollTo`, which Lenis no-ops.
 *  2. Calls `ScrollTrigger.refresh()` on the next frame so any new pinned
 *     sections or scrubbed timelines on the freshly mounted route compute
 *     their start/end values against the correct document height.
 *  3. As a belt-and-braces measure, kills any orphaned ScrollTrigger
 *     instances whose trigger element is no longer in the DOM — these can
 *     accumulate if a `<PinnedSection>` exits while still pinning, and
 *     they otherwise re-add their pin-spacer ghost to the next route.
 *
 * Why not co-locate in LenisProvider?  LenisProvider mounts once for the
 * lifetime of the app and its `useEffect` deps are empty — wiring a
 * pathname listener onto it would tangle the singleton init with route
 * concerns. A dedicated component keeps the responsibilities separate.
 */
export default function RouteResetEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Reset scroll to top of new page.
    //    Lenis dispatches scroll events on the window in its own RAF
    //    loop, so a plain `window.scrollTo` is fought back to the old
    //    position on the next tick. We dispatch the "go to top now"
    //    via the same CustomEvent channel Header uses for pause/resume,
    //    keeping LenisProvider as the sole owner of the Lenis instance.
    document.dispatchEvent(
      new CustomEvent('lenis:scrollto', {
        detail: { target: 0, immediate: true },
      }),
    );
    // Fallback for users with reduced-motion (Lenis is disabled there).
    window.scrollTo({ top: 0, behavior: 'auto' });

    // 2. Kill any ScrollTriggers whose trigger DOM node is detached.
    //    `ctx.revert()` in PinnedSection covers the happy path, but with
    //    AnimatePresence mode="wait" the previous route's components can
    //    finish their exit animation before unmount, leaving a window
    //    where the new route mounts and starts its own ScrollTriggers
    //    while stale ones are still alive.
    ScrollTrigger.getAll().forEach((trigger) => {
      const el = trigger.trigger as Element | null | undefined;
      if (el && !document.contains(el)) {
        trigger.kill();
      }
    });

    // 3. Refresh layout-dependent start/end values on the next frame so
    //    the new page's pinned + scrubbed triggers measure against the
    //    correct document height.
    const id = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
