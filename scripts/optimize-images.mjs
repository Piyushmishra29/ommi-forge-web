#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Walks `public/assets/images/` and emits sibling `.webp` (q 80) and
 * `.avif` (q 50) versions for every `.jpg|.jpeg|.png` source. Sources are
 * clamped to a max width of 1920 px (the largest viewport this site
 * targets). Existing siblings are skipped — this script is idempotent
 * and safe to re-run.
 *
 * Why this exists: `next.config.ts` sets `images.unoptimized: true`
 * because we publish via `output: 'export'` (no Next.js image
 * optimizer at runtime). That means raw JPG bytes ship to the client
 * unless we generate modern-format siblings ahead of time and serve
 * them via `<picture>` / `image-set()`.
 *
 * Run: `pnpm optimize-images`
 */
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'public',
  'assets',
  'images',
);

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 50;
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);

/**
 * Returns the size of `file` in bytes, or `null` if missing.
 */
async function fileSize(file) {
  try {
    const s = await stat(file);
    return s.size;
  } catch {
    return null;
  }
}

function formatBytes(n) {
  if (n === null) return '—';
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

/**
 * Pipeline shared by webp + avif: load source, downscale to MAX_WIDTH
 * only if larger (no upscale), then return the sharp instance ready to
 * be format-encoded.
 */
function buildPipeline(srcPath) {
  return sharp(srcPath).resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
    fit: 'inside',
  });
}

async function encodeWebp(srcPath, outPath) {
  await buildPipeline(srcPath)
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toFile(outPath);
}

async function encodeAvif(srcPath, outPath) {
  await buildPipeline(srcPath)
    .avif({ quality: AVIF_QUALITY, effort: 5 })
    .toFile(outPath);
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Images dir not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const entries = await readdir(IMAGES_DIR);
  const sources = entries.filter((name) =>
    SOURCE_EXT.has(path.extname(name).toLowerCase()),
  );

  if (sources.length === 0) {
    console.log('No source images found.');
    return;
  }

  console.log(
    `Optimising ${sources.length} image(s) in ${path.relative(process.cwd(), IMAGES_DIR)}\n`,
  );

  let totalSrc = 0;
  let totalWebp = 0;
  let totalAvif = 0;

  for (const name of sources) {
    const srcPath = path.join(IMAGES_DIR, name);
    const base = name.slice(0, name.length - path.extname(name).length);
    const webpPath = path.join(IMAGES_DIR, `${base}.webp`);
    const avifPath = path.join(IMAGES_DIR, `${base}.avif`);

    const srcSize = await fileSize(srcPath);
    if (srcSize !== null) totalSrc += srcSize;

    const tasks = [];
    if (!existsSync(webpPath)) {
      tasks.push(
        encodeWebp(srcPath, webpPath).catch((err) => {
          console.error(`  webp failed for ${name}:`, err.message);
        }),
      );
    }
    if (!existsSync(avifPath)) {
      tasks.push(
        encodeAvif(srcPath, avifPath).catch((err) => {
          console.error(`  avif failed for ${name}:`, err.message);
        }),
      );
    }

    if (tasks.length === 0) {
      console.log(`  skip ${name} (siblings present)`);
    } else {
      await Promise.all(tasks);
    }

    const webpSize = await fileSize(webpPath);
    const avifSize = await fileSize(avifPath);
    if (webpSize !== null) totalWebp += webpSize;
    if (avifSize !== null) totalAvif += avifSize;

    console.log(
      `  ${name.padEnd(40)} ${formatBytes(srcSize).padStart(9)} → webp ${formatBytes(webpSize).padStart(9)}  avif ${formatBytes(avifSize).padStart(9)}`,
    );
  }

  console.log(
    `\nTotals  src ${formatBytes(totalSrc)}  webp ${formatBytes(totalWebp)}  avif ${formatBytes(totalAvif)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
