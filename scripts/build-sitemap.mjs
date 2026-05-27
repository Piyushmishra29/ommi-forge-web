#!/usr/bin/env node
/**
 * build-sitemap.mjs
 *
 * Generates `public/sitemap.xml` from the canonical content modules:
 *   - `src/data/nav.ts`     → top-level routes
 *   - `src/data/renders.ts` → the 9 render-detail slugs
 *
 * We import via `tsx`-free regex extraction so this stays a plain Node
 * script (no extra dev dependency, no ts-node startup cost). The data
 * files use a tiny subset of TS literal syntax we can parse robustly.
 *
 * Run: `pnpm build:sitemap`
 */
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);

const ORIGIN = 'https://www.ommiforge.com';
const NAV_FILE = path.join(ROOT, 'src', 'data', 'nav.ts');
const RENDERS_FILE = path.join(ROOT, 'src', 'data', 'renders.ts');
const OUT = path.join(ROOT, 'public', 'sitemap.xml');
const CONTACT_HREF = '/contact/';

/**
 * Extract `href: '/xyz/'` values from nav.ts.
 */
async function readNavHrefs() {
  const src = await readFile(NAV_FILE, 'utf8');
  const matches = [...src.matchAll(/href:\s*['"]([^'"]+)['"]/g)];
  return matches.map((m) => m[1]);
}

/**
 * Extract `slug: "a"` values from renders.ts.
 */
async function readRenderSlugs() {
  const src = await readFile(RENDERS_FILE, 'utf8');
  const matches = [...src.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
  return matches.map((m) => m[1]);
}

function toUrl(href) {
  // ORIGIN already has no trailing slash; `href` always starts with `/`.
  return `${ORIGIN}${href}`;
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function buildXml(entries, lastmod) {
  const urls = entries
    .map(({ loc, priority, changefreq }) => {
      const parts = [`<loc>${loc}</loc>`, `<lastmod>${lastmod}</lastmod>`];
      if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`);
      if (priority) parts.push(`<priority>${priority}</priority>`);
      return `  <url>${parts.join('')}</url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const [navHrefs, renderSlugs] = await Promise.all([
    readNavHrefs(),
    readRenderSlugs(),
  ]);

  if (navHrefs.length === 0) throw new Error('No nav hrefs found in nav.ts');
  if (renderSlugs.length === 0) throw new Error('No render slugs found in renders.ts');

  const lastmod = isoDate();

  // Top-level routes from NAV + the CTA route (`/contact/`).
  const topRoutes = Array.from(new Set([...navHrefs, CONTACT_HREF]));

  const entries = [];
  for (const href of topRoutes) {
    entries.push({
      loc: toUrl(href),
      priority: href === '/' ? '1.0' : '0.8',
      changefreq: href === '/' ? 'monthly' : undefined,
    });
  }
  for (const slug of renderSlugs) {
    entries.push({
      loc: toUrl(`/renders/${slug}/`),
      priority: '0.6',
    });
  }

  const xml = buildXml(entries, lastmod);
  await writeFile(OUT, xml, 'utf8');

  console.log(`sitemap.xml written: ${entries.length} URLs, lastmod ${lastmod}`);
  for (const e of entries) console.log(`  ${e.loc}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
