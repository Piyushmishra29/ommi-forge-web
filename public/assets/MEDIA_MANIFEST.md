# Ommi Forge — Media Manifest

All media assets pulled from the live canonical site `https://www.ommiforge.com/` on 2026-05-27.
Brand: authorized SMARK8ING client work; owner approved asset use.

## Summary

| Type | Count | Bytes |
| ---- | ----- | ----- |
| Video | 3 | 29,438,456 |
| Image | 13 | 6,927,074 |
| STL (numbered renders) | 9 | 28,645,506 |
| STL (named products) | 11 | 33,662,478 |
| PDF | 0 | 0 |
| `wp-mirror/` (raw fallback) | 59 files | ~15 MB |

> **Note on STL duplication:** The 9 numbered `part-{a..i}.stl` files and 9 of the 11 named-product STLs share identical mesh data (same byte size, same content). The WordPress upload library renames the same source STL under multiple filenames. Both folders are kept so React Three Fiber loaders can use whichever path is semantically clearer.

> **`public/assets/wp-mirror/`** is a raw fallback safety net containing every `wp-content/uploads/...` asset referenced from the canonical site's home, about, contact, forged-products, quality-and-certification, render-a..h-2 pages. 59 files total. Not enumerated below — browse with `find public/assets/wp-mirror -type f`.

## Video

| Local path | Source URL | Size | Used on page | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/video/hero.mp4` | YouTube `NBCDb4opv-M` (pre-downloaded) | 28,201,922 B (26.9 MB) | Home (hero section) | 1920x1080 VP9, ~57s. Pre-existing before this agent ran. |
| `public/assets/video/plant-walkthrough.mp4` | `https://www.ommiforge.com/wp-content/uploads/2022/03/IMG_1668-1.mp4` (pre-downloaded) | 184,733 B (180 KB) | Home / plant section | 1260x906 H.264, 1.8s loop. Short walkthrough clip. |
| `public/assets/video/plant-pan-1080.mp4` | `https://www.ommiforge.com/wp-content/uploads/2022/02/pan-1080WebShareName.mp4` | 1,051,801 B (1.0 MB) | Home / plant pan | 1080p panning shot of the plant. |

## Images

All sourced from `https://www.ommiforge.com/wp-content/uploads/`. Query strings (e.g. `?fit=`, `?ssl=`) were stripped when renaming.

| Local path | Source URL | Size | Used on page | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/images/ommi-logo.png` | `2022/01/Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview-1-e1643095532377.png` | 28,083 B | All pages (header) | Transparent PNG site logo. |
| `public/assets/images/favicon-source.png` | `2022/03/cropped-IMG_0261-1.png` | 316,179 B | Browser tab | Source for favicon generation. |
| `public/assets/images/DSC09268.jpg` | `2022/02/DSC09268.jpg` | 1,279,857 B | Home | Plant / facility hero photo. |
| `public/assets/images/Original_png-copy-e1644385547873.png` | `2022/02/Original_png-copy-e1644385547873.png` | 42,404 B | Home | Process diagram / overlay graphic. |
| `public/assets/images/pan-1080WebShareName-mov-image.jpg` | `2022/02/pan-1080WebShareName-mov-image.jpg` | 233,430 B | Home | Poster frame for `plant-pan-1080.mp4`. |
| `public/assets/images/1-2-scaled.jpg` | `2022/06/1-2-scaled.jpg` | 559,603 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-3-scaled.jpg` | `2022/06/1-3-scaled.jpg` | 856,133 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-4-scaled.jpg` | `2022/06/1-4-scaled.jpg` | 338,106 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-6-scaled.jpg` | `2022/06/1-6-scaled.jpg` | 748,317 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-7-scaled.jpg` | `2022/06/1-7-scaled.jpg` | 545,322 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-9-scaled.jpg` | `2022/06/1-9-scaled.jpg` | 600,074 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-11-scaled.jpg` | `2022/06/1-11-scaled.jpg` | 636,771 B | Home (forge slideshow) | Forge floor photograph. |
| `public/assets/images/1-Copy-scaled.jpg` | `2022/06/1-Copy-scaled.jpg` | 742,801 B | Home (forge slideshow) | Forge floor photograph. |

## STL — numbered render pages

URL pattern: `https://www.ommiforge.com/wp-content/uploads/2022/02/File-0000{N}.stl`.

| Local path | Source URL (suffix) | Size | Used on page | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/stl/part-a.stl` | `2022/02/File-00003.stl` | 3,042,884 B | `/render-a` (RENDER A) | Binary STL. |
| `public/assets/stl/part-b.stl` | `2022/02/File-00002.stl` | 5,324,134 B | `/render-b` (RENDER B) | Binary STL. |
| `public/assets/stl/part-c.stl` | `2022/02/File-00001.stl` | 3,435,084 B | `/render-c` (RENDER C) | Binary STL. |
| `public/assets/stl/part-d.stl` | `2022/02/File-00004.stl` | 5,010,384 B | `/render-d` (RENDER D) | Binary STL. |
| `public/assets/stl/part-e.stl` | `2022/02/File-00005.stl` | 2,111,984 B | `/render-e` (RENDER E) | Binary STL. |
| `public/assets/stl/part-f.stl` | `2022/02/File-00006.stl` | 1,565,684 B | `/render-f` (RENDER F) | Binary STL. |
| `public/assets/stl/part-g.stl` | `2022/02/File-00007.stl` | 1,228,984 B | `/render-g` (RENDER G) | Binary STL. |
| `public/assets/stl/part-h.stl` | `2022/02/File-00008.stl` | 1,948,484 B | `/render-h-2` (RENDER H) | Binary STL. Source slug mismatched as on live site. |
| `public/assets/stl/part-i.stl` | `2022/02/File-00009.stl` | 4,977,484 B | `/render-h` (RENDER I) | Binary STL. Source slug mismatched as on live site. |

## STL — named product files

URL pattern: `https://www.ommiforge.com/wp-content/uploads/2022/04/<filename>`. Referenced from `/forged-products/`.

| Local path | Source filename | Size | Used on page | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/stl/named/tvs-1200.stl` | `tvs-1200.stl` | 2,542,184 B | `/forged-products/` | Product: TVS 1200. |
| `public/assets/stl/named/trunnion-85000103.stl` | `trunnion-85000103.stl` | 2,475,184 B | `/forged-products/` | Product: Trunnion 85000103. |
| `public/assets/stl/named/sprocket_451-zz-50163-v1.stl` | `sprocket_451-zz-50163-v1.stl` | 4,977,484 B | `/forged-products/` | Product: Sprocket 451-ZZ-50163. (Same mesh as `part-i.stl`.) |
| `public/assets/stl/named/shaft-fan-hub-cuhu1001f001.stl` | `shaft-fan-hub-cuhu1001f001.stl` | 1,948,484 B | `/forged-products/` | Product: Shaft Fan Hub. (Same mesh as `part-h.stl`.) |
| `public/assets/stl/named/right-lever-b14072-8.stl` | `right-lever-b14072-8.stl` | 1,228,984 B | `/forged-products/` | Product: Right Lever B14072-8. (Same mesh as `part-g.stl`.) |
| `public/assets/stl/named/lever-b121768.stl` | `lever-b121768.stl` | 1,565,684 B | `/forged-products/` | Product: Lever B121768. (Same mesh as `part-f.stl`.) |
| `public/assets/stl/named/cylinder-head-130hcb9319.stl` | `cylinder-head-130hcb9319.stl` | 2,111,984 B | `/forged-products/` | Product: Cylinder Head. (Same mesh as `part-e.stl`.) |
| `public/assets/stl/named/body-8-way_um800900000b-bo-modi.stl` | `body-8-way_um800900000b-bo-modi.stl` | 5,010,384 B | `/forged-products/` | Product: Body 8-Way. (Same mesh as `part-d.stl`.) |
| `public/assets/stl/named/bm-140-rh-link.stl` | `bm-140-rh-link.stl` | 3,042,884 B | `/forged-products/` | Product: BM-140 RH Link. (Same mesh as `part-a.stl`.) |
| `public/assets/stl/named/4308128-FORGING-MODEL-v1-v1.stl` | `4308128-FORGING-MODEL-v1-v1.stl` | 5,324,134 B | `/forged-products/` | Product: 4308128 Forging Model. (Same mesh as `part-b.stl`.) |
| `public/assets/stl/named/1011.stl` | `1011.stl` | 3,435,084 B | `/forged-products/` | Product: 1011. (Same mesh as `part-c.stl`.) |

## PDFs

No PDF assets were found referenced from the live canonical site (home, about, contact, forged-products, quality-and-certification pages were all scanned). `public/assets/pdf/` is intentionally empty. Guessed certification paths (`IATF-Certificate.pdf`, `ISO-Certificate.pdf`, etc.) returned 404. If certifications surface later, they may need to be requested directly from the client.

## URLs that 404'd

| URL | Reason |
| --- | --- |
| `https://www.ommiforge.com/wp-content/uploads/2022/03/IATF-Certificate.pdf` | Guess — not present on server. |
| `https://www.ommiforge.com/wp-content/uploads/2022/03/IATF-16949.pdf` | Guess — not present on server. |
| `https://www.ommiforge.com/wp-content/uploads/2022/03/ISO-Certificate.pdf` | Guess — not present on server. |
| `https://www.ommiforge.com/wp-content/uploads/2022/03/ISO-9001.pdf` | Guess — not present on server. |
| Top-level `https://www.ommiforge.com/wp-content/uploads/` directory listing | 403 Forbidden — server blocks index. Worked around by scraping all linked pages and downloading each referenced URL. |

## Brand originals — `public/assets/brand/`

Highest-resolution canonical brand assets fetched directly from `https://www.ommiforge.com` and its WP REST media library (`/wp-json/wp/v2/media`) on 2026-05-27. These are the masters; the older `public/assets/images/ommi-logo.png` and `public/assets/images/favicon-source.png` are downstream Jetpack-resized copies that should eventually be replaced by these.

**Key findings:**
- **No SVG version of the brand logo exists.** The only SVGs in the WP media library are a 14x13 Instagram icon and a stray `arrow-icon-size3.svg` (the latter pointed at an unrelated dev IP). The brand wordmark exists only as PNG.
- **No Open Graph image is set** on the live home page — no `<meta property="og:image">` tag is present. Any social card would need to be generated client-side or supplied by the rebuild.
- **`<head>` referenced favicons only via Jetpack i0.wp.com resize URLs** of `cropped-IMG_0261-1.png` (32x32, 192x192, 180x180). The true master is `IMG_0261.png` (2732x2048) and the square master is `IMG_0261-1.png` (2000x2000).
- The header logo `<img>` in the home HTML uses Jetpack-resized variants of `Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview-1-e1643095532377.png` (max 699x140). The actual uncropped master is `Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview.png` (802x311), found via the REST media library.

| Local path | Source URL | Bytes | Dimensions | Better than `public/assets/images/` copy? |
| --- | --- | --- | --- | --- |
| `public/assets/brand/logo-original.png` | `2022/01/Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview.png` | 55,506 | 802x311 | **Yes** — uncropped master. Existing `images/ommi-logo.png` is 699x140 (Jetpack-resized crop). **Canonical going forward.** |
| `public/assets/brand/logo-cropped-679x140.png` | `2022/01/cropped-Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview-1-e1643095532377.png` | 29,064 | 679x140 | Equivalent to existing `images/ommi-logo.png` (which is 699x140, the same source under a different Jetpack resize). Kept for parity / reference. |
| `public/assets/brand/logo-square-512.png` | `2022/03/cropped-cropped-Screenshot_2022-01-21_at_3.08.21_PM-removebg-preview-1-e1643095532377.png` | 84,766 | 512x512 | Net-new — square wordmark crop used by some WP installers. Useful for square social tiles. |
| `public/assets/brand/favicon-original.png` | `2022/03/IMG_0261.png` | 3,712,395 | 2732x2048 | **Yes** — true master. Existing `images/favicon-source.png` (316,179 B) is byte-identical to `favicon-cropped-512.png` below. **Canonical going forward.** |
| `public/assets/brand/favicon-square-2000.png` | `2022/03/IMG_0261-1.png` | 4,609,241 | 2000x2000 | **Yes** — square 1:1 master. Best source for favicon/PWA icon generation since it's already square. |
| `public/assets/brand/favicon-cropped-512.png` | `2022/03/cropped-IMG_0261-1.png` | 316,179 | 512x512 | Byte-identical (MD5 `15184e49…`) to existing `images/favicon-source.png`. Kept for reference. |
| `public/assets/brand/apple-touch-icon-original.png` | `i0.wp.com/.../cropped-IMG_0261-1.png?fit=180,180&ssl=1` | 14,221 | 180x180 | Net-new — matches the exact URL the live `<link rel="apple-touch-icon">` points at. Jetpack-rendered PNG, useful as a sanity reference. |

**Recommended canonical source files** (for downstream favicon/logo build):
- Logo: `public/assets/brand/logo-original.png` (802x311, transparent PNG).
- Favicon / app icons: `public/assets/brand/favicon-square-2000.png` (2000x2000) — square master is ideal because no further cropping is needed.

## Raw fallback mirror — `public/assets/wp-mirror/`

Contains 59 files (~15 MB) covering every `wp-content/uploads/...` URL referenced from the canonical pages above. Structure mirrors the source: `wp-mirror/2022/01/...`, `wp-mirror/2022/02/...`, etc. Browse with:

```sh
find public/assets/wp-mirror -type f | sort
```

Use this as a fallback if any curated path above turns out to be wrong — the original filenames are preserved.
