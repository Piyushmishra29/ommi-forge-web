import Link from "next/link";
import { RENDERS } from "@/data/renders";
import { RendersGrid } from "./renders-grid";

export const metadata = {
  title: "3D Renders · Ommi Forge",
  description:
    "Engineered in metal, explored in motion — interactive 3D renders of forged industrial parts.",
};

export default function RendersHubPage() {
  return (
    <main className="min-h-screen bg-[var(--render-bg,#FAFAFA)] text-[#1F2124]">
      <section className="mx-auto max-w-[1140px] px-6 pt-24 pb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#54595F]">
          3D Renders
        </p>
        <h1 className="mt-3 font-[Manrope,sans-serif] text-4xl font-light leading-[1.15] capitalize sm:text-5xl md:text-6xl">
          Engineered in metal,
          <br />
          explored in motion.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#54595F]">
          Drag, rotate, zoom — each render below is a real STL pulled from our
          tooling library. Use them to inspect geometry before we get to a
          drawing.
        </p>
        <div className="mt-8 text-[11px] uppercase tracking-[0.25em] text-[#54595F]">
          <Link
            href="/"
            className="underline-offset-4 hover:text-[#1F2124] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1140px] px-6 pb-32">
        <RendersGrid renders={RENDERS} />
      </section>
    </main>
  );
}
