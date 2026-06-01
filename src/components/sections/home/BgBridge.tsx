/**
 * BgBridge
 *
 * A thin vertical-gradient slab inserted between two home-page sections
 * with contrasting background colors (e.g. dark Hero → light Hammer).
 * Without it, the user sees a hard horizontal line where one bg slams
 * against the next. The gradient bridges from the prior section's color
 * to the next one's, so the eye reads a soft wash instead of a strobe.
 *
 * Heights are deliberately small (64–96 px) — enough to soften the
 * boundary, short enough not to read as its own "section."
 */
type ToneToken = 'graphite' | 'paper' | 'saffron';

const TONE: Record<ToneToken, string> = {
  graphite: 'var(--color-graphite)',
  paper: 'var(--color-paper)',
  saffron: 'var(--color-saffron)',
};

interface BgBridgeProps {
  /** Top color (the section that just ended). */
  from: ToneToken;
  /** Bottom color (the section about to begin). */
  to: ToneToken;
  /** Height in CSS pixels. Default 96. */
  heightPx?: number;
}

export default function BgBridge({ from, to, heightPx = 96 }: BgBridgeProps) {
  return (
    <div
      aria-hidden
      style={{
        height: `${heightPx}px`,
        background: `linear-gradient(to bottom, ${TONE[from]} 0%, ${TONE[to]} 100%)`,
      }}
    />
  );
}
