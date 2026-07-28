/**
 * Encode the §5.9 poster PNGs into the two formats the site actually ships.
 *
 * `scripts/build-posters.py` writes lossless PNGs (100–300 KB each) into
 * `scripts/posters/out/`. Those are the master; they are not served. This
 * turns each one into an AVIF + WebP pair under `public/assets/posters/`,
 * which is what `<picture>` picks from — same convention, and same
 * `withExt()` helper, as `scripts/optimize-images.mjs` uses for photography.
 *
 * Budget: §5.9 sets ≤ 70 KB per poster and a hard cap of 90 KB. These are
 * dark, low-frequency renders on a flat graphite ground, so q72 lands far
 * under that; the script fails loudly if a file ever crosses the cap rather
 * than quietly shipping a heavy grid.
 *
 *   node scripts/encode-posters.mjs
 */

import { mkdir, readdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(REPO, 'scripts', 'posters', 'out');
const DEST = join(REPO, 'public', 'assets', 'posters');

/** §5.9: target ≤ 70 KB, hard cap 90 KB. */
const TARGET_BYTES = 70 * 1024;
const CAP_BYTES = 90 * 1024;

async function main() {
  await mkdir(DEST, { recursive: true });

  const files = (await readdir(SRC)).filter((f) => f.endsWith('.png')).sort();
  if (files.length === 0) {
    console.error('No PNGs in scripts/posters/out — run build-posters.py first.');
    process.exitCode = 1;
    return;
  }

  /** Bytes per §3.2 material state, so the report can split them. */
  const byState = new Map();
  let over = 0;

  for (const file of files) {
    const name = basename(file, '.png');
    const input = sharp(join(SRC, file));

    const webp = await input.clone().webp({ quality: 72, effort: 6 }).toBuffer();
    // AVIF at the same perceptual quality runs ~35% smaller on this kind of
    // image; `effort: 6` is the point where encode time stops buying bytes.
    const avif = await input.clone().avif({ quality: 55, effort: 6 }).toBuffer();

    await writeFile(join(DEST, `${name}.webp`), webp);
    await writeFile(join(DEST, `${name}.avif`), avif);

    // AVIF is what an evergreen browser actually downloads, so that is the
    // number the budget is measured against.
    const state = name.includes('--') ? name.split('--')[1] : 'machined';
    const acc = byState.get(state) ?? { avif: 0, webp: 0, files: 0 };
    acc.avif += avif.length;
    acc.webp += webp.length;
    acc.files += 2;
    byState.set(state, acc);
    const flag =
      avif.length > CAP_BYTES ? ' ✗ OVER CAP' : avif.length > TARGET_BYTES ? ' ! over target' : '';
    if (avif.length > CAP_BYTES) over += 1;

    console.log(
      `  ${name.padEnd(20)} avif ${(avif.length / 1024).toFixed(1).padStart(6)} KB  ` +
        `webp ${(webp.length / 1024).toFixed(1).padStart(6)} KB${flag}`,
    );
  }

  const master = await Promise.all(
    files.map(async (f) => (await stat(join(SRC, f))).size),
  );

  console.log('');
  let avifAll = 0;
  let webpAll = 0;
  let filesAll = 0;
  for (const [state, acc] of [...byState].sort()) {
    avifAll += acc.avif;
    webpAll += acc.webp;
    filesAll += acc.files;
    console.log(
      `  ${state.padEnd(12)} ${String(acc.files).padStart(2)} files · ` +
        `${(acc.avif / 1024).toFixed(0).padStart(3)} KB avif · ` +
        `${(acc.webp / 1024).toFixed(0).padStart(3)} KB webp`,
    );
  }
  console.log(
    `  ${'TOTAL'.padEnd(12)} ${String(filesAll).padStart(2)} files · ` +
      `${(avifAll / 1024).toFixed(0).padStart(3)} KB avif · ` +
      `${(webpAll / 1024).toFixed(0).padStart(3)} KB webp ` +
      `(masters ${(master.reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1)} MB, not shipped)`,
  );

  if (over > 0) {
    console.error(`${over} poster(s) over the 90 KB cap — lower quality or size.`);
    process.exitCode = 1;
  }
}

await main();
