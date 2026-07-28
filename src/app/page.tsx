import type { Metadata } from 'next';
import { Scene3DProvider } from '@/components/three3';
import HeatAct from '@/components/sections/home/HeatAct';
import ProductsMarquee from '@/components/sections/home/ProductsMarquee';
import MaterialsGrid from '@/components/sections/home/MaterialsGrid';
import PlantWalkthrough from '@/components/sections/home/PlantWalkthrough';
import HeritageTimeline from '@/components/sections/home/HeritageTimeline';
import StatsCounter from '@/components/sections/home/StatsCounter';
import Location from '@/components/sections/home/Location';
import ClosingCta from '@/components/sections/home/ClosingCta';

/**
 * Ommi Forge — home.
 *
 * The page is one heat (V3-DIRECTION §1): a single billet's trip down the
 * line, in order, once. Scroll is the conveyor, and the part on screen is
 * always the same part further along.
 *
 *  0–3  HeatAct          the one pinned act — cold open, Heat, Strike, Forge
 *   4   ProductsMarquee  the line: three parts crossing one frame, + catalogue
 *   5   MaterialsGrid    the cold bench. Paper cards, deliberately no 3D
 *   6   PlantWalkthrough scroll-scrubbed plant footage, photographic
 *   7   HeritageTimeline 1975 → 2026, the 2026 pilot still open
 *   8   StatsCounter     8 hammers · 1000+ MT/yr · 100+ parts · 1 day
 *   -   Location         the plant address, as a datasheet (§2.3)
 *   9   ClosingCta       the same part, machined and cold. The bookend
 *
 * `<Scene3DProvider>` wraps the whole page and owns exactly one WebGL
 * context; the two slots inside it (the act and the line) are rectangles of
 * that one canvas, not canvases of their own. It sits here rather than in
 * the layout because a route with no 3D should not carry a canvas host at
 * all, and it must not end up inside an ancestor that sets `transform`,
 * `filter` or `perspective` — any of those would make the fixed canvas
 * position itself against that ancestor instead of the viewport.
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
    <Scene3DProvider>
      <HeatAct />
      <ProductsMarquee />
      <MaterialsGrid />
      <PlantWalkthrough />
      <HeritageTimeline />
      <StatsCounter />
      <Location />
      <ClosingCta />
    </Scene3DProvider>
  );
}
