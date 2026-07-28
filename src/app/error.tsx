'use client';

import Link from 'next/link';
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
    // A <section>, not a <main>: this boundary renders *inside* the root
    // layout's <main id="main">, so a nested landmark here would give the
    // document two mains and two `#main` ids — which quietly breaks the
    // skip link (it would resolve to whichever comes first). Height is
    // the viewport minus the fixed header the layout already pads for,
    // otherwise the error screen is always one header-height too tall
    // and every crash arrives with a phantom scrollbar.
    <section
      aria-labelledby="error-heading"
      className="flex min-h-[calc(100dvh-var(--header-h))] flex-col items-center justify-center bg-graphite px-6 py-20 text-center"
    >
      {/* saffron, not ember: ember is 2.98:1 on graphite and is forbidden
          on the dark ground (§2.2). Same substitution below on the rule
          and the mailto. */}
      <p className="type-eyebrow">
        {isChunkError ? 'Reconnecting' : 'Something slipped'}
      </p>
      <h1 id="error-heading" className="type-display-l mt-6 max-w-2xl text-balance">
        {isChunkError
          ? 'Reloading the page…'
          : 'That didn’t load cleanly.'}
      </h1>
      <p className="type-lede mt-6 max-w-[52ch] text-pretty">
        {isChunkError
          ? 'A file dropped on the way in — fetching it again.'
          : 'A one-off hiccup. Give it another try — the rest of the site is fine.'}
      </p>
      {!isChunkError ? (
        <>
          {/* Two exits, not one. "Try again" only helps when the fault was
              transient; if it isn't, a retry button is a dead end, so the
              floor is always one click away. */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              data-magnetic
              className="type-eyebrow inline-flex min-h-11 items-center justify-center bg-saffron px-8 py-4 text-graphite transition-colors hover:bg-mesh hover:text-graphite"
            >
              Try again
            </button>
            <Link
              href="/"
              data-magnetic
              // The v2 `border-graphite` outline was graphite-on-paper; on
              // graphite it is 1.00:1 and the button simply disappeared.
              // saffron carries both the edge and the label at 7.57:1.
              className="type-eyebrow inline-flex min-h-11 items-center justify-center border border-saffron px-8 py-4 text-saffron transition-colors hover:bg-saffron hover:text-graphite"
            >
              Back to the floor →
            </Link>
          </div>

          <span aria-hidden className="mt-14 inline-block h-px w-12 bg-saffron" />
          <p className="type-small mt-4">
            Still stuck? Email{' '}
            <a
              href="mailto:marketing@ommiforge.com"
              className="text-saffron underline decoration-1 underline-offset-4 transition-colors hover:text-mesh"
            >
              marketing@ommiforge.com
            </a>
          </p>
          {error?.digest ? (
            // The digest is the only handle support has on a production
            // stack trace (real messages are stripped in prod builds).
            // Surfacing it turns "it broke" into a searchable report.
            // `steel` was 2.28:1 on graphite — swarf is the dark-ground
            // grey and the only one that clears AA here.
            <p className="type-meta mt-3 font-eyebrow uppercase tracking-[0.26em]">
              Ref {error.digest}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
