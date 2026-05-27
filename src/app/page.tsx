import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Temporary home page.
 *
 * Holds the scaffold together so the dev server boots cleanly while
 * another agent assembles the cinematic home (hero video, hammer
 * strike, materials grid, stats, plant walkthrough, heritage, etc.).
 * Replace this file when that work lands.
 */
export default function HomePlaceholder() {
  return (
    <section className="flex min-h-[calc(100dvh-68px)] items-center justify-center px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow className="justify-center">Coming soon</Eyebrow>
        <h1 className="mt-6 font-display text-5xl font-light leading-[1.1] text-graphite md:text-7xl">
          Ommi Forge
        </h1>
        <p className="mt-6 font-body text-base text-steel md:text-lg">
          Forged in India since 1975. A cinematic rebuild of
          ommiforge.com is in the press.
        </p>
        <p className="mt-10 font-eyebrow text-xs font-semibold uppercase tracking-[0.32em] text-mesh">
          Design system online · Pages assembling
        </p>
      </div>
    </section>
  );
}
