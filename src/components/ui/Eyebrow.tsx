import { cn } from '@/lib/cn';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/**
 * Eyebrow
 *
 * Small uppercase Work Sans 600 label with a leading mesh-orange dash.
 * Sits above section headlines throughout the site.
 */
export default function Eyebrow({
  children,
  className,
  as: Tag = 'p',
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        'inline-flex items-center gap-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-px w-8 bg-mesh"
      />
      <span>{children}</span>
    </Tag>
  );
}
