import Script from 'next/script';

/**
 * Inline pre-hydration script that maps legacy WordPress slugs to
 * their App Router successors. Runs with `strategy="beforeInteractive"`
 * so the redirect fires BEFORE React hydrates — no visible flash of
 * the wrong page while we wait for `useEffect` to run.
 *
 * Why inline (not a useEffect)?
 * Next.js' `redirects()` config is a no-op under `output: 'export'`,
 * and `useEffect`-based redirects ship a render of the wrong page
 * first. A pre-hydration script gets us closest to a true HTTP
 * redirect without a server.
 *
 * Map kept in sync with `public/_redirects`. Every URL is canonicalised to trailing-
 * slash form to match `next.config.ts → trailingSlash: true`.
 */
const REDIRECT_SCRIPT = `(function() {
  var p = location.pathname;
  var map = {
    '/home/about-ommi-forge/': '/about/',
    '/home/solutuion/': '/solutions/',
    '/home/forged-products/': '/products/',
    '/3d-renders/': '/renders/',
    '/render-a/': '/renders/a/',
    '/render-b/': '/renders/b/',
    '/render-c/': '/renders/c/',
    '/render-d/': '/renders/d/',
    '/render-e/': '/renders/e/',
    '/render-f/': '/renders/f/',
    '/render-g/': '/renders/g/',
    '/render-h-2/': '/renders/h/',
    '/render-h/': '/renders/i/'
  };
  if (map[p]) location.replace(map[p]);
})();`;

export default function LegacyRedirects() {
  return (
    // The Next.js `no-before-interactive-script-outside-document`
    // rule is a holdover from the Pages Router. Per the App Router
    // docs, `beforeInteractive` scripts MUST live in the root layout
    // (which is exactly where this component is mounted), so the
    // warning is a false positive here.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="legacy-redirects"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }}
    />
  );
}
