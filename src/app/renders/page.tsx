import type { Metadata } from 'next';
import { Scene3DProvider } from '@/components/three3';
import Eyebrow from '@/components/ui/Eyebrow';
import RendersShowroom from '@/components/sections/renders/RendersShowroom';

export const metadata: Metadata = {
  title: '3D Renders — Forged parts in motion',
  description:
    'Engineered in metal, explored in motion — nine forged parts from the Ommi Forge tooling library, inspectable in 3D and downloadable as STL.',
};

/**
 * `/renders` — the hub (§5.6).
 *
 * `<Scene3DProvider>` sits here, once, as high in the route as it can go: it
 * owns the single `<Canvas>` this route is allowed, and that canvas is not
 * created until a `<SceneSlot>` reports it is approaching the viewport.
 * Everything above the fold is HTML, type and a 3 KB poster.
 *
 * No `<main>` here — `layout.tsx` provides the one this page fills.
 */
export default function RendersHubPage() {
  return (
    <Scene3DProvider>
      <section className="section-y-lg relative">
        <div className="mx-auto max-w-page page-x">
          <Eyebrow>3D Renders</Eyebrow>
          <h1 className="type-display-l mt-8 max-w-[14ch]">
            Engineered in metal, explored in motion.
          </h1>
          <p className="type-lede mt-10 max-w-[60ch]">
            Every part below is a real forging from our tooling library — turn
            the geometry over and look at it before anyone draws a print. Each
            one ships with its STL.
          </p>
        </div>
      </section>

      <RendersShowroom />
    </Scene3DProvider>
  );
}
