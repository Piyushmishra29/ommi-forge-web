# Session handoff — Ommi Forge cinematic rebuild

_Last updated: 2026-05-29_

Client preview build of **ommiforge.com** (Ommi Forge Pvt. Ltd. — Indian steel
forging, est. 1975, plant in Malur, Karnataka). Large professional client —
"nothing can be wrong." The signature interaction is the scroll-scrub video
("crawl to play") and it **must work on mobile**.

## Stack & where things are

- Next.js 16 App Router, `output: 'export'` (static), Tailwind v4 (`@theme`), TS strict.
- R3F + drei (STL viewers, hammer hero), GSAP + ScrollTrigger + Observer, Framer Motion, Lenis.
- Repo: `github.com/Piyushmishra29/ommi-forge-web` (branch `main`).
- Source: `~/Desktop/ommi-forge-rebuild/`.

## Deploy (Pi VPS + Tailscale Funnel)

Live preview: **https://pi-vps-mumbai.tail641fa8.ts.net**

```bash
NEXT_PUBLIC_SITE_URL=https://pi-vps-mumbai.tail641fa8.ts.net pnpm build
rsync -az --delete out/ root@pi-vps-mumbai:/srv/ommi-forge/
```

- Served by Caddy on 127.0.0.1:8080 (gzip/zstd + HTTP Range/206 + `immutable`
  long-cache), persisted via systemd `ommi-forge.service`, exposed by Tailscale Funnel.
- `robots.txt` is `Disallow: /` for the preview. `NEXT_PUBLIC_SITE_URL` overrides
  `metadataBase` so the OG card points at the preview host.

Always verify after deploy: `curl -s -o /dev/null -w '%{http_code}'` the home
page + a sample of new assets, and confirm `cache-control: ...immutable` on assets.

## Scroll-scrub architecture (the important part)

MP4 `currentTime` seeking paints white on iOS (undecoded seeks), so **both**
scroll-scrub sections use the **Apple-style image-sequence + canvas** approach
instead — reliable + identical on mobile and desktop.

- Shared hook: `src/components/motion/useScrollImageSequence.ts`
  - `{ canvasRef, sectionRef, count, src:(i)=>url, end='+=220%', scrub=0.5 }`.
  - Preloads frames (0-based), pins the section, draws the frame for scroll
    progress cover-fit onto a `<canvas>`. OS reduced-motion → one static frame, no pin.
- **Hero** (`Hero.tsx`): 46 frames `/assets/frames/hero/f-001..046.jpg` (~4.7MB).
- **Plant walkthrough / Act 03** (`PlantWalkthrough.tsx`): 90 frames
  `/assets/frames/plant/f-001..090.jpg` (~6.9MB on server / 5.1MB source),
  decoded from the first ~9s of `walkthrough-scrub.mp4` at 10fps, 1000px wide.

Frame extraction recipe (system ffmpeg lacks libwebp → use JPG):
```bash
ffmpeg -y -i SRC.mp4 -t 9 -vf "fps=10,scale=1000:-2" -q:v 6 out/f-%03d.jpg
```

## Mobile pin policy

Stacked GSAP pins are janky on phones, so on mobile (`useStaticPins.ts`,
`max-width:767px` OR reduced-motion) the two heavy pinned sections render
**static** layouts:

- `HammerStrikeIntro.tsx` (Act 01, R3F) → `<HammerStatic/>`.
- `HeritageTimeline.tsx` (Act 05, horizontal track) → `<StaticList/>`.

So the only pins on mobile are Hero + Plant — both the reliable canvas scrub.
`src/lib/gsap.ts` sets `ScrollTrigger.config({ ignoreMobileResize: true })` so
the mobile URL bar showing/hiding no longer makes pinned sections jump.
R3F DPR capped at `[1, 1.5]` (`HammerStrikeHero.tsx`, `StlViewer.tsx`).

## State at handoff

- ✅ Hero + Plant both scroll-scrub via image sequence; deployed & live (commit `1fd0b24`).
- ✅ tsc + lint + build green; live home page + frames return 200 w/ immutable cache.
- ⏳ **Needs the user's real-iPhone test** of the plant scrub (the make-or-break check).
- 🧹 `public/assets/video/walkthrough-scrub.mp4` (8MB) is now unreferenced but still
  deployed — candidate to drop from the build to keep the deploy lean (user to confirm).
- 📋 Deferred: `CLIENT_REVIEW.md` verify-with-client list (certs, specs, milestones,
  render part names) — not part of the current scrub thread.

## Verify before "done"

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build
```
Then deploy (above) and test on a **real iPhone (Safari)** via the live link:
hero + plant both crawl frame-by-frame on scroll (no frozen poster / white flash),
no pinned-section jump when the URL bar toggles. Repeat on Android Chrome; desktop
regression; OS reduced-motion → static frames.
