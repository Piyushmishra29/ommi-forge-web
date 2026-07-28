import { cn } from '@/lib/cn';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/**
 * Eyebrow
 *
 * Small uppercase Work Sans 600 label with a leading warm dash. Sits
 * above section headlines throughout the site.
 *
 * Colour comes from `--color-ink-accent` (via `.type-eyebrow`), which is
 * the whole point: this is the one label that appears on both grounds, so
 * it resolves to `saffron` on graphite (7.57:1) and to `ember` inside a
 * paper card (5.19:1 on paper) with no prop and no branch. The dash
 * follows it via `bg-current` — it used to be pinned to `mesh`, which is
 * ≈1.9:1 on peach and only 3:1 on paper.
 *
 * Metrics are §2.4's standard: 11px, 12px ≥1024, tracking 0.26em. v2
 * drifted between 0.18em and 0.30em across callers.
 */
export default function Eyebrow({
  children,
  className,
  as: Tag = 'p',
}: EyebrowProps) {
  return (
    <Tag className={cn('type-eyebrow inline-flex items-center gap-3', className)}>
      <span aria-hidden className="inline-block h-px w-8 bg-current" />
      <span>{children}</span>
    </Tag>
  );
}
