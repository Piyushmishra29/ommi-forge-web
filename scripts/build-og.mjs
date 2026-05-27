#!/usr/bin/env node
/**
 * build-og.mjs
 *
 * Generates `public/og-image.png` — the 1200×630 Open Graph / Twitter card.
 *
 * Composition (top → bottom):
 *   1. Saffron gradient background (#FF9933 → #E8741A).
 *   2. The real Ommi Forge wordmark logo (`logo-original.png` Agent D
 *      fetched from the live site) composited centred-upper. Inverted to
 *      paper-tone so it reads on saffron. We sharp-tint the alpha channel
 *      so the original screenshot-based logo stays crisp.
 *   3. Eyebrow line above the logo.
 *   4. Tagline below the logo.
 *   5. Bottom-right `ommiforge.com` URL chip.
 *   6. Graphite 8px footer rule.
 *
 * Run: `pnpm build:og`.
 */
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);

const OUT = path.join(ROOT, 'public', 'og-image.png');
const LOGO = path.join(ROOT, 'public', 'assets', 'brand', 'logo-original.png');
const LOGO_FALLBACK = path.join(ROOT, 'public', 'assets', 'images', 'ommi-logo.png');

const WIDTH = 1200;
const HEIGHT = 630;

const SAFFRON = '#FF9933';
const PAPER = '#FAFAFA';
const GRAPHITE = '#1F2124';

const FONT_STACK = 'Manrope, "Helvetica Neue", Helvetica, Arial, sans-serif';

const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SAFFRON}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#E8741A" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${GRAPHITE}"/>
  <!-- Eyebrow -->
  <text
    x="${WIDTH / 2}"
    y="160"
    text-anchor="middle"
    font-family='${FONT_STACK}'
    font-weight="800"
    font-size="28"
    letter-spacing="8"
    fill="${PAPER}"
    opacity="0.9"
  >FORGED IN INDIA · SINCE 1975</text>
  <!-- Tagline (below logo) -->
  <text
    x="${WIDTH / 2}"
    y="500"
    text-anchor="middle"
    font-family='${FONT_STACK}'
    font-weight="400"
    font-size="32"
    fill="${PAPER}"
    opacity="0.95"
  >Closed die · Open die · Ring rolling · Upset forging</text>
  <!-- URL chip -->
  <text
    x="${WIDTH - 60}"
    y="${HEIGHT - 28}"
    text-anchor="end"
    font-family='${FONT_STACK}'
    font-weight="700"
    font-size="22"
    letter-spacing="2"
    fill="${PAPER}"
  >ommiforge.com</text>
  <!-- Mesh hairline left of the URL chip -->
  <line
    x1="${WIDTH - 240}"
    y1="${HEIGHT - 35}"
    x2="${WIDTH - 200}"
    y2="${HEIGHT - 35}"
    stroke="${PAPER}"
    stroke-width="2"
    opacity="0.65"
  />
</svg>
`;

async function main() {
  const logoPath = existsSync(LOGO)
    ? LOGO
    : existsSync(LOGO_FALLBACK)
      ? LOGO_FALLBACK
      : null;

  // 1. Render the saffron background SVG to a 1200×630 PNG.
  let base = sharp(Buffer.from(bgSvg), { density: 144 }).resize(WIDTH, HEIGHT, {
    fit: 'cover',
  });

  // 2. Prepare the wordmark logo for compositing.
  //    Original is dark on transparent; we re-tint it to paper so it reads
  //    on saffron, then resize to fit ~640px wide (1200 × 0.53).
  if (logoPath) {
    const targetWidth = 720;
    const tinted = await sharp(logoPath)
      // First trim transparent margins so the wordmark centres cleanly
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
      .resize({ width: targetWidth, fit: 'inside' })
      // Re-colour: keep alpha, set RGB to paper. Use `tint` for a uniform
      // recolour preserving the logo's anti-aliasing.
      .tint({ r: 250, g: 250, b: 250 })
      .png()
      .toBuffer();
    const tintedMeta = await sharp(tinted).metadata();
    const logoWidth = tintedMeta.width ?? targetWidth;
    const logoHeight = tintedMeta.height ?? 120;
    const left = Math.round((WIDTH - logoWidth) / 2);
    const top = Math.round((HEIGHT - logoHeight) / 2 - 30);
    base = base.composite([{ input: tinted, top, left }]);
  } else {
    console.warn('No logo source found; rendering OG card without wordmark.');
  }

  const buf = await base.png({ compressionLevel: 9 }).toBuffer();
  await writeFile(OUT, buf);

  const meta = await sharp(OUT).metadata();
  console.log(
    `OG image built: ${path.relative(ROOT, OUT)} — ${meta.width}×${meta.height} (${(buf.length / 1024).toFixed(0)} KB)` +
      (logoPath ? ` · logo: ${path.relative(ROOT, logoPath)}` : ' · no logo'),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
