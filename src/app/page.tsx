import Hero from '@/components/sections/home/Hero';
import HammerStrikeIntro from '@/components/sections/home/HammerStrikeIntro';
import MaterialsGrid from '@/components/sections/home/MaterialsGrid';
import ProductsMarquee from '@/components/sections/home/ProductsMarquee';
import StatsCounter from '@/components/sections/home/StatsCounter';
import PlantWalkthrough from '@/components/sections/home/PlantWalkthrough';
import HeritageTimeline from '@/components/sections/home/HeritageTimeline';
import Location from '@/components/sections/home/Location';
import ClosingCta from '@/components/sections/home/ClosingCta';

/**
 * Ommi Forge — home page.
 *
 * Scroll order (each section is its own client/server component):
 *  1. Hero                — full-bleed muted hero video + headline
 *  2. HammerStrikeIntro   — pinned R3F hammer + Heat/Strike/Forge
 *  3. MaterialsGrid       — Carbon / Alloy / Stainless / Custom
 *  4. ProductsMarquee     — double-row infinite catalogue marquee
 *  5. StatsCounter        — 8 / 1000+ / 100+ / 1 day
 *  6. PlantWalkthrough    — scroll-scrubbed plant video
 *  7. HeritageTimeline    — 1975 → 2026 horizontal timeline
 *  8. Location            — Malur address + Maps iframe
 *  9. ClosingCta          — saffron slab, quote CTA
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HammerStrikeIntro />
      <MaterialsGrid />
      <ProductsMarquee />
      <StatsCounter />
      <PlantWalkthrough />
      <HeritageTimeline />
      <Location />
      <ClosingCta />
    </>
  );
}
