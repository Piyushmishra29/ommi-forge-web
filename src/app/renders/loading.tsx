/**
 * Route-transition placeholder for `/renders` and `/renders/[slug]`.
 *
 * Client-side navigation only — `loading.tsx` does not stream in a static
 * export, so this never appears on a cold HTML load, only in the brief gap
 * during an in-app `<Link>` transition. Real per-model progress lives one
 * level down, in `StlViewer`'s byte readout and the hub stage's.
 *
 * Deliberately static. §6.16 rejects a spinner (we have real byte progress
 * where it matters, and a rotating arc is not information) and §6.21 bans
 * motion that loops forever — the v2 version of this file animated a dashed
 * anvil outline indefinitely, which is both. `role="status"` +
 * `aria-live="polite"` so a screen reader hears the transition instead of
 * going silent.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60svh] w-full items-center justify-center bg-graphite"
    >
      <p className="type-eyebrow">Loading renders</p>
    </div>
  );
}
