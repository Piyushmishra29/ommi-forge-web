# Ommi Forge — Media Manifest

All media assets pulled from the live canonical site `https://www.ommiforge.com/` on 2026-05-27.
Brand: authorized SMARK8ING client work; owner approved asset use.

## Summary

| Type | Count | Bytes |
| ---- | ----- | ----- |
| Video | 4 | 35,814,597 |
| Image | 13 | 6,927,074 |
| STL (numbered renders, download links) | 9 | 28,645,506 |
| STL (conversion masters, `media-src/`) | 2 | 5,017,368 |
| GLB (meshopt models, `public/assets/models/`) | 11 | 6,617,524 |
| PDF | 0 | 0 |
| `wp-mirror/` (raw fallback) | 59 files | ~15 MB |

> **Note on STL duplication (resolved 2026-07-12):** The 9 numbered `part-{a..i}.stl` files and 9 of the 11 named-product STLs shared identical mesh data (same byte size, same content) — the WordPress upload library had renamed the same source STL under multiple filenames. The 9 named-product duplicates have been removed; the 2 unique named STLs (`tvs-1200`, `trunnion-85000103`) moved to `media-src/`. All 11 unique meshes now ship as meshopt-compressed GLB in `public/assets/models/` — see that section below for the full pipeline and per-file stats.

> **`public/assets/wp-mirror/`** is a raw fallback safety net containing every `wp-content/uploads/...` asset referenced from the canonical site's home, about, contact, forged-products, quality-and-certification, render-a..h-2 pages. 59 files total. Not enumerated below — browse with `find public/assets/wp-mirror -type f`.

## Video

> The hero, plant, and hammer motion now render as scroll-scrubbed WebP image
> sequences (`public/assets/frames/hero/`, `public/assets/frames/plant/`, and
> `public/assets/frames/hammer/`), NOT `<video>`. The source mp4s below were
> decoded to those frames and moved OUT of the deploy to the top-level
> `media-src/` dir (kept as re-encode masters, never served). Only
> `public/assets/video/hero-poster.jpg` still ships — it's the pre-decode
> canvas fallback.

| Local path | Source URL | Size | Used on page | Notes |
| --- | --- | --- | --- | --- |
| `media-src/hero-firstshot.mp4` | YouTube `NBCDb4opv-M` (pre-downloaded) | 28,217,018 B (26.9 MB) | Decode master → hero frames | 1920x1080. Decoded to `frames/hero/`. Not deployed. |
| `media-src/walkthrough-scrub.mp4` | (pre-downloaded) | 8,506,354 B (8.1 MB) | Decode master → plant frames | Decoded to `frames/plant/`. Not deployed. |
| `media-src/plant-walkthrough.mp4` | `https://www.ommiforge.com/wp-content/uploads/2022/03/IMG_1668-1.mp4` (pre-downloaded) | 184,733 B (180 KB) | Decode master | 1260x906 H.264, 1.8s loop. Not deployed. |
| `media-src/plant-pan-1080.mp4` | `https://www.ommiforge.com/wp-content/uploads/2022/02/pan-1080WebShareName.mp4` | 1,051,801 B (1.0 MB) | Decode master | 1080p panning shot of the plant. Not deployed. |
| `media-src/pexels-5846379-power-hammer.mp4` | `https://www.pexels.com/video/forging-hot-metal-5846379/` (Pexels License — free for commercial use, no attribution required) | 6,376,141 B (6.1 MB) | Decode master → hammer frames | 1920x1080, 25fps, 13.6s. Stock footage of a power hammer striking a glowing steel bar. Decoded to `frames/hammer/`. Not deployed. |

### `frames/hammer/` — scroll-scrubbed hammer strike sequence

108-frame WebP sequence (`f-001.webp` … `f-108.webp`, 1-based, 3-digit zero-pad) at `public/assets/frames/hammer/960/` (960×540) and `public/assets/frames/hammer/640/` (640×360), decoded from the 4.32s window `t=0.00s`–`t=4.28s` of `media-src/pexels-5846379-power-hammer.mp4`. That window contains 4 full descend→impact ram cycles (faster cadence than initially assumed, ~0.96s/cycle) — spark-burst impact frames land at sequence indices **28, 53, 76, and 100**. Frame 1 opens on the ram raised with the bar quiet; frame 108 lands ~0.3s after the 4th impact, on the tail of its falling sparks. Encoded with `libwebp` at `-q:v 80`; 960 set averages ~19.7 KB/frame (2.08 MB total), 640 set averages ~11.0 KB/frame (1.16 MB total).

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

Kept in place as raw binary STL download links (e.g. an explicit "download STL" button on `/render-*` pages). The 3D viewer itself loads the compressed GLB versions in `public/assets/models/` — see below.

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

## STL — named product files (superseded)

`public/assets/stl/named/` originally held 11 files mirroring `/forged-products/`. 9 of the 11 were byte-identical duplicates of `part-{a..i}.stl` (verified via `md5sum`, see table below) — the WordPress upload library had renamed the same source STL under multiple filenames. Those 9 duplicates were `git rm`'d on 2026-07-12; the directory no longer exists. The 2 unique named meshes (`tvs-1200.stl`, `trunnion-85000103.stl`) were moved to `media-src/` as GLB-conversion source masters (not deployed as raw STL — no page linked to them directly, they only ever backed the `/forged-products/` 3D viewer, which now loads `public/assets/models/tvs-1200.glb` and `public/assets/models/trunnion-85000103.glb`).

| Removed/moved path | md5 | Duplicate of | Disposition |
| --- | --- | --- | --- |
| `media-src/tvs-1200.stl` | `c5a1ca7cf3bafb4007c799c27fd1b3ab` | — (unique) | Moved from `stl/named/`, kept as conversion master |
| `media-src/trunnion-85000103.stl` | `784a18b937742f01e14e9e03c193c2ab` | — (unique) | Moved from `stl/named/`, kept as conversion master |
| `stl/named/sprocket_451-zz-50163-v1.stl` | `d97bc8d538bae57105a80e2147078a99` | `part-i.stl` | `git rm` — dupe |
| `stl/named/shaft-fan-hub-cuhu1001f001.stl` | `8927648c444e79be073de783d955a343` | `part-h.stl` | `git rm` — dupe |
| `stl/named/right-lever-b14072-8.stl` | `a30f0bb95084ea70d80e75c6ca0d0f9a` | `part-g.stl` | `git rm` — dupe |
| `stl/named/lever-b121768.stl` | `f75a564484f217b4750ad539dd8fb2a2` | `part-f.stl` | `git rm` — dupe |
| `stl/named/cylinder-head-130hcb9319.stl` | `573e109855ba028b8be7a1b1146d0b97` | `part-e.stl` | `git rm` — dupe |
| `stl/named/body-8-way_um800900000b-bo-modi.stl` | `73628ffa45fb19b8862bc104266e4f1e` | `part-d.stl` | `git rm` — dupe |
| `stl/named/bm-140-rh-link.stl` | `6c8f6efb84af3a9fd659eddae650eb95` | `part-a.stl` | `git rm` — dupe |
| `stl/named/4308128-FORGING-MODEL-v1-v1.stl` | `c4e9f30bf9177d52c2e326bcf5a868bf` | `part-b.stl` | `git rm` — dupe |
| `stl/named/1011.stl` | `c148a3fc659d815cbd50ffe12286e258` | `part-c.stl` | `git rm` — dupe |

## 3D Models — `public/assets/models/` (meshopt-compressed GLB)

The 11 unique meshes (`part-a` … `part-i`, `tvs-1200`, `trunnion-85000103`) were converted from raw binary STL (~32.1 MB total, byte-duplicates removed) to meshopt-compressed GLB (~6.31 MB total, 5.09x smaller) on 2026-07-12. This is what the React Three Fiber viewer loads — the STL sources exist only as download links (`stl/part-*.stl`) and conversion masters (`media-src/tvs-1200.stl`, `media-src/trunnion-85000103.stl`).

**Pipeline:**
1. STL → glTF intermediate: `assimp export <in>.stl <mid>.glb` (assimp 5.3, via `assimp-utils` apt package). Clean conversion on all 11 files, no warnings.
2. Meshopt compression: `gltfpack -i <mid>.glb -o <out>.glb -cc` (gltfpack 1.2, via `npm i -g gltfpack`). `-cc` = max meshopt compression. No `-si` simplification pass — these are mechanical CAD parts with hard edges; triangle counts are preserved exactly source-to-output.
3. Verified every output: GLB magic bytes checked, and `npx @gltf-transform/cli inspect` confirmed `extensionsUsed: KHR_mesh_quantization, EXT_meshopt_compression, KHR_materials_specular` on every file — matches the `three` `MeshoptDecoder` the app uses (NOT Draco).

| Local path | Source STL | STL size | GLB size | Ratio | Triangles |
| --- | --- | --- | --- | --- | --- |
| `public/assets/models/part-a.glb` | `stl/part-a.stl` | 3,042,884 B | 630,404 B | 4.83x | 60,856 |
| `public/assets/models/part-b.glb` | `stl/part-b.stl` | 5,324,134 B | 519,616 B | 10.25x | 106,481 |
| `public/assets/models/part-c.glb` | `stl/part-c.stl` | 3,435,084 B | 747,868 B | 4.59x | 68,700 |
| `public/assets/models/part-d.glb` | `stl/part-d.stl` | 5,010,384 B | 1,042,880 B | 4.80x | 100,206 |
| `public/assets/models/part-e.glb` | `stl/part-e.stl` | 2,111,984 B | 429,320 B | 4.92x | 42,238 |
| `public/assets/models/part-f.glb` | `stl/part-f.stl` | 1,565,684 B | 341,952 B | 4.58x | 31,312 |
| `public/assets/models/part-g.glb` | `stl/part-g.stl` | 1,228,984 B | 252,900 B | 4.86x | 24,578 |
| `public/assets/models/part-h.glb` | `stl/part-h.stl` | 1,948,484 B | 431,604 B | 4.51x | 38,968 |
| `public/assets/models/part-i.glb` | `stl/part-i.stl` | 4,977,484 B | 1,072,016 B | 4.64x | 99,548 |
| `public/assets/models/tvs-1200.glb` | `media-src/tvs-1200.stl` | 2,542,184 B | 605,036 B | 4.20x | 50,842 |
| `public/assets/models/trunnion-85000103.glb` | `media-src/trunnion-85000103.stl` | 2,475,184 B | 543,928 B | 4.55x | 49,502 |
| **Total** | | **33,662,474 B (32.10 MB)** | **6,617,524 B (6.31 MB)** | **5.09x** | **673,231** |

Note on `part-b`'s outlier 10.25x ratio: its source mesh has a higher ratio of coincident vertices per triangle (294,431 raw vertices for 106,481 triangles vs. the ~2.5:1 typical of the other parts) — gltfpack's welding + quantization pass collapses these harder than the more irregular meshes. Triangle count is unaffected either way; every file's output triangle count matches its input exactly (verified via `gltfpack -v` and cross-checked against `assimp info`).

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
