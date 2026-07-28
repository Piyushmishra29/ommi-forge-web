import type { Metadata } from 'next';
import { Scene3DProvider } from '@/components/three3';
import SolutionsHero from '@/components/sections/solutions/SolutionsHero';
import MethodsPinned from '@/components/sections/solutions/MethodsPinned';
import SolutionsClosingCta from '@/components/sections/solutions/SolutionsClosingCta';

export const metadata: Metadata = {
  title: 'Solutions — Closed die, open die, ring rolling, upset',
  description:
    'Eight power hammers for closed-die forgings to 50 kg, an open-die line to 500 kg, a ring-rolling mill to 1500 mm, and an upset-forging line for shafts to 6 inch diameter.',
};

/**
 * /solutions — four methods, four camera moves (§5.4).
 *
 * `Scene3DProvider` is mounted once, here, and it is the route's ONLY WebGL
 * context. It renders nothing until `MethodsPinned`'s slot reports that it
 * is approaching the viewport, so the hero above paints with zero three.js
 * bytes on the wire.
 *
 * This file stays a server component — the provider is a client boundary
 * and the sections below it are already client components, so wrapping them
 * costs nothing and keeps `metadata` where the App Router wants it.
 */
export default function SolutionsPage() {
  return (
    <Scene3DProvider>
      <SolutionsHero />
      <MethodsPinned />
      <SolutionsClosingCta />
    </Scene3DProvider>
  );
}
