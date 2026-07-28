/**
 * WebGL capability probe.
 *
 * Why this file exists
 * --------------------
 * `CanvasErrorBoundary` catches a WebGL failure *after* `<Canvas>` has
 * already tried to mount a `WebGLRenderer` — the user sees a flash of empty
 * stage first, and on some locked-down browsers the throw comes with a
 * console error we can't suppress. Probing first means a machine without
 * WebGL never mounts a canvas at all: `<SceneSlot>` renders its `fallback`
 * (real render images + text) on the very first paint, which is the
 * behaviour the brief asks for — degradation as a first-class path.
 *
 * The boundary stays as the second line of defence for failures a probe
 * can't predict (context limit hit by the *nth* canvas, driver reset).
 */

export type WebGLSupport = 'ok' | 'unsupported';

let cached: WebGLSupport | null = null;

/**
 * True if this browser can give us a WebGL2 (or WebGL1) context right now.
 *
 * Cached after the first call: the probe allocates a throwaway context, and
 * on browsers with a low context cap (Safari ≈ 16) burning one per query is
 * itself a way to break the page. The throwaway is explicitly released via
 * `WEBGL_lose_context` so it does not count against that cap.
 *
 * Returns `'unsupported'` on the server — callers must treat SSR as
 * "unknown yet" and only trust this after mount, which `useWebGLSupport()`
 * handles.
 */
export function detectWebGL(): WebGLSupport {
  if (cached) return cached;
  if (typeof document === 'undefined') return 'unsupported';

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      // Some older Android WebViews only answer to the experimental name.
      canvas.getContext('experimental-webgl');

    if (!gl) {
      cached = 'unsupported';
      return cached;
    }

    // Hand the context back immediately. Without this the probe holds a
    // live context until GC runs, and Safari's hard cap counts it.
    const lose = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_lose_context',
    );
    lose?.loseContext();

    cached = 'ok';
    return cached;
  } catch {
    cached = 'unsupported';
    return cached;
  }
}

/**
 * Forget the cached probe result. Only used when a lost context is
 * restored, so the next mount re-probes instead of trusting a stale 'ok'.
 */
export function resetWebGLProbe(): void {
  cached = null;
}
