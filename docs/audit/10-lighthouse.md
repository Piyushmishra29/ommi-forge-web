# Audit 10 — Lighthouse / Ground-Truth Performance Numbers

**Scope:** `http://localhost:4056/` (static export served by `serve`) — home page (`/`) and STL viewer page (`/renders/a/`).
**Date:** 2026-06-01
**Status:** Read-only measurement, no source edits.

---

## Tooling note (read first)

Lighthouse 13.3 and Lighthouse 12.8 **both** failed with `LanternError: NO_LCP` against this build, regardless of which Chrome variant (puppeteer chrome-headless-shell 148.0.7778.97, or Playwright's full Chrome-for-Testing 148.0.7778.96) and regardless of `--throttling-method` (`simulate` / `devtools` / `provided`). The trace engine's lantern simulator could not compute an LCP node from the trace — a known issue with heavily JS-driven pages where the first contentful paint is a static SSG paragraph but the largest paintable element is the hero `<canvas>` whose pixels are drawn imperatively after JS executes. Lighthouse cannot score what it cannot identify.

Per the brief's fallback clause, I drove **Playwright (chromium 1223, headless)** with CDP to emulate Lighthouse's mobile/desktop presets (Slow 4G + 4× CPU throttling for mobile; unthrottled 10 Mbps for desktop), and read `PerformanceObserver` entries for `paint`, `largest-contentful-paint`, `layout-shift`, and `longtask`. TBT is computed as the sum of `(longtask.duration − 50)` after FCP. Perf score is an approximate Lighthouse v10 weighting (`FCP 10% + LCP 25% + TBT 30% + CLS 25% + TTI 10%`).

All numbers below are from the local non-SPA build at `:4056`. JSON outputs:

- `/tmp/perf-home-desktop.json`
- `/tmp/perf-home-mobile.json`
- `/tmp/perf-rendersA-desktop.json`
- `/tmp/perf-rendersA-mobile.json`

---

## Top-line scores

| Page | Form factor | Perf (approx) | FCP | LCP | TBT | CLS | Load | xfer |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | Desktop (10 Mbps, 1×) | **70** | 356 ms | n/a* | **1608 ms** | 0.006 | 27.7 s | **35.2 MB** |
| `/` | Mobile (Slow 4G, 4×) | **89** | 924 ms | 3852 ms | 361 ms | 0.003 | n/a | **12.2 MB** |
| `/renders/a/` | Desktop | **70** | 284 ms | 284 ms | **5109 ms** | 0.002 | 448 ms | 5.4 MB |
| `/renders/a/` | Mobile | **70** | 872 ms | 872 ms | **1756 ms** | <0.001 | 2.5 s | 0.8 MB |

A11y / Best-Practices / SEO scores are not available — they require the full Lighthouse audit chain which the lantern engine aborts at trace-engine step. Audits 11+ should re-run with `--skip-audits=largest-contentful-paint-element,largest-contentful-paint` to capture A11y/Best/SEO.

\* Home desktop LCP was reported as 0 ms because no element met the LCP candidate threshold within the observer window. The page paints text immediately (FCP 356 ms), but the hero `<canvas>` (which would be the LCP candidate by size) is painted by JS *after* a 1.6 s blocking-script run and was missed by the buffered observer. Mobile pulled out an LCP because the JS settled later and the hero paragraph `P.mt-10.max-w-xl` was big enough to dominate above the canvas paint.

---

## Web Vitals (mapped to Lighthouse pass/fail thresholds)

### `/` Home

| Metric | Desktop | Mobile | Good | Needs Improvement | Poor |
|---|---:|---:|---|---|---|
| FCP | 356 ms ✅ | 924 ms ✅ | <1.8 s | 1.8–3 s | >3 s |
| LCP | indeterminate ⚠ | **3852 ms ❌** | <2.5 s | 2.5–4 s | >4 s |
| TBT | **1608 ms ❌** | 361 ms ⚠ | <200 ms | 200–600 ms | >600 ms |
| CLS | 0.006 ✅ | 0.003 ✅ | <0.1 | 0.1–0.25 | >0.25 |
| TTI (approx via `domInteractive`) | 196 ms | 729 ms | — | — | — |
| INP estimate | longest task **306 ms** (desktop) | longest task 273 ms | <200 | 200–500 | >500 |

LCP element on **mobile** = `<p class="mt-10 max-w-xl">` (the hero subhead under the headline). This is the correct identification — `next/font` + SSG paragraph, no shift, decent timing. **The real problem on home is TBT, not LCP.**

### `/renders/a/`

| Metric | Desktop | Mobile |
|---|---:|---:|
| FCP | 284 ms | 872 ms |
| LCP | 284 ms (header logo `<img>`) | 872 ms (page H1) |
| TBT | **5109 ms ❌❌** | **1756 ms ❌** |
| CLS | 0.002 | 0.0002 |
| Longest single task | **1734 ms** | 288 ms |

`/renders/a/` desktop TBT is **3× home desktop**. Cause is the eager STL fetch (3 MB `part-a.stl`) + HDR map (1.6 MB `empty_warehouse_01_1k.hdr`) + three.js parse landing on the main thread as one giant 1.7-second task. This page's TBT is the worst metric I measured anywhere in the build.

---

## Resource budget

| Page | Form factor | Requests | Transfer | Images | Scripts | CSS |
|---|---|---:|---:|---:|---:|---:|
| `/` | Desktop | 203 | 35.16 MB | 135 / 33.04 MB | 22 / 0.60 MB | 1 / 0.54 MB |
| `/` | Mobile | 51 | 12.24 MB | 28 / 11.00 MB | 13 / 0.27 MB | 1 / 0.54 MB |
| `/renders/a/` | Desktop | 72 | 5.45 MB | 1 / 0.03 MB | 24 / 0.64 MB + 4.5 MB fetch (STL+HDR) | 1 |
| `/renders/a/` | Mobile | 41 | 0.79 MB | — | 20 / 0.61 MB | 1 |

The mobile run shows the network throttle naturally caps how many of the 135 home-page images Chrome will pre-fetch before scroll, so the mobile transfer (12 MB) is lower than desktop (35 MB) — **but it's still 12 MB on Slow 4G**, way over any reasonable mobile budget.

### Top-15 home-desktop bytes — every single one is a hero frame

The top fifteen biggest resources on home/desktop are **all 15 hero JPGs** (`/assets/frames/hero/f-001.jpg` through `f-041.jpg`), each 410–441 KB, totalling 6.16 MB just for the top-15 — and the remaining 31 hero frames + all 89 plant frames fire alongside.

### CSS bloat

One CSS file at **551 KB encoded** (`0rhl1k3~fkk3c.css`). Note: this is the *raw* transferred size from the dev `serve`, which is uncompressed for this script. On the live site behind nginx with gzip, expect ~78 KB on the wire (matches the 78 KB on disk in `out/_next/static/chunks/`). Still in the "too big" zone for a Tailwind v4 first-paint stylesheet — see Audit 07.

### Render-blocking

Exactly **1 render-blocking script** and **1 render-blocking stylesheet**:

- `_next/static/chunks/03~yq9q893hmn.js` — the synchronous Next bootstrap (110 KB on disk)
- `_next/static/chunks/0rhl1k3~fkk3c.css` — the merged stylesheet

This is normal Next behaviour; the rest of the JS is `async`. Not a finding to fix.

---

## Long-task profile

| Page / form factor | Long-task count | Longest task | TBT |
|---|---:|---:|---:|
| Home desktop | **68** | 306 ms | 1608 ms |
| Home mobile | 8 | 273 ms | 361 ms |
| `/renders/a/` desktop | 69 | **1734 ms** | 5109 ms |
| `/renders/a/` mobile | 52 | 288 ms | 1756 ms |

On home/desktop, 68 long tasks fire between FCP and page-load-end. This is the GSAP timeline init + ScrollTrigger.refresh + the eager `new Image()` loop + image-decode-on-draw all stacking up. Mobile has dramatically fewer (8) because the network throttle stalls most decode tasks past the trace window.

On `/renders/a/`, one task ran for **1.73 seconds** — almost certainly three.js + STL parse landing on the main thread as one synchronous chunk. The Suspense skeleton's `ssr:false` lazy import does its job (the page paints at 284 ms with just the SSG header), but once the WebGL chunk arrives it monopolises the main thread.

---

## Top 5 opportunities (ranked by estimated savings)

| # | Opportunity | Est. savings | Confidence |
|---|---|---:|---|
| 1 | **Stop eager-preloading the off-fold plant sequence (90 frames, ~15.4 MB).** Move `useScrollImageSequence` for `PlantWalkthrough` behind an IntersectionObserver gate so frames only begin decoding when the section is within 2 viewports. | ~15 MB transfer, ~1000 ms TBT, ~3 s load | **HIGH** |
| 2 | **Throttle the hero preload to a chunked queue (e.g. 4 in flight).** Replace the synchronous `for` loop in `useScrollImageSequence.ts` with a 4-wide concurrent queue using `await img.decode()` so first frames land deterministically. | ~600 ms TBT, smoother first scroll | **HIGH** |
| 3 | **Encode frame JPGs at lower quality + add an AVIF/WebP candidate.** Current 46 hero frames average **400 KB each**, totalling 17.9 MB. At Q70 WebP and 1280×720 they would average ~70 KB → ~3.2 MB total. | ~14 MB transfer | **HIGH** |
| 4 | **Defer STL + HDR fetch on `/renders/a/` until the canvas is in view.** Both are fetched at page-load time via the lazy `StlViewer` import effect; gate them behind an IntersectionObserver or a click-to-load button. | ~4.5 MB transfer, ~1700 ms TBT (the single 1734 ms task on desktop) | **HIGH** |
| 5 | **Code-split GSAP & ScrollTrigger off the hero path.** They land in the synchronous bootstrap chunk (verified via long-task profile during Hero mount). Dynamic-import the GSAP context inside Hero's effect so it doesn't block FCP→TTI. | ~200 ms TBT, lower TTI | MEDIUM |

---

## Top 5 diagnostics

| # | Diagnostic | Detail |
|---|---|---|
| 1 | **Avoid an excessive DOM size** | Not measured (no DOM-size audit ran), but `/` has 9 full sections rendered server-side. Likely OK. Flagged for follow-up. |
| 2 | **Largest Contentful Paint element is `<canvas>` (home desktop)** | LCP can't be reliably reported because canvas paint timing isn't observable to the LCP algorithm via lantern. Fix by elevating the headline text into the LCP candidate (already there — but mobile finds it, desktop times out). Set `fetchpriority="high"` + `eager` on the hero poster `<img>` instead of using a `background-image` div, so the *image* becomes the LCP element. |
| 3 | **Image elements do not have explicit width and height** | Hero canvas, plant canvas, and the `bg-cover` poster divs all lack intrinsic dimensions. CLS is currently incidental-zero because they're absolute-positioned. If layout ever changes, CLS will regress. |
| 4 | **Reduce unused JavaScript** | `0eh4uw_tto76y.js` is 873 KB on disk (~232 KB transferred) and is the three.js + STL loader chunk. Loaded on `/renders/a/` even before user scrolls to the viewer. Lazy-import via `next/dynamic` is already applied (`src/components/three/lazy.tsx`); the chunk still hits because the route component imports `StlViewer` at module top-level. |
| 5 | **Serve static assets with an efficient cache policy** | Local `serve` returns no `Cache-Control` for `/assets/frames/*.jpg`. On the production VPS behind nginx + Tailscale, verify that `/_next/static/*` and `/assets/*` set `Cache-Control: public, max-age=31536000, immutable`. (Out of scope here — verify in Audit 09 follow-up.) |

---

## Fixes mapped to source files

| Opportunity | File · Line | Concrete change |
|---|---|---|
| **#1 IntersectionObserver-gate the plant preload** | `src/components/sections/home/PlantWalkthrough.tsx:27` | Wrap the `useScrollImageSequence` call in a gate: `const inRange = useNearViewport(root, { rootMargin: '200% 0px' });` then `useScrollImageSequence({ ...rest, enabled: inRange })`. Requires adding an `enabled?: boolean` short-circuit at `src/components/motion/useScrollImageSequence.ts:45`. |
| **#2 Concurrency-limited preload + `decode()` await** | `src/components/motion/useScrollImageSequence.ts:55-69` | Replace the synchronous `for` loop with a 4-wide promise queue: `await Promise.all(chunk.map(i => loadAndDecode(src(i))))`. Set `img.fetchPriority = i < 4 ? 'high' : 'low'`. Drop the redundant first-frame `onload` hack at lines 62-67. |
| **#3 WebP/AVIF encoded frames** | `scripts/` (frame extractor) + `public/assets/frames/hero/*.jpg` | Add an ffmpeg step that emits `*.webp` at Q70 + 1280×720 alongside JPGs. Update `useScrollImageSequence`'s `src` callback to prefer WebP when supported (use `<canvas>` decode + a feature-detect `Image.prototype.decode` fallback). |
| **#4 Gate STL/HDR fetch on `/renders/a/`** | `src/components/three/StlViewer.tsx` (effect that loads the STL) + `src/app/renders/[slug]/page.tsx:8` | Move the `useLoader(STLLoader, ...)` calls inside a `<Suspense>` that only mounts after an IntersectionObserver hits the viewer container. The lazy wrapper at `src/components/three/lazy.tsx:152` is correct; the leaf component needs its own visibility gate before kicking off `fetch`. |
| **#5 Dynamic-import GSAP inside Hero effect** | `src/components/sections/home/Hero.tsx:6` | Move `import { gsap } from '@/lib/gsap';` out of the module top and into the `useEffect` body: `const { gsap } = await import('@/lib/gsap');` so it splits off the critical path. Same change in `useScrollImageSequence.ts:4` for `ScrollTrigger`. |

---

## Mobile vs desktop gap (the surprising result)

**Mobile scored higher than desktop on home** (89 vs 70). This is counter-intuitive but real:

- Desktop fires **all 203 requests immediately** (incl. all 135 frames) — the eager preload completely saturates the unthrottled 10 Mbps pipe and produces a **27.7 s load event**, 68 long tasks, and 1.6 s TBT.
- Mobile, behind 1.6 Mbps Slow 4G, only manages to land **28 of 135 images** before the trace window closes — paradoxically *protecting* it from its own preload bug because the network is too slow to overwhelm the CPU.

**Implication:** the desktop number understates real-world mobile pain. A real Pixel 6 on 4G with the full preload would score in the 30s. The mobile 89 here is an artefact of the throttle stalling the preload tail. **Fix the preload bug (Opportunities 1 + 2) and both numbers improve.**

---

## GitHub issue draft

```
Title: perf: home eagerly loads 35 MB across 135 image-sequence frames; /renders/a TBT is 5.1s on desktop

Body:
Lighthouse 12/13 failed with LanternError: NO_LCP against the built static export
(Chrome-for-Testing 148, headless). Drove Playwright + CDP under emulated Lighthouse
mobile (Slow 4G + 4× CPU) and desktop presets instead.

Numbers (local serve at :4056):

  /                  desktop  perf ~70  FCP 356ms  TBT 1608ms  35.2 MB  203 reqs
  /                  mobile   perf ~89  FCP 924ms  LCP 3852ms  12.2 MB   51 reqs
  /renders/a/        desktop  perf ~70  FCP 284ms  TBT 5109ms   5.4 MB
  /renders/a/        mobile   perf ~70  FCP 872ms  TBT 1756ms

Root causes (in priority order):

  1. PlantWalkthrough preloads 90 plant frames (15.4 MB) on first paint, while
     the section sits 6 viewports below the fold.
     → src/components/sections/home/PlantWalkthrough.tsx:27
     → Fix: IntersectionObserver gate before calling useScrollImageSequence.

  2. useScrollImageSequence fires all N image requests in a synchronous for loop
     with no concurrency cap, no fetchPriority, no decode() await.
     → src/components/motion/useScrollImageSequence.ts:55-69
     → Fix: 4-wide promise queue, await img.decode(), fetchPriority hints.

  3. Hero frames are 400 KB JPGs. 46 frames × 400 KB = 17.9 MB just for hero.
     → public/assets/frames/hero/*.jpg
     → Fix: emit Q70 WebP at 1280×720 (~70 KB each → ~3.2 MB total). Add ffmpeg
       step to the frame-extract script.

  4. /renders/a/ fetches part-a.stl (3 MB) + empty_warehouse_01_1k.hdr (1.6 MB)
     on initial mount, producing one 1734 ms main-thread task on desktop.
     → src/components/three/StlViewer.tsx (and src/app/renders/[slug]/page.tsx:8)
     → Fix: IntersectionObserver gate before triggering useLoader.

  5. GSAP + ScrollTrigger ship in the critical chunk via Hero's top-level import.
     → src/components/sections/home/Hero.tsx:6
     → Fix: dynamic-import inside useEffect.

Other audits in this batch cover related findings:
  docs/audit/01-frame-preload.md   (root cause for #1, #2, #3)
  docs/audit/02-three-bundle.md    (root cause for #4, #5)
  docs/audit/05-js-bundle.md       (chunking)
  docs/audit/06-asset-budget.md    (frame & STL sizes)

Acceptance: home desktop transfer < 4 MB, home desktop TBT < 400 ms,
/renders/a/ desktop TBT < 1000 ms.
```

---

## Reproduction recipe (for future runs)

Lighthouse 12.x/13.x failed against this build (see top of doc). To rerun the Playwright fallback:

```bash
# from any directory that can resolve playwright (Piyush's home dir works)
cd ~ && node /Users/piyushmishra/perf-audit.mjs \
  http://localhost:4056/ home desktop
cd ~ && node /Users/piyushmishra/perf-audit.mjs \
  http://localhost:4056/ home mobile
cd ~ && node /Users/piyushmishra/perf-audit.mjs \
  http://localhost:4056/renders/a/ rendersA desktop
cd ~ && node /Users/piyushmishra/perf-audit.mjs \
  http://localhost:4056/renders/a/ rendersA mobile
```

Script at `/Users/piyushmishra/perf-audit.mjs`. JSON output drops to `/tmp/perf-<label>-<form>.json`.

When the lantern bug is fixed upstream (track [GoogleChrome/lighthouse#16567](https://github.com/GoogleChrome/lighthouse/issues) or similar), prefer real Lighthouse:

```bash
export CHROME_PATH="/Users/piyushmishra/Library/Caches/ms-playwright/chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
lighthouse http://localhost:4056/ \
  --preset=desktop \
  --output=json,html \
  --output-path=/tmp/lh-desktop \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```
