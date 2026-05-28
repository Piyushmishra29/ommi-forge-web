import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RENDERS,
  generateRenderParams,
  getRenderBySlug,
} from "@/data/renders";
import { StlViewer } from "@/components/three/lazy";
import Eyebrow from "@/components/ui/Eyebrow";

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
  if (!render) return { title: "Render not found · Ommi Forge" };
  return {
    title: `${render.title} · ${render.productName} · Ommi Forge`,
    description: render.blurb,
  };
}

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
  const next =
    index < RENDERS.length - 1 ? RENDERS[index + 1] : RENDERS[0];

  return (
    <div className="min-h-screen bg-paper text-graphite">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-[1140px] px-6 pt-12"
      >
        <ol className="flex items-center gap-2 font-eyebrow text-[11px] uppercase tracking-[0.25em] text-steel">
          <li>
            <Link
              href="/renders/"
              className="underline-offset-4 hover:text-graphite hover:underline"
            >
              Renders
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-graphite">{render.title}</li>
        </ol>
      </nav>

      {/* Viewer */}
      <section className="mt-8 px-0 sm:px-6">
        <div className="mx-auto h-[60vh] max-w-[1400px] overflow-hidden md:h-[80vh]">
          <StlViewer
            src={render.stl}
            title={render.title}
            productName={render.productName}
          />
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-[1140px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>{`RENDER ${slug.toUpperCase()}`}</Eyebrow>
            <h1 className="mt-3 font-display font-light leading-[1.05] text-graphite text-[clamp(40px,7vw,96px)]">
              {render.productName}
            </h1>
          </div>
          <div>
            <p className="font-body text-lg leading-relaxed text-graphite">
              {render.blurb}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {render.tags.map((tag) => (
                <li
                  key={tag}
                  className="bg-snow px-3 py-1 font-eyebrow text-[11px] uppercase tracking-wider text-steel ring-1 ring-black/5"
                >
                  {tag}
                </li>
              ))}
            </ul>
            <p className="mt-8">
              <a
                href={render.stl}
                download
                className="inline-flex items-center gap-2 bg-graphite px-5 py-2 font-eyebrow text-[11px] uppercase tracking-[0.25em] text-snow transition hover:bg-mesh"
              >
                Download STL
                <span aria-hidden="true">↓</span>
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Sibling nav */}
      <section className="mx-auto max-w-[1140px] px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 border-t border-black/10 pt-8 sm:grid-cols-2">
          <Link
            href={`/renders/${prev.slug}`}
            className="group flex items-center justify-between bg-snow px-6 py-5 ring-1 ring-black/5 transition hover:ring-mesh/40"
          >
            <span className="flex flex-col">
              <span className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-steel">
                ← Previous
              </span>
              <span className="mt-1 font-display text-base text-graphite">
                {prev.title} · {prev.productName}
              </span>
            </span>
          </Link>
          <Link
            href={`/renders/${next.slug}`}
            className="group flex items-center justify-between bg-snow px-6 py-5 ring-1 ring-black/5 transition hover:ring-mesh/40"
          >
            <span className="flex flex-col items-end text-right">
              <span className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-steel">
                Next →
              </span>
              <span className="mt-1 font-display text-base text-graphite">
                {next.title} · {next.productName}
              </span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
