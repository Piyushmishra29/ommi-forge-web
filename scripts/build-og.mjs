#!/usr/bin/env node
/**
 * build-og.mjs
 *
 * Generates `public/og-image.png` — the 1200×630 Open Graph / Twitter card
 * shared on social. Saffron `#FF9933` background, "OMMI FORGE" wordmark in
 * a Manrope-like sans, and the tagline "Forged in India since 1975".
 *
 * Implementation: render an SVG template via sharp (librsvg under the hood).
 * sharp resolves fonts through fontconfig / Core Text on macOS, so the
 * `font-family` stack falls back to a generic sans if Manrope isn't installed
 * on the build machine — the visual still reads clean.
 *
 * Run: `pnpm build:og`
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);

const OUT = path.join(ROOT, 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

const SAFFRON = '#FF9933';
const PAPER = '#FAFAFA';
const GRAPHITE = '#1F2124';

const FONT_STACK = 'Manrope, "Helvetica Neue", Helvetica, Arial, sans-serif';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SAFFRON}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#E8741A" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Subtle paper bar at the bottom -->
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${GRAPHITE}"/>

  <!-- Eyebrow -->
  <text
    x="80"
    y="200"
    font-family='${FONT_STACK}'
    font-weight="800"
    font-size="32"
    letter-spacing="6"
    fill="${PAPER}"
    opacity="0.85"
  >FORGED IN INDIA · SINCE 1975</text>

  <!-- Wordmark -->
  <text
    x="80"
    y="380"
    font-family='${FONT_STACK}'
    font-weight="800"
    font-size="180"
    letter-spacing="-4"
    fill="${PAPER}"
  >OMMI FORGE</text>

  <!-- Sub-tagline -->
  <text
    x="80"
    y="470"
    font-family='${FONT_STACK}'
    font-weight="400"
    font-size="36"
    fill="${PAPER}"
    opacity="0.95"
  >Closed die · Open die · Ring rolling · Upset forging</text>

  <!-- Bottom-right URL chip -->
  <text
    x="${WIDTH - 80}"
    y="${HEIGHT - 48}"
    text-anchor="end"
    font-family='${FONT_STACK}'
    font-weight="700"
    font-size="28"
    letter-spacing="2"
    fill="${PAPER}"
  >ommiforge.com</text>
</svg>
`;

async function main() {
  const buf = await sharp(Buffer.from(svg), { density: 144 })
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(OUT, buf);

  const meta = await sharp(OUT).metadata();
  console.log(`OG image built: ${path.relative(ROOT, OUT)} — ${meta.width}×${meta.height} (${(buf.length / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
