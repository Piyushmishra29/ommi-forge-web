"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StlPreview } from "@/components/three/StlPreview";
import type { Render } from "@/data/renders";

export function RendersGrid({ renders }: { renders: Render[] }) {
  return (
    <motion.ul
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {renders.map((render) => (
        <motion.li
          key={render.slug}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          <Link
            href={`/renders/${render.slug}`}
            className="group block overflow-hidden rounded-md bg-render-bg ring-1 ring-black/5 transition hover:ring-mesh/40"
            data-magnetic
          >
            <StlPreview
              src={render.stl}
              ariaLabel={`${render.title} — ${render.productName}`}
              className="transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <div className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.25em] text-steel">
                  {render.title}
                </div>
                <div className="mt-1 font-display text-lg text-graphite">
                  {render.productName}
                </div>
              </div>
              <ul className="flex flex-wrap justify-end gap-1.5">
                {render.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-snow px-2 py-0.5 font-eyebrow text-[10px] uppercase tracking-wider text-steel ring-1 ring-black/5"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
