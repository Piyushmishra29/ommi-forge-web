import { statSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RENDERS, generateRenderParams, getRenderBySlug } from '@/data/renders';
import { StlViewer } from '@/components/three/lazy';
import PartPoster from '@/components/three/PartPoster';
import Eyebrow from '@/components/ui/Eyebrow';
import PaperCard from '@/components/ui/PaperCard';

/** `2.9 MB` — binary MiB, matching how file managers/browsers show size. */
function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File sizes aren't in `data/renders.ts` (single source of truth for the
 * catalog, not asset metadata), so we read them straight off disk. This
 * page is fully static-exported — `generateStaticParams` pre-renders every
 * slug at build time — so `fs` only ever runs on the build machine, never
 * in a browser or at request time. Falls back to `undefined` (link/label
 * just omits the size) rather than failing the build if a file's missing.
 */
function statSizeBytes(publicRelativePath: string): number | undefined {
  try {
    return statSync(join(process.cwd(), 'public', publicRelativePath)).size;
  } catch {
    return undefined;
  }
}

export async function generateStaticParams() {
  return generateRenderParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const render = getRenderBySlug(slug);
  if (!render) return { title: 'Render not found · Ommi Forge' };
  return {
    title: `${render.title} · ${render.productName} · Ommi Forge`,
    description: render.blurb,
  };
}

/**
 * `/renders/[slug]` — inspection (§5.7).
 *
 * The one route on the site with `OrbitControls` and auto-rotate, because it
 * is the one place the visitor's job is to look at a part from every side
 * (§4.3). Everywhere else, motion is scroll-driven.
 *
 * The still under the viewer is not decoration. It is the LCP element, it is
 * what the exported HTML contains before any JS runs, it is what a crawler
 * indexes, and it is what stays on screen if WebGL never comes up. The
 * viewer's own background is transparent until the geometry lands, so the
 * canvas takes over from the image with nothing to see.
 */
export default async function RenderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const render = getRenderBySlug(slug);
  if (!render) notFound();

  // Sibling navigation
  const index = RENDERS.findIndex((r) => r.slug === render.slug);
  const prev = index > 0 ? RENDERS[index - 1] : RENDERS[RENDERS.length - 1];
  const next = index < RENDERS.length - 1 ? RENDERS[index + 1] : RENDERS[0];

  const stlSizeBytes = statSizeBytes(render.stl);
  const modelSizeBytes = statSizeBytes(render.model);
  const stlLinkLabel = stlSizeBytes
    ? `Download STL · ${formatFileSize(stlSizeBytes)}`
    : 'Download STL';
  const modelLinkLabel = modelSizeBytes
    ? `Download GLB · ${formatFileSize(modelSizeBytes)}`
    : 'Download GLB';

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-page page-x pt-12">
        <ol className="type-eyebrow flex items-center gap-2">
          <li>
            <Link href="/renders/" className="underline-offset-4 hover:underline">
              Renders
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-swarf">{render.title}</li>
        </ol>
      </nav>

      {/* Viewer. The poster sits behind it — see the page doc comment. */}
      <section className="mt-8">
        <div className="relative mx-auto h-[60svh] max-w-[1400px] bg-graphite md:h-[80svh]">
          {/* Both layers are positioned by their own wrapper. Passing
              `absolute` to a component whose root already carries `relative`
              does not work: Tailwind emits `.relative` after `.absolute`, so
              the component's own class wins and the layer lands in flow. */}
          <div className="absolute inset-0">
            <PartPoster
              model={render.model}
              alt={`${render.productName} — render of the forged part`}
              fit="contain"
              priority
            />
          </div>
          <div className="absolute inset-0">
            <StlViewer
              src={render.model}
              title={render.title}
              productName={render.productName}
              description={render.blurb}
              modelSizeBytes={modelSizeBytes}
            />
          </div>
        </div>
      </section>

      {/* Description + datasheet */}
      <section className="section-y mx-auto max-w-page page-x">
        {/* An explicit 480px track rather than §2.5's 7/5 split: a paper card
            has a hard 480px floor (§2.3), and 5 of 12 columns inside
            `max-w-page` is ~440px — the card would have overflowed its own
            column. The copy takes whatever is left. */}
        <div className="grid gap-10 lg:grid-cols-[1fr_480px] lg:gap-12">
          <div>
            <Eyebrow>{`RENDER ${slug.toUpperCase()}`}</Eyebrow>
            <h1 className="type-display-l mt-4">{render.productName}</h1>
            <p className="type-lede mt-8 max-w-[54ch]">{render.blurb}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {render.tags.map((tag) => (
                <li
                  key={tag}
                  className="type-meta border border-cinder px-3 py-1 uppercase tracking-[0.16em]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          {/* The datasheet (§2.3). File formats and byte counts are exactly
              the "cold technical information" a paper card is for, and the
              boundary carries the whole v2 light-mode contrast system with
              it: `--color-ink*` re-points inside this subtree, so `graphite`
              text, `cinder` tertiary and `ash` hairlines are correct in here
              even though every one of them fails AA on the dark ground
              outside it.

              Everything below is read at build time — the names come from
              `data/renders.ts`, the sizes from `fs.statSync`. Nothing here is
              typed by hand, so nothing here can go stale. */}
          <PaperCard as="aside" topRule aria-labelledby="datasheet-heading">
            <div className="p-8">
              <h2 id="datasheet-heading" className="type-eyebrow">
                Files &amp; specification
              </h2>

              <dl className="mt-6">
                {[
                  { term: 'Render code', value: render.title },
                  { term: 'Process', value: render.tags.join(' · ') },
                  {
                    term: 'Geometry',
                    value: modelSizeBytes
                      ? `${render.model.split('/').pop()} · ${formatFileSize(modelSizeBytes)}`
                      : (render.model.split('/').pop() ?? ''),
                  },
                  {
                    term: 'Print file',
                    value: stlSizeBytes
                      ? `${render.stl.split('/').pop()} · ${formatFileSize(stlSizeBytes)}`
                      : (render.stl.split('/').pop() ?? ''),
                  },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="flex items-baseline justify-between gap-6 border-b border-ash/40 py-3"
                  >
                    <dt className="type-meta uppercase tracking-[0.16em] text-ink-muted">
                      {row.term}
                    </dt>
                    {/* No case transform: these are part numbers and file
                        names, and `RENDER A` / `0.6 MB` are how they are
                        written everywhere else on the site. */}
                    <dd className="type-spec text-right text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* File type + size spelled out in the link text itself — not
                  just aria-label — so "what am I about to download" is
                  answered without a title-attribute hover or sr-only text.
                  py-3.5 clears the 44px minimum tap target. Neither link
                  needs WebGL, which is exactly why they survive the no-WebGL
                  path intact (§4.5).

                  Graphite fill, not saffron: §2.3 allows a sheet exactly one
                  warm mark, the 4px top rule, and it already has it. */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href={render.stl}
                  download
                  data-magnetic
                  className="type-eyebrow inline-flex min-h-11 items-center gap-3 bg-graphite px-6 py-3.5 text-paper transition-colors hover:bg-ember"
                >
                  {stlLinkLabel}
                  <span aria-hidden="true">↓</span>
                </a>
                <a
                  href={render.model}
                  download
                  className="type-eyebrow inline-flex min-h-11 items-center gap-2 text-ink-accent underline-offset-4 hover:underline"
                >
                  {modelLinkLabel}
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </PaperCard>
        </div>
      </section>

      {/* Sibling nav */}
      <section className="mx-auto max-w-page page-x pb-24">
        <div className="grid grid-cols-1 gap-4 border-t border-cinder pt-8 sm:grid-cols-2">
          <Link
            href={`/renders/${prev.slug}`}
            className="flex flex-col bg-slag p-6 transition-colors hover:bg-slag/60"
          >
            <span className="type-eyebrow">← Previous</span>
            <span className="type-display-s mt-2">
              {prev.title} · {prev.productName}
            </span>
          </Link>
          <Link
            href={`/renders/${next.slug}`}
            className="flex flex-col items-end bg-slag p-6 text-right transition-colors hover:bg-slag/60"
          >
            <span className="type-eyebrow">Next →</span>
            <span className="type-display-s mt-2">
              {next.title} · {next.productName}
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
