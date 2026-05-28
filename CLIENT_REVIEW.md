# Client review checklist — Ommi Forge rebuild

Items that need sign-off or external input from Ommi Forge Pvt. Ltd. before the new site replaces the existing WordPress build at `https://www.ommiforge.com`. Everything else is implemented; these are the gates between "build" and "launch".

Last updated: 2026-05-27 · Branch: `main` · Repo: <https://github.com/Piyushmishra29/ommi-forge-web>

---

## 1. Creative liberties — keep or revert?

### 1.1 Hero headline
**Implemented:** `Forged in India` · `since nineteen seventy-five.` (italic second line)
**Source site:** `Forged in India Since 1975 · For all your forging needs.`
**Why we changed:** spelling out "nineteen seventy-five" reads more editorial and gives the italic line dramatic weight. The "For all your forging needs" tagline is moved to the subhead position.
**Decision needed:** keep ✓ / revert / propose alternative

### 1.2 Heritage timeline milestones
**Implemented (6 entries on `/` HeritageTimeline + `/about/` HeritageEssay):**
- 1975 — BG Ashwath founds Ommi Forge in Vishweshwarya industrial area, Bangalore (source-confirmed)
- 1985 — Expansion into closed-die forging *(invented — needs confirmation)*
- 2000 — Move to current Malur plant *(invented — needs confirmation)*
- 2015 — In-house metallurgist lab established *(invented — needs confirmation)*
- 2022 — 3D STL render catalogue launched on site (source-supported by the existing render pages)
- 2026 — Electric-forging pilot (in progress) *(invented — needs confirmation or replacement)*

**Decision needed:** confirm each invented milestone OR send the real timeline (years + one-line description).

### 1.3 "Inside the wonderworld" walkthrough headline
**Implemented:** `Inside the wonderworld.` for the Act 04 plant-walkthrough section.
**Source site:** `Take a peek inside our Wonderworld.`
**Decision needed:** keep ✓ / revert to source line.

### 1.4 About-page headlines
The About page uses heritage prose that paraphrases the source site. Source paragraph is preserved verbatim where possible (BG Ashwath founder line, Vishweshwarya, etc.). Additional editorial sentences were added to fill out the page. **Read `/about/` end-to-end** and flag anything that misrepresents the company.

### 1.5 Careers — single CTA instead of posted roles
**Implemented:** one centred panel: *"Ommi Forge does not run a posted-roles board. We hire people we meet — through site visits, supplier relationships, and direct referrals."* + magnetic `marketing@ommiforge.com` CTA.
**Why:** the source site's `/careers/` had no posted roles, and an earlier agent invented 4 fake ones. Reverted on request.
**Decision needed:** confirm this stance ✓ OR send real role listings to repopulate the board.

### 1.6 Solutions CTAs
Each forging method has a magnetic CTA: `Discuss a Closed Die / Open Die / Ring / Upset project →` → `/contact/`. Decision needed: keep the per-method CTAs ✓ or collapse to a single end-of-section CTA.

### 1.7 Hero CTA labels
- Primary: `Request a Quote` (matches source nav)
- Secondary: `See our work` (new, points to `/renders/`)

Decision needed: confirm both labels.

---

## 2. STL part name verification

`src/data/renders.ts` maps the 9 numbered STL files (`File-00001.stl` … `File-00009.stl`) to product names based on the source-site dropdown labels — but I don't know which STL is actually which part.

| Slug | File | Title shown to user | Product name shown | Confirmed? |
|---|---|---|---|---|
| `a` | `File-00003.stl` | RENDER A | Link | ❓ |
| `b` | `File-00002.stl` | RENDER B | Shifter Fork | ❓ |
| `c` | `File-00001.stl` | RENDER C | Carrier | ❓ |
| `d` | `File-00004.stl` | RENDER D | Steam Manifold | ❓ |
| `e` | `File-00005.stl` | RENDER E | Lever | ❓ |
| `f` | `File-00006.stl` | RENDER F | Crank | ❓ |
| `g` | `File-00007.stl` | RENDER G | Forged Sprocket | ❓ |
| `h` | `File-00008.stl` | RENDER H | Hub | ❓ |
| `i` | `File-00009.stl` | RENDER I | Connecting Rod | ❓ |

The 11 **named** STLs in `public/assets/stl/named/` (used in the `/products/` masonry) ARE confirmed by filename:
`tvs-1200`, `trunnion-85000103`, `sprocket_451-zz-50163-v1`, `shaft-fan-hub-cuhu1001f001`, `right-lever-b14072-8`, `lever-b121768`, `cylinder-head-130hcb9319`, `body-8-way_um800900000b-bo-modi`, `bm-140-rh-link`, `4308128-FORGING-MODEL-v1-v1`, `1011`.

**Decision needed:** send the correct slug → product name mapping for the 9 numbered renders (a screenshot of the existing `/3d-renders/` nav alongside each STL would resolve this). Updating `src/data/renders.ts` is a one-minute change once we have ground truth.

---

## 3. Certification PDFs

The `/materials/` page has 6 certification cards: ISO 9001:2015, ISO 14001, ISO 45001, IATF 16949, NABL accreditation, PED 2014/68/EU.

The current implementation routes each card's "Request copy →" button to a pre-filled `mailto:marketing@ommiforge.com` so visitors email for the latest copy. The cards display the cert name, an "Available on request" eyebrow, and the mailto CTA.

**Decision needed:** if Ommi Forge wants visitors to be able to download directly, send the PDFs. We'll drop them in `public/assets/pdf/<filename>.pdf` and re-wire the cards.

Otherwise the current "request copy" pattern stands.

---

## 4. Real product photography + plant photography

Right now the visual layer leans on:
- 13 existing images from the WordPress site (`/wp-content/uploads/2022/02/` and `/2022/06/`), most 500-850 KB JPGs at consumer-camera resolution
- 11 product-specific STL files rendered live via R3F
- 1 YouTube-sourced aerial plant clip (`hero.mp4`, 57s, 1080p H.264)
- 1 short ambient plant pan (`plant-pan-1080.mp4`, ~5s)

**Gaps a real photoshoot would close:**
- A wide hero shot of the Malur plant exterior (currently the hero uses the aerial drone clip — fine, but a still would let us drop the autoplay video entirely on slower connections)
- 3-5 hero-quality product photos for the `/products/` Featured section (currently mixed with 2022 web JPGs)
- A founder/leadership portrait for the `/about/` HeritageEssay sticky chapter rail
- 2-3 floor shots showing the actual closed-die / open-die / ring-rolling / upset hammers in operation, for the `/solutions/` MethodsPinned section
- Certification badge images (small inline graphics for `/materials/#certif`)

**Decision needed:** is a shoot in scope? If yes — what timeline? If no — we ship with the existing imagery and the rebuild reads as polished but not premium-print quality.

---

## 5. Contact form backend

The form on `/contact/` validates client-side (react-hook-form + zod) and currently fakes a submission (timeout → success state).

To send real emails to `marketing@ommiforge.com`, pick one:
- **Formspree** — free tier 50 submissions/month. Paste endpoint into `NEXT_PUBLIC_FORMSPREE_URL` in `.env.local`. ~2 min setup. (This is wired up — see `docs/DEPLOY.md`.)
- **Hostinger SMTP relay** — if we host on Hostinger, use a small PHP form handler under `public_html/form.php`. ~30 min setup. Free.
- **Custom serverless function** — if we host on Vercel, a `/api/contact` route can send via Resend/SendGrid. ~1 hr setup + monthly cost for the email provider.

**Decision needed:** which backend.

---

## 6. Analytics

The build ships **no analytics, no cookies, no third-party trackers** by default. README and SECURITY.md document this.

Optional opt-in: Plausible (privacy-friendly, no cookie banner needed). To enable: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=www.ommiforge.com` in `.env.local` and redeploy. Plausible is ~$9/mo for the first 10k pageviews.

**Decision needed:** opt in to Plausible / use Google Analytics / stay analytics-free.

---

## 7. Hosting cutover

The site is currently a static export building into `out/` (131 MB including media). Three viable paths:

1. **Vercel** — `vercel --prod` after build; free, automatic HTTPS, CDN, custom domain via `vercel.json` already in place. Best DX.
2. **Replace WordPress on Hostinger** — upload `out/` to `public_html/` via FTP/SFTP. The `.htaccess` is included and copied into the build. ommiforge.com keeps its existing host. ~10 min cutover with downtime; do it via a staging subdomain first.
3. **Side-by-side** — deploy to Vercel on `next.ommiforge.com`, keep WordPress live on `www.ommiforge.com` until owner approves the switch.

`docs/DEPLOY.md` documents both paths.

**Decision needed:** Vercel / Hostinger / staging subdomain. (Recommend staging subdomain first.)

---

## 8. Brand asset originals

The build uses:
- `public/assets/images/ommi-logo.png` — 28 KB, fetched from WordPress (a screenshot-based bitmap)
- `public/assets/images/favicon-source.png` — 316 KB, from `/wp-content/uploads/2022/03/cropped-IMG_0261-1.png`

These were pulled from the live site. A **vector logo** (SVG) and a **dedicated favicon design** would be a meaningful upgrade. Ask the agency or original brand owner if a vector master file exists.

The brand-assets fetch agent is downloading the highest-resolution variants currently available on the live site into `public/assets/brand/`. Final swap decisions live there.

---

## 9. Domain + email

- The build's `metadata.metadataBase` is `https://www.ommiforge.com`. If we deploy to a staging domain first, update this in `src/app/layout.tsx`.
- `marketing@ommiforge.com` is the only published contact email. Confirm this inbox is monitored (especially before wiring up the Formspree form).

---

## 10. Pre-launch checklist (for your reference once decisions are made)

- [ ] Decisions on §1.1–1.7 (creative liberties)
- [ ] Real STL → product mapping (§2)
- [ ] Certification PDFs uploaded OR mailto pattern confirmed (§3)
- [ ] Photoshoot decision (§4)
- [ ] Contact form backend wired (§5)
- [ ] Analytics decision (§6)
- [ ] Hosting target chosen (§7)
- [ ] Logo SVG + favicon master sourced if available (§8)
- [ ] `metadata.metadataBase` matches the launch domain
- [ ] Browser smoke: Chrome / Safari / Firefox / mobile Safari / Chrome Android
- [ ] Lighthouse pass (Performance ≥ 75, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95)
- [ ] DNS A/AAAA records updated
- [ ] Old WordPress site backed up before swap
- [ ] Email a "we've redesigned" note to existing client list (if any)

---

## 11. FACTUAL CLAIMS TO VERIFY (added 2026-05-28 from pre-client audit)

A large forging client will scrutinise every number. **Every claim below is
either invented or unverified** and must be confirmed (or corrected) before
the site goes out. Grouped by file.

### Certifications — HIGHEST PRIORITY (legal/credibility risk)
`src/data/certifications.ts` presents these as **held**, with specific
issuers and expiry dates. Confirm each is actually held, the issuer is
correct, and the date is right — or remove/soften:
- ISO 9001:2015 — TÜV SÜD — "Valid through 2027"
- IATF 16949:2016 — TÜV SÜD — "Valid through 2026"
- ISO 14001:2015 — TÜV SÜD — "Valid through 2027"
- ISO 45001:2018 — TÜV SÜD — "Valid through 2027"
- PED 2014/68/EU — Lloyd's Register — "Valid through 2028"
- NABL Accreditation — in-house metallurgical lab — "Valid through 2026"

### Heritage milestones (`src/data/home.ts` + `src/data/about.ts`)
- 1985 — closed-die expansion / second hammer line *(invented)*
- 2000 — move to current Malur plant, Plot 300–302 *(invented)*
- 2015 — in-house metallurgy lab *(invented; about.ts also dates the lab to the 1980s — reconcile)*
- 2022 — "crossed a million pieces", "European drivetrain customers", "second metallurgist joined" *(invented)*
- 2026 — electric-forging pilot / grid-electric induction *(invented — confirm or remove)*

### Stats (`src/data/home.ts` STATS)
- 8 power hammers · 1000+ metric tons/year · 100+ parts developed · 1-day quote-to-part — confirm each.

### Forging-method specs (`src/data/solutions.ts`)
- Closed die: 0.5–50 kg/piece · 8 power hammers
- Open die: up to 500 kg/piece · shafts to 2000 mm
- Ring rolling: 150–1500 mm dia · seamless
- Upset: up to 6" dia · shafts to 1000 mm

### Material grades (`src/data/materials.ts`)
- Carbon (C10–C70, EN-2A/3A/8/9/42/43), Alloy (40Cr4, 42CrMo4, EN-18/19/24/25, 4140/4340/8620, SCr420), Stainless (304/304L/316/316L/321/410/420/440C, SAF 2205/2507), Custom (D2/D3/H11/H13/M2, 38MnVS6, 27MnCrB5). A metallurgist will spot any grade Ommi doesn't run.

### Render part names (`src/data/renders.ts`) — guessed slug→part mapping
a=Link, b=Shifter Fork, c=Carrier, d=Steam Manifold, e=Lever, f=Crank, g=Forged Sprocket, h=Hub, i=Connecting Rod. Confirm names + confirm OK to publish downloadable STL geometry (each detail page has a "Download STL" button).

### Named product blurbs (`src/data/products.ts`)
Specific material/treatment claims per part (e.g. Fan Hub Shaft "42CrMo4", BM 140 RH Link "EN24 — case-hardened, shot-peened, MPI"). Confirm part names, codes, materials, treatments.

### Other claims
- "Customers across India, South-East Asia, the Middle East and Europe" (`about.ts`) — confirm export markets.
- "Three acres of forge floor" / "3-acre plant" — confirm acreage.
- Founder quote "Quality is not a slogan — it is a process." — BG Ashwath — confirm it's a real quote, not invented.
- Sustainability claims (rainwater systems, vegetable gardens, white lubricants, moving off furnace oil/LDO to electric) — confirm still accurate.
- `about/page.tsx` caption "Strike 04 of 11" — confirm it means something or replace.

---

## 12. DEPLOY-CONFIG for the temp VPS preview (see docs/DEPLOY.md)
- robots.txt set to `Disallow: /` for preview (revert before production).
- nginx needs `error_page 404 /404.html;` + the 13 legacy `return 308` rules (old `/render-a` bookmarks 404 otherwise).
- `metadataBase` = production domain → OG link-preview card may be wrong on the temp link unless temporarily pointed at the VPS URL.
- Set `NEXT_PUBLIC_FORMSPREE_URL` at build time or the contact form can't deliver email (it now shows an honest "email us" note instead of faking success).
- Upload only `out/` (~120 MB); `_masters/` is local-only.
