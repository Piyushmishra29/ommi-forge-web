"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StlPreview } from "@/components/three/lazy";
import type { Render } from "@/data/renders";

// Models already asked for this session — so hovering a tile twice, or two
// tiles that share a GLB, injects at most one <link rel="prefetch">.
const prefetched = new Set<string>();

/**
 * On hover/focus intent, warm the browser cache for a tile's GLB so the
 * detail route's <StlViewer> has it ready. Fire-and-forget; deduped.
 */
function prefetchModel(href: string) {
  if (typeof document === "undefined" || prefetched.has(href)) return;
  prefetched.add(href);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

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
            className="group block overflow-hidden bg-paper ring-1 ring-black/5 transition hover:ring-mesh/40"
            data-magnetic
            onMouseEnter={() => prefetchModel(render.model)}
            onFocus={() => prefetchModel(render.model)}
          >
            <StlPreview
              src={render.model}
              ariaLabel={`${render.title} — ${render.productName}`}
              className="transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <div className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.25em] text-steel">
                  {render.title}
                </div>
                <h2 className="mt-1 font-display text-lg font-light text-graphite">
                  {render.productName}
                </h2>
              </div>
              <ul className="flex flex-wrap justify-end gap-1.5">
                {render.tags.map((tag) => (
                  <li
                    key={tag}
                    className="bg-snow px-2 py-0.5 font-eyebrow text-[10px] uppercase tracking-wider text-steel ring-1 ring-black/5"
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
