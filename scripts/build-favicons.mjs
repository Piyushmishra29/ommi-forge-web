#!/usr/bin/env node
/**
 * build-favicons.mjs
 *
 * Generates the favicon set from `public/assets/images/favicon-source.png`:
 *
 *   src/app/favicon.ico      → multi-resolution ICO (16, 32, 48) with PNG-encoded
 *                              entries (the modern ICO container — well supported
 *                              by all current browsers).
 *   src/app/icon.png         → 256×256 PNG (Next 16 App Router icon convention).
 *   src/app/apple-icon.png   → 180×180 PNG (Apple touch icon).
 *   public/favicon-16.png    → 16×16 PNG (explicit link if ever needed).
 *   public/favicon-32.png    → 32×32 PNG (explicit link if ever needed).
 *
 * Idempotent — rerun any time the source PNG changes.
 *
 * Sharp can emit PNGs natively but not ICOs, so we wrap the PNG payloads
 * in a hand-rolled ICO container (BITMAPINFOHEADER-less PNG entries are
 * legal per the ICO spec used by Windows Vista+ / all current browsers).
 *
 * Run: `pnpm build:favicons`
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);

// Prefer the 2000×2000 square master Agent D fetched from ommiforge.com
// — sharp downsamples better from a high-res source than from the 512×512
// crop. Falls back to the older `favicon-source.png` if the master is
// missing (e.g. on a fresh checkout where brand/ hasn't been populated).
const BRAND_MASTER = path.join(
  ROOT,
  'public',
  'assets',
  'brand',
  'favicon-square-2000.png',
);
const LEGACY_SOURCE = path.join(
  ROOT,
  'public',
  'assets',
  'images',
  'favicon-source.png',
);
const SOURCE = existsSync(BRAND_MASTER) ? BRAND_MASTER : LEGACY_SOURCE;

const APP_DIR = path.join(ROOT, 'src', 'app');
const PUBLIC_DIR = path.join(ROOT, 'public');

const ICO_SIZES = [16, 32, 48];
const ICON_PNG_SIZE = 256;
const APPLE_ICON_SIZE = 180;

/**
 * Render the source PNG to a square at `size` and return raw PNG bytes.
 */
async function renderPng(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Build a multi-resolution ICO from a list of PNG buffers.
 *
 * ICO header (6 bytes) + ICONDIRENTRY (16 bytes each) + PNG payloads.
 * Per the spec, when the entry size is >= 256, the byte is written as 0.
 */
function buildIco(pngs) {
  const count = pngs.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type (1 = icon)
  header.writeUInt16LE(count, 4); // count

  const entries = Buffer.alloc(entrySize * count);
  let offset = dirSize;
  pngs.forEach(({ buf, size }, i) => {
    const base = i * entrySize;
    entries.writeUInt8(size >= 256 ? 0 : size, base + 0); // width
    entries.writeUInt8(size >= 256 ? 0 : size, base + 1); // height
    entries.writeUInt8(0, base + 2); // color palette
    entries.writeUInt8(0, base + 3); // reserved
    entries.writeUInt16LE(1, base + 4); // color planes
    entries.writeUInt16LE(32, base + 6); // bits per pixel
    entries.writeUInt32LE(buf.length, base + 8); // image data size
    entries.writeUInt32LE(offset, base + 12); // image data offset
    offset += buf.length;
  });

  return Buffer.concat([header, entries, ...pngs.map((p) => p.buf)]);
}

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`);
    process.exit(1);
  }

  await ensureDir(APP_DIR);
  await ensureDir(PUBLIC_DIR);

  // 1. Render the small PNGs that go into the ICO container.
  const icoEntries = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, buf: await renderPng(size) })),
  );
  const icoBuffer = buildIco(icoEntries);
  const icoPath = path.join(APP_DIR, 'favicon.ico');
  await writeFile(icoPath, icoBuffer);

  // 2. Larger PNG icons for Next.js icon + apple-icon conventions.
  const iconPng = await renderPng(ICON_PNG_SIZE);
  const iconPath = path.join(APP_DIR, 'icon.png');
  await writeFile(iconPath, iconPng);

  const applePng = await renderPng(APPLE_ICON_SIZE);
  const applePath = path.join(APP_DIR, 'apple-icon.png');
  await writeFile(applePath, applePng);

  // 3. Spare PNGs in /public for explicit linking.
  const fav16 = await renderPng(16);
  const fav32 = await renderPng(32);
  const fav16Path = path.join(PUBLIC_DIR, 'favicon-16.png');
  const fav32Path = path.join(PUBLIC_DIR, 'favicon-32.png');
  await writeFile(fav16Path, fav16);
  await writeFile(fav32Path, fav32);

  console.log('Favicons built:');
  console.log(`  ${path.relative(ROOT, icoPath).padEnd(28)} ${formatBytes(icoBuffer.length).padStart(9)} (ICO ${ICO_SIZES.join('/')})`);
  console.log(`  ${path.relative(ROOT, iconPath).padEnd(28)} ${formatBytes(iconPng.length).padStart(9)} (PNG ${ICON_PNG_SIZE}×${ICON_PNG_SIZE})`);
  console.log(`  ${path.relative(ROOT, applePath).padEnd(28)} ${formatBytes(applePng.length).padStart(9)} (PNG ${APPLE_ICON_SIZE}×${APPLE_ICON_SIZE})`);
  console.log(`  ${path.relative(ROOT, fav16Path).padEnd(28)} ${formatBytes(fav16.length).padStart(9)} (PNG 16×16)`);
  console.log(`  ${path.relative(ROOT, fav32Path).padEnd(28)} ${formatBytes(fav32.length).padStart(9)} (PNG 32×32)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
