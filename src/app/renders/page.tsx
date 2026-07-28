import { RENDERS } from "@/data/renders";
import Eyebrow from "@/components/ui/Eyebrow";
import { RendersGrid } from "./renders-grid";

export const metadata = {
  title: "3D Renders — Forged parts in motion",
  description:
    "Engineered in metal, explored in motion — interactive 3D renders of forged industrial parts.",
};

export default function RendersHubPage() {
  return (
    <div className="min-h-screen bg-paper text-graphite">
      <section className="mx-auto max-w-page px-6 pt-32 pb-12 md:pt-44">
        <Eyebrow>3D Renders</Eyebrow>
        <h1 className="mt-8 font-display font-light leading-[0.98] text-graphite text-[clamp(48px,8vw,110px)]">
          Engineered in metal,
          <br />
          explored in motion.
        </h1>
        <p className="mt-10 max-w-2xl font-body text-base leading-relaxed text-steel md:text-lg md:leading-[1.7]">
          Drag, rotate, zoom — each render below is a real STL pulled from our
          tooling library. Use them to inspect geometry before we get to a
          drawing.
        </p>
      </section>

      <section className="mx-auto max-w-page px-6 pb-32">
        <RendersGrid renders={RENDERS} />
      </section>
    </div>
  );
}
