/**
 * 9 STL renders surfaced on the /renders hub + detail routes.
 *
 * The source site uses cryptic letter codes (RENDER A → RENDER I); we keep
 * the same letter codes for slugs (so the URLs stay short / mirror the legacy
 * site) but pair each with the actual product name from the Ommi Forge
 * dropdown nav so visitors know what they are looking at.
 */

export type Render = {
  slug: string;
  title: string;
  productName: string;
  blurb: string;
  stl: string;
  tags: string[];
};

export const RENDERS: Render[] = [
  {
    slug: "a",
    title: "RENDER A",
    productName: "Link",
    blurb:
      "A forged link used to transmit pulling and pushing loads between two pivot points in heavy mechanisms.",
    stl: "/assets/stl/part-a.stl",
    tags: ["closed-die", "link"],
  },
  {
    slug: "b",
    title: "RENDER B",
    productName: "Shifter Fork",
    blurb:
      "A precision-forged fork that slides gear collars along a transmission shaft to engage and disengage gears.",
    stl: "/assets/stl/part-b.stl",
    tags: ["closed-die", "transmission"],
  },
  {
    slug: "c",
    title: "RENDER C",
    productName: "Carrier",
    blurb:
      "A planetary gear carrier that holds and indexes pinion shafts in heavy-duty gearboxes and axles.",
    stl: "/assets/stl/part-c.stl",
    tags: ["closed-die", "gearbox"],
  },
  {
    slug: "d",
    title: "RENDER D",
    productName: "Steam Manifold",
    blurb:
      "A forged manifold that distributes high-pressure steam from a single inlet to multiple outlets in turbine and boiler lines.",
    stl: "/assets/stl/part-d.stl",
    tags: ["open-die", "manifold"],
  },
  {
    slug: "e",
    title: "RENDER E",
    productName: "Lever",
    blurb:
      "A forged actuation lever that translates input force into mechanical movement across linkages and control systems.",
    stl: "/assets/stl/part-e.stl",
    tags: ["closed-die", "lever"],
  },
  {
    slug: "f",
    title: "RENDER F",
    productName: "Crank",
    blurb:
      "A crank component that converts reciprocating motion into rotation inside engines and compressor assemblies.",
    stl: "/assets/stl/part-f.stl",
    tags: ["closed-die", "engine"],
  },
  {
    slug: "g",
    title: "RENDER G",
    productName: "Forged Sprocket",
    blurb:
      "A toothed sprocket forged to handle high torque and tension in chain-drive systems for industrial machinery.",
    stl: "/assets/stl/part-g.stl",
    tags: ["closed-die", "drivetrain"],
  },
  {
    slug: "h",
    title: "RENDER H",
    productName: "Hub",
    blurb:
      "A wheel hub forged for fatigue resistance, anchoring rotating assemblies to axles in trucks and off-highway vehicles.",
    stl: "/assets/stl/part-h.stl",
    tags: ["closed-die", "hub"],
  },
  {
    slug: "i",
    title: "RENDER I",
    productName: "Connecting Rod",
    blurb:
      "A connecting rod that links the piston to the crankshaft, transferring combustion force into rotational power.",
    stl: "/assets/stl/part-i.stl",
    tags: ["closed-die", "engine"],
  },
];

export function getRenderBySlug(slug: string): Render | undefined {
  return RENDERS.find((r) => r.slug === slug);
}

export async function generateRenderParams(): Promise<{ slug: string }[]> {
  return RENDERS.map((r) => ({ slug: r.slug }));
}
