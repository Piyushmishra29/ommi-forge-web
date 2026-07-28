import { cn } from '@/lib/cn';

/**
 * PaperCard — the datasheet rule (§2.3), as a primitive.
 *
 * A `snow`/`paper` block lying on the dark ground, used for exactly one
 * thing: **cold technical information**. Grade tables, the contact form,
 * the location block, spec lists. `/materials` and `/contact` are built
 * almost entirely from these, and that contrast with the forge-floor
 * pages is the argument — the QC lab is lit differently.
 *
 * The geometry (min-width 480px, corners ≤2px, no drop shadow, optional
 * single 4px saffron top rule) lives in the `.paper-card` block in
 * `globals.css`, not here, so it holds for anything that carries the
 * class — including markup a future author writes by hand.
 *
 * WHY THIS IS A BOUNDARY AND NOT A CONVENTION
 * `.paper-card` re-declares the six `--color-ink*` / `--color-rule` /
 * `--color-surface` semantic tokens for its subtree. Tailwind v4 compiles
 * `text-ink-accent` to `color: var(--color-ink-accent)` — a variable
 * reference, not a baked value — so every descendant utility re-resolves
 * against the light palette automatically. Concretely:
 *
 *   - `<Eyebrow>` renders saffron on graphite and ember on paper with no
 *     prop, no branch, and no author decision.
 *   - Components already written against the v2 light tokens
 *     (`text-graphite`, `text-ember`, `text-steel`, `text-cinder`,
 *     `border-graphite/25`) are correct in here *unchanged*. That is how
 *     the v2 accessibility pass survives the dark conversion: the light
 *     rules did not go away, they moved inside a boundary. `ContactForm`
 *     went into a paper card with its colour classes untouched.
 *
 * What must NOT go in one: anything warm or narrative, and anything
 * under 480px wide. A small white rounded rectangle on the dark ground
 * is a chip, and a chip is the thing this primitive exists to prevent.
 */
interface PaperCardProps {
  children: React.ReactNode;
  /** `snow` (default) or the slightly warmer `paper`. §2.3 permits either. */
  tone?: 'snow' | 'paper';
  /**
   * Draws the one permitted warm accent: a single 4px saffron rule along
   * the top edge. Nothing else warm belongs on a sheet.
   */
  topRule?: boolean;
  className?: string;
  /** Defaults to `<div>`; pass `section`/`article` where the outline needs it. */
  as?: 'div' | 'section' | 'article' | 'aside';
  id?: string;
  'aria-labelledby'?: string;
}

export default function PaperCard({
  children,
  tone = 'snow',
  topRule = false,
  className,
  as: Tag = 'div',
  id,
  'aria-labelledby': ariaLabelledBy,
}: PaperCardProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn('paper-card', className)}
      data-tone={tone === 'paper' ? 'paper' : undefined}
      data-rule={topRule ? 'saffron' : undefined}
    >
      {children}
    </Tag>
  );
}
