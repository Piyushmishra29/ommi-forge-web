/**
 * Brand hex tokens.
 *
 * These mirror the Tailwind `@theme` colour tokens declared in
 * `src/app/globals.css`. Use Tailwind utilities (`bg-mesh`, `text-graphite`, …)
 * inside JSX whenever possible.
 *
 * Only reach for `BRAND_HEX` inside contexts that cannot consume CSS variables
 * — e.g. R3F `<meshStandardMaterial color={…} />` props, three.js material
 * constructors, or `<color attach="background" args={[…]} />`.
 *
 * Keeping a single source-of-truth export here means a brand-token tweak in
 * `globals.css` only needs to be mirrored in one TS file.
 */
export const BRAND_HEX = {
  saffron: "#FF9933",
  mesh: "#FF5533",
  // Darker mesh (~5.3:1 on paper) for small/body text on light bgs
  // where mesh/saffron fail AA contrast. See globals.css --color-ember.
  ember: "#C2381C",
  graphite: "#1F2124",
  steel: "#54595F",
  ash: "#7A7A7A",
  peach: "#FFBC7D",
  paper: "#FAFAFA",
  snow: "#FFFFFF",
  renderBg: "#D9D9D9",
  // v3 dark-ground additions. `graphite` is now the page ground AND the
  // WebGL clear colour, which is what removes the canvas seam — three.js
  // needs both of these as literal hex, hence the mirror.
  // swarf: AA-safe body grey on dark (6.19:1 on graphite, 5.31:1 on slag).
  swarf: "#9BA1A8",
  // slag: raised panel / inset surface (1.17:1 on graphite — decorative lift).
  slag: "#2A2D31",
} as const;

export type BrandHex = (typeof BRAND_HEX)[keyof typeof BRAND_HEX];
