import type { Metadata } from 'next';
import Hero from '@/components/sections/home/Hero';
import HammerStrikeIntro from '@/components/sections/home/HammerStrikeIntro';
import MaterialsGrid from '@/components/sections/home/MaterialsGrid';
import ProductsMarquee from '@/components/sections/home/ProductsMarquee';
import StatsCounter from '@/components/sections/home/StatsCounter';
import PlantWalkthrough from '@/components/sections/home/PlantWalkthrough';
import HeritageTimeline from '@/components/sections/home/HeritageTimeline';
import Location from '@/components/sections/home/Location';
import ClosingCta from '@/components/sections/home/ClosingCta';
import BgBridge from '@/components/sections/home/BgBridge';

/**
 * Ommi Forge — home page.
 *
 * Scroll order (each section is its own client/server component):
 *  1. Hero                — full-bleed muted hero video + headline
 *  2. HammerStrikeIntro   — pinned R3F hammer + Heat/Strike/Forge
 *  3. MaterialsGrid       — Carbon / Alloy / Stainless / Custom
 *  4. PlantWalkthrough    — scroll-scrubbed Ommi-fin drone footage
 *                           (moved up from Act 06 — its hero.mp4 source
 *                           is already in browser cache from the Hero,
 *                           so it loads instantly)
 *  5. StatsCounter        — 8 / 1000+ / 100+ / 1 day
 *  6. ProductsMarquee     — image-only catalogue marquee (moved down
 *                           from Act 04 — lazy-loaded JPGs cost less
 *                           than the previous STL canvases anyway)
 *  7. HeritageTimeline    — 1975 → 2026 horizontal timeline
 *  8. Location            — Malur address + Maps iframe
 *  9. ClosingCta          — saffron slab, quote CTA
 */
export const metadata: Metadata = {
  // Absolute title so the root `%s · Ommi Forge` template doesn't double
  // the brand name, and so the home tab matches the em-dash style used
  // by every other route.
  title: { absolute: 'Ommi Forge — Forged in India since 1975' },
  description:
    'Indian steel-forging company since 1975 — closed die, open die, ring rolling and upset forging. Plant in Malur, Karnataka.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Bridge dark hero footage → light Hammer act. Softens the
          previously-jarring graphite→paper slam at pin handoff. */}
      <BgBridge from="graphite" to="paper" />
      <HammerStrikeIntro />
      <MaterialsGrid />
      {/* Bridge light MaterialsGrid → dark Plant act. */}
      <BgBridge from="paper" to="graphite" />
      <PlantWalkthrough />
      <StatsCounter />
      {/* Bridge dark Stats → light Products. */}
      <BgBridge from="graphite" to="paper" />
      <ProductsMarquee />
      <HeritageTimeline />
      <Location />
      {/* Bridge light Location → saffron ClosingCta (intentional brand
          moment — keep slightly taller for the final "warming up"). */}
      <BgBridge from="paper" to="saffron" heightPx={140} />
      <ClosingCta />
    </>
  );
}
