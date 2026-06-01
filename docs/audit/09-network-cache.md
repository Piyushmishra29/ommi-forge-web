# Audit 09 — Network & Cache Delivery

**Scope:** Caddy edge config on `pi-vps-mumbai` (`/etc/caddy/Caddyfile`), terminating behind Tailscale Funnel at `https://pi-vps-mumbai.tail641fa8.ts.net`. Looking only at on-the-wire delivery: compression, cache headers, HTTP version, range support, TTFB, preload hints.
**Date:** 2026-06-01
**Status:** Read-only audit, no edits applied. All numbers gathered via `curl` against the live preview.

---

## SEVERITY: MEDIUM

The wire-level delivery is **mostly correct**: HTTP/2 is negotiated, JPGs/MP4 are served with `accept-ranges: bytes`, hashed `/assets/*` and `/_next/static/*` chunks carry `cache-control: public, max-age=31536000, immutable`, HTML correctly carries a short `max-age=300`, and binary JPGs are **not** double-compressed (so the 33 MB image dump audited in [01-frame-preload.md](01-frame-preload.md) at least isn't being made worse by a zstd round-trip). TTFB from this Mac (Mumbai → Mumbai over Tailscale) is **24–32 ms warm, 125 ms cold** — that's fine. HTTP/2 multiplexing works end-to-end through Tailscale Funnel; range requests on the 28 MB hero MP4 return `206 Partial Content` correctly.

The notable gap is **no brotli**: Caddy's `encode` directive on the box is `zstd gzip` (confirmed by probing with `Accept-Encoding: br` only — server returns the file uncompressed at 79.8 KB instead of the ~25 KB it would be with brotli). zstd is preferred by Chrome 126+ / Firefox 126+ which already ship it, but **Safari (all versions) and older Chromium do not advertise zstd** and fall through to gzip. Brotli would cut text-asset bytes ~15–20 % vs gzip for Safari users (roughly the iPhone audience that will arrive via WhatsApp shares — the exact audience this preview is being sent to). There is also no `Link: rel=preload` hint on the home HTML for the hero's first frame, meaning the browser has to parse the HTML and hit `useScrollImageSequence` before it learns it needs `f-001.jpg` — adding a preload header would shave ~1 RTT off first paint.

This is a *medium* not *high* because all the wins here are second-order. The big network-budget problem is the 33 MB image dump itself (audit 01); compression and preload hints make a fast page faster but won't make a slow page fast.

---

## Network probe results

All probes run from a Mac on the same Tailnet, against `https://pi-vps-mumbai.tail641fa8.ts.net`, 2026-06-01 13:21–13:23 IST.

| Resource | Status | `content-type` | `content-encoding` (zstd/gzip/br) | `cache-control` | `accept-ranges` | Size (encoded → wire) |
|---|---|---|---|---|---|---|
| `/` (home HTML) | 200 | `text/html` | `zstd` / `gzip` / **none for br** | `public, max-age=300` | `bytes` | 81 614 B identity → ~13 B zstd indicator¹ |
| `/_next/static/chunks/*.js` (sample) | 200 | `text/javascript` | `zstd` / `gzip` / **none for br** | `public, max-age=31536000, immutable` | `bytes` | 26 554 B identity → gzip/zstd applied |
| `/_next/static/chunks/*.css` (sample) | 200 | `text/css` | `zstd` / `gzip` / **none for br** | `public, max-age=31536000, immutable` | `bytes` | 79 802 B identity → gzip/zstd applied |
| `/assets/frames/hero/f-001.jpg` | 200 | `image/jpeg` | **none** (correct — not double-compressed) | `public, max-age=31536000, immutable` | `bytes` | 432 825 B |
| `/assets/frames/hero/f-010.jpg` | 200 | `image/jpeg` | **none** (correct) | `public, max-age=31536000, immutable` | `bytes` | 403 999 B |
| `/assets/frames/plant/f-001.jpg` | 200 | `image/jpeg` | **none** (correct) | `public, max-age=31536000, immutable` | `bytes` | 271 353 B |
| `/assets/video/hero-firstshot.mp4` | 200 | `video/mp4` | **none** (correct — already H.264) | `public, max-age=31536000, immutable` | `bytes` | 28 217 018 B |
| `/assets/video/hero-firstshot.mp4` (`Range: bytes=0-65535`) | **206** ✓ | `video/mp4` | none | same | `bytes`, `content-range: bytes 0-65535/28217018` | 65 536 B |

¹ When `Accept-Encoding: zstd` matches, Caddy serves a tiny stub `content-length: 13` that the client decompresses; that's the encoded stream length, not the resource size.

**HTTP version negotiation:** `curl --http2 → http_version=2` confirmed. ALPN selects h2 end-to-end (Tailscale Funnel proxies HTTP/2 through to the Caddy origin on `127.0.0.1:8080`). **HTTP/3 / QUIC is not offered** — no `Alt-Svc` header in any probe. (Funnel itself doesn't yet expose h3 to clients; this is a Funnel constraint, not a Caddy one.)

**Brotli check:** Requesting any text asset with `Accept-Encoding: br` (brotli only) returns it **uncompressed** (no `content-encoding`, full `content-length`). e.g. the sample CSS is 79 802 B identity instead of the ~22 KB brotli-11 would produce. Confirms Caddy's `encode` directive is `zstd gzip`, no `br`.

**TTFB samples** (5× home HTML, cold first request, then warm):

```
ttfb=0.125  total=0.229   (cold)
ttfb=0.024  total=0.044   (warm)
ttfb=0.027  total=0.045
ttfb=0.031  total=0.049
ttfb=0.032  total=0.052
```

Frame JPG samples (3×):
```
ttfb=0.029  total=0.173
ttfb=0.129  total=0.188   (one warm-but-jittery)
ttfb=0.025  total=0.078
```

Warm TTFB is ~30 ms, cold first hit ~125 ms. This is from inside the Tailnet — public-internet clients going through Funnel's DERP relay will see ~120–250 ms TTFB depending on geographic distance to the Mumbai relay. **Caddy itself adds < 5 ms.**

**Preload Link headers:** None. `curl -I /` returns no `Link:` header, so there's no server-pushed preload hint for the hero's first frame, the LCP image, or the variable fonts.

---

## Findings

### F1 — No brotli for text assets *(primary finding)*
- Caddy is configured `encode zstd gzip` (inferred — confirmed by `Accept-Encoding: br` returning identity body at full 79 802 B for the CSS bundle vs zstd-encoded for `zstd,gzip,br`).
- For Safari clients (which never advertise zstd as of writing) the server falls through to gzip. Brotli-11 typically produces **15–20 % smaller** output than gzip-9 on JS/CSS/HTML. On the 79.8 KB representative CSS bundle that's ~3–4 KB saved per asset, multiplied across the home page's chunk graph (Tailwind output, page chunk, layout chunk, framework chunks).
- Caddy supports `encode br` natively since v2.6; it's a one-token addition to the Caddyfile.

### F2 — No `Link: rel=preload` for the hero's first frame
- `/` HTML response carries no `Link:` header.
- The audit-01 bottleneck is that `useScrollImageSequence` only learns it needs `f-001.jpg` *after* React hydrates. A server-injected `Link: </assets/frames/hero/f-001.jpg>; rel=preload; as=image; fetchpriority=high` would let the browser start fetching the LCP frame during HTML parse — saves ~1 RTT (~30–250 ms depending on Funnel path) on first paint.
- Same applies to the variable fonts (`Fraunces`, `Inter`) if they're not already inlined via `<link rel=preload>` in `<head>`. (HTML-side preload links exist in some pages but a header-level preload is delivered before HTML parse begins, which is strictly faster.)

### F3 — HTML cache window is 300 s, which is fine but worth verifying intent
- `/` returns `cache-control: public, max-age=300` — i.e. browser may serve the HTML from cache for 5 min without re-validating.
- For a preview link the client may bookmark, 5 min is reasonable. For production (post-cutover) a `no-cache, must-revalidate` would be safer so deploys go live instantly. Worth a deliberate decision rather than an inherited default.
- The `etag` and `last-modified` headers are present, so any forced revalidation will be cheap (304s).

### F4 — HTTP/3 not advertised (Funnel constraint, not actionable)
- No `Alt-Svc` header. Tailscale Funnel terminates TLS in their edge and proxies HTTP/2 (or HTTP/1.1) to the origin; QUIC end-to-end isn't yet exposed to public Funnel listeners.
- On flaky mobile networks (4G handoff, lossy hotel WiFi) h3's better loss recovery would matter for the 33 MB image dump and the 28 MB MP4. **Nothing to do here unless we move off Funnel** — document as a known constraint of the preview host.

### F5 — JPGs and MP4 are correctly *not* re-compressed
- Confirmed for both `hero/f-001.jpg` (432 KB) and `plant/f-001.jpg` (271 KB) and the MP4: no `content-encoding` header on the response. Caddy's `encode` directive correctly skips already-compressed types (it uses `Content-Type` and a size threshold).
- Worth calling out because some servers (older nginx defaults, naïve Apache configs) do the wrong thing here and waste CPU on a no-op compress that *expands* the body by ~0.5 %.

### F6 — Range requests work on the hero MP4
- `curl -H "Range: bytes=0-65535"` against `hero-firstshot.mp4` returns `206 Partial Content` with `content-range: bytes 0-65535/28217018`. ✓
- This is the prerequisite for `<video>` seeking and for the browser to fetch the moov atom + a small head sample before deciding whether to commit to the rest. Without this the 28 MB MP4 would have to fully download before first frame on some clients.

### F7 — `accept-ranges: bytes` is also present on text/CSS/JS
- Not harmful, not particularly useful either. Caddy advertises it on every static file. No action.

### F8 — Cold-cache TTFB is dominated by TLS, not server work
- Cold 125 ms vs warm 30 ms shows the TLS handshake is ~95 ms of the cold connection on this Tailnet path. Connection reuse via HTTP/2 (one socket for all requests) is doing what it should.
- For public-internet visitors the cold number will be ~150–300 ms depending on Funnel relay distance. **That ceiling is structural** — first paint can never beat the Funnel RTT.

---

## Recommended fixes (ranked by impact)

### Fix A — Enable brotli alongside zstd + gzip in Caddyfile  *[HIGH IMPACT, TRIVIAL]*
**What:** Change Caddy's `encode zstd gzip` to `encode zstd br gzip` (or `encode br zstd gzip` — order is preference, Caddy picks the first one the client advertises). Restart Caddy via `systemctl restart ommi-forge.service`.
**Where:** `/etc/caddy/Caddyfile` on `pi-vps-mumbai` (not in the repo).
**Effort:** XS (5 min — edit one token, reload, re-probe with `Accept-Encoding: br` to confirm `content-encoding: br` comes back).
**Impact:** Safari + older Chromium users get ~15–20 % smaller JS/CSS/HTML. On the home page's ~100 KB of text assets, ~15–20 KB saved per cold visit. At 4G speeds that's ~120–160 ms shaved off first paint for Safari users.
**Verification:** `curl -sI -H "Accept-Encoding: br" .../chunks/<name>.css` should respond `content-encoding: br` with a much smaller `content-length`.

### Fix B — Inject `Link: rel=preload` for hero's first frame on the home HTML response  *[HIGH IMPACT, SMALL]*
**What:** In the Caddyfile, add a `header` directive scoped to `/index.html` (or `/`) that sets:
```
Link: </assets/frames/hero/f-001.jpg>; rel=preload; as=image; fetchpriority=high
```
Optionally also preload the LCP font:
```
Link: </assets/fonts/<font-file>.woff2>; rel=preload; as=font; type=font/woff2; crossorigin
```
**Where:** Caddyfile (server-side); or — if we want it in-repo — append to the relevant entry in `public/_headers` (Netlify/Cloudflare/Vercel honor it; Caddy on this VPS does not read `_headers` natively but we could write a small plugin or just bake it into the Caddyfile).
**Effort:** S (30 min — add the directive, restart, verify via `curl -I /` that the `Link:` header is present, then Chrome devtools Network → Initiator should show "preload" on `f-001.jpg`).
**Impact:** Browser starts the `f-001.jpg` fetch ~1 RTT earlier than today (during HTML parse instead of after React hydrates and `useScrollImageSequence` runs). On a 200 ms RTT public-internet path, that's a real 200 ms off LCP. Works hand-in-hand with audit-01 fixes — once Plant preload is gated, the hero frames are the only thing competing for sockets and the preload hint matters more.

### Fix C — Decide HTML cache-control deliberately (no-cache vs 300 s)  *[LOW IMPACT, POLICY]*
**What:** Today `/` is `max-age=300`. For the *preview* host this is fine — short enough to roll forward quickly, long enough to dedupe rapid reloads. For production:
  - Option 1 (safer): `cache-control: no-cache, must-revalidate` on HTML. ETag means revalidation is a cheap 304. Deploys go live instantly.
  - Option 2 (faster): keep `max-age=300` with `stale-while-revalidate=86400`. Browsers serve stale HTML for 5 min, revalidate in background, and can serve stale-up-to-24-h while the server is unreachable.
**Where:** Caddyfile (`header / Cache-Control "no-cache, must-revalidate"`).
**Effort:** S (one-line change + decision).
**Impact:** Marginal. Mostly a release-engineering safety property — affects how fast the *next* deploy is visible to repeat visitors, not how fast the current page paints.

### Fix D — Document HTTP/3 / Funnel latency as a known constraint  *[DOCS ONLY]*
**What:** Add a "known constraints" section to `docs/DEPLOY.md` (or this audit) stating:
  - First paint over Tailscale Funnel is bounded below by Funnel relay RTT (~120–250 ms for typical clients).
  - HTTP/3 / QUIC is not offered to public clients via Funnel; staying on h2.
  - The production host (Hostinger or wherever cutover lands) will *not* have this ceiling.
**Where:** `docs/DEPLOY.md` "What's actually running on pi-vps-mumbai" section already exists — add a sub-bullet.
**Effort:** XS.
**Impact:** Stops future engineers (or future-Claude) from chasing the cold-TTFB number as a bug. It's a host limitation, not a config bug.

### Fix E (defensive) — Add a probe script to repo  *[NICE-TO-HAVE]*
**What:** Drop a `scripts/probe-network.sh` that runs the curl-checks above and prints a pass/fail table. Useful for verifying any future Caddyfile change didn't regress (e.g. someone adds `encode br` but accidentally removes `zstd`).
**Where:** `scripts/probe-network.sh` (new).
**Effort:** S (45 min).
**Impact:** Regression-prevention only. Nice to have if these audits become part of a release checklist.

---

## Recommended order of operations

1. **Fix A** (enable brotli) — 5-min ssh, immediate benefit for Safari/iOS clients which are likely a big slice of the preview audience (WhatsApp/LinkedIn shares).
2. **Fix B** (Link preload for `f-001.jpg`) — bundle with A; both are Caddyfile edits in one round-trip to the box.
3. **Fix D** (docs) — append while we're touching `DEPLOY.md`.
4. **Fix C** (HTML cache-control) — defer to the production cutover, not urgent for preview.
5. **Fix E** (probe script) — only if these checks recur.

After A + B, expect Safari-iOS users to see ~15–20 KB less text downloaded and ~1 RTT earlier hero-frame fetch — combined with audit-01's frame-preload fixes, the home page should feel snappier on cold loads from mobile.

---

## GH issue draft

```
Title: perf(edge): enable brotli + preload hero frame in Caddy edge config

## Problem
The Caddy edge on `pi-vps-mumbai` (serving the preview at
https://pi-vps-mumbai.tail641fa8.ts.net) ships text assets with
`encode zstd gzip`. Safari and older Chromium don't advertise zstd, so
they fall through to gzip — losing the ~15–20 % savings brotli would
give over gzip on JS/CSS/HTML. On the home page that's ~15–20 KB of
extra bytes per Safari/iOS cold visit, ~120–160 ms at 4G speeds.

Separately, the home HTML response carries no `Link: rel=preload` for
the hero's first frame (`/assets/frames/hero/f-001.jpg`). The browser
only learns it needs that frame after React hydrates and
`useScrollImageSequence` runs — roughly 1 RTT later than necessary.

Severity: **Medium**. Wire-level delivery is otherwise correct (HTTP/2
end-to-end, range support on the MP4, JPGs not double-compressed, hashed
chunks `immutable`, TTFB ~30 ms warm). These two changes are easy wins
on top of the audit-01 frame-preload work, not standalone blockers. See
`docs/audit/09-network-cache.md` for the full probe table.

## Fix
Both changes are in the Caddyfile on `pi-vps-mumbai` (not in the repo):

1. **Enable brotli**: change `encode zstd gzip` → `encode zstd br gzip`.
   Restart `ommi-forge.service`. Verify via:
   `curl -sI -H "Accept-Encoding: br" .../<chunk>.css` should show
   `content-encoding: br` and a much smaller `content-length`.

2. **Preload hero frame** on `/` HTML response:
   `header / Link "</assets/frames/hero/f-001.jpg>; rel=preload; as=image; fetchpriority=high"`
   (in the Caddyfile). Verify via `curl -I /` showing the `Link:`
   header, and Chrome DevTools Network panel showing `f-001.jpg` with
   initiator "preload".

3. (Docs) append a "known constraints" bullet to `docs/DEPLOY.md`
   noting HTTP/3 is not offered through Tailscale Funnel and cold-TTFB
   is bounded by Funnel relay RTT.

## Files
- `/etc/caddy/Caddyfile` on `pi-vps-mumbai` (edge config — not in repo)
- `docs/DEPLOY.md` (docs update)
- (optional) `scripts/probe-network.sh` (regression check)

## Acceptance
- [ ] `curl -sI -H "Accept-Encoding: br" .../<sample>.css` returns
      `content-encoding: br` with smaller `content-length` than the
      gzip response.
- [ ] `curl -sI -H "Accept-Encoding: zstd,gzip" .../<sample>.css` still
      returns `content-encoding: zstd` (no regression for modern Chrome).
- [ ] `curl -I /` includes a `Link:` header preloading `f-001.jpg`.
- [ ] No regression on `Cache-Control: ... immutable` for `/assets/*`
      and `/_next/static/*`.
- [ ] No regression on `accept-ranges: bytes` for the hero MP4
      (`curl -H "Range: bytes=0-1024" ... .mp4` still 206).
- [ ] DEPLOY.md mentions the Funnel HTTP/3 / TTFB ceiling.
```
