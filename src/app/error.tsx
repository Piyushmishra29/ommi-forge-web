'use client';

import { useEffect } from 'react';

/**
 * Route-segment error boundary.
 *
 * Its main job here is resilience on relay-hosted static deploys
 * (Tailscale Funnel, CDNs with cold edges): if a lazy JS chunk fails to
 * download on a cold hit, Next throws a `ChunkLoadError` and the page
 * would otherwise show a crash screen until the user manually reloads.
 * We detect that specific case and reload ONCE automatically (guarded by
 * a sessionStorage flag so we never loop), so the visitor just sees a
 * brief blink instead of an error.
 *
 * Any other error falls through to a small branded fallback with a
 * manual retry — never a raw stack trace in front of a client.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|importing a module script failed/i.test(
      `${error?.name} ${error?.message}`,
    );

  useEffect(() => {
    if (!isChunkError) return;
    if (typeof window === 'undefined') return;
    const KEY = 'of-chunk-reload';
    // Only auto-reload once per session to avoid an infinite loop if the
    // asset is genuinely missing rather than a transient relay drop.
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    window.location.reload();
  }, [isChunkError]);

  return (
    <main
      id="main"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-6 text-center text-graphite"
    >
      <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.3em] text-ember">
        {isChunkError ? 'Reconnecting' : 'Something slipped'}
      </p>
      <h1 className="mt-6 max-w-2xl font-display text-[clamp(32px,5vw,56px)] font-light leading-[1.05]">
        {isChunkError
          ? 'Reloading the page…'
          : 'That didn’t load cleanly.'}
      </h1>
      <p className="mt-5 max-w-md font-body text-base text-steel">
        {isChunkError
          ? 'A file dropped on the way in — fetching it again.'
          : 'A one-off hiccup. Give it another try.'}
      </p>
      {!isChunkError ? (
        <button
          type="button"
          onClick={reset}
          data-magnetic
          className="mt-10 inline-flex items-center justify-center bg-saffron px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
        >
          Try again
        </button>
      ) : null}
    </main>
  );
}
