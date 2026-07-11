/**
 * Catalogue for `/products`.
 *
 * Mixes two kinds of items:
 *  - `kind: 'stl'`   — uses a meshopt-compressed GLB under
 *                       /public/assets/models/. Renders via
 *                       <StlPreview> on the grid, <StlViewer> in the
 *                       modal overlay.
 *  - `kind: 'image'` — uses one of the source photos under
 *                       /public/assets/images/. Same overlay flow,
 *                       just <img> instead of canvas.
 *
 * Editorial taxonomy
 * ------------------
 * Every item also carries a `category` (`featured` | `catalogue`) so
 * `/products` can split the page into editorial rhythms instead of one
 * continuous wall of tiles:
 *  - `featured` — three hero pieces shown 3-up at the top, big tiles.
 *  - `catalogue` — the rest, rendered in the existing CSS-columns
 *    masonry.
 *
 * `applications` is an array of industries the part typically serves
 * (auto / industrial / agricultural). The by-application section
 * groups by these tags. Defaults to `['industrial']` when omitted.
 *
 * Both fields are optional in the type so older callers/items keep
 * compiling — the page defaults missing values where it needs them.
 */

export type ProductCategory = 'featured' | 'catalogue';

export type ProductApplication = 'auto' | 'industrial' | 'agricultural';

export const APPLICATION_LABEL: Record<ProductApplication, string> = {
  auto: 'Automotive',
  industrial: 'Industrial machinery',
  agricultural: 'Agricultural',
};

interface ProductItemBase {
  slug: string;
  name: string;
  code: string;
  blurb: string;
  aspect: 'tall' | 'wide' | 'square';
  category?: ProductCategory;
  applications?: ReadonlyArray<ProductApplication>;
}

export type ProductItem =
  | (ProductItemBase & {
      kind: 'stl';
      /**
       * meshopt-compressed GLB the viewer loads. 9 of the named products
       * are byte-dupes of the numbered renders (see MEDIA_MANIFEST) so they
       * point at the shared `part-*.glb`; `tvs-1200` and `trunnion-85000103`
       * have their own GLBs. There is no STL download in the products UI, so
       * the raw named STLs (being removed) are no longer referenced here.
       */
      model: string;
    })
  | (ProductItemBase & {
      kind: 'image';
      src: string;
    });

export const PRODUCTS: ReadonlyArray<ProductItem> = [
  {
    kind: 'stl',
    slug: 'trunnion-85000103',
    name: 'Trunnion',
    code: '85000103',
    blurb: 'Heavy-duty trunnion pin forged for off-highway pivot assemblies.',
    model: '/assets/models/trunnion-85000103.glb',
    aspect: 'tall',
    category: 'featured',
    applications: ['industrial', 'agricultural'],
  },
  {
    kind: 'stl',
    slug: 'sprocket-451-zz-50163',
    name: 'Drive Sprocket',
    code: '451-ZZ-50163-V1',
    blurb: 'Forged sprocket blank for chain-drive industrial reduction units.',
    model: '/assets/models/part-i.glb',
    aspect: 'square',
    category: 'featured',
    applications: ['industrial', 'agricultural'],
  },
  {
    kind: 'stl',
    slug: 'cylinder-head-130hcb9319',
    name: 'Cylinder Head Blank',
    code: '130HCB9319',
    blurb: 'Near-net-shape cylinder-head forging — final machining done at the customer site.',
    model: '/assets/models/part-e.glb',
    aspect: 'wide',
    category: 'featured',
    applications: ['auto'],
  },
  {
    kind: 'stl',
    slug: 'tvs-1200',
    name: 'TVS 1200 Casing',
    code: 'TVS-1200',
    blurb: 'Closed-die transmission casing forging for two-wheeler applications.',
    model: '/assets/models/tvs-1200.glb',
    aspect: 'square',
    category: 'catalogue',
    applications: ['auto'],
  },
  {
    kind: 'stl',
    slug: 'shaft-fan-hub',
    name: 'Fan Hub Shaft',
    code: 'CUHU1001F001',
    blurb: 'Shaft-fan-hub assembly forged from 42CrMo4 for vibration-resistant rotation.',
    model: '/assets/models/part-h.glb',
    aspect: 'wide',
    category: 'catalogue',
    applications: ['industrial'],
  },
  {
    kind: 'stl',
    slug: 'right-lever-b14072',
    name: 'Right Lever',
    code: 'B14072-8',
    blurb: 'Closed-die right-hand actuation lever for transmission linkage.',
    model: '/assets/models/part-g.glb',
    aspect: 'square',
    category: 'catalogue',
    applications: ['auto', 'industrial'],
  },
  {
    kind: 'stl',
    slug: 'lever-b121768',
    name: 'Selector Lever',
    code: 'B121768',
    blurb: 'Forged selector lever — used to engage gear positions in heavy gearboxes.',
    model: '/assets/models/part-f.glb',
    aspect: 'tall',
    category: 'catalogue',
    applications: ['industrial'],
  },
  {
    kind: 'stl',
    slug: 'body-8-way',
    name: '8-Way Valve Body',
    code: 'UM800900000B-BO-MODI',
    blurb: 'Forged hydraulic distributor body — eight outlet ports machined post-forging.',
    model: '/assets/models/part-d.glb',
    aspect: 'square',
    category: 'catalogue',
    applications: ['industrial', 'agricultural'],
  },
  {
    kind: 'stl',
    slug: 'bm-140-rh-link',
    name: 'BM 140 RH Link',
    code: 'BM-140-RH',
    blurb: 'Right-hand link in EN24 alloy — case-hardened, shot-peened, magnetic-particle tested.',
    model: '/assets/models/part-a.glb',
    aspect: 'tall',
    category: 'catalogue',
    applications: ['agricultural', 'industrial'],
  },
  {
    kind: 'stl',
    slug: '4308128-forging-model',
    name: 'Forging Model',
    code: '4308128-V1',
    blurb: 'Reference forging model for tooling validation and grain-flow review.',
    model: '/assets/models/part-b.glb',
    aspect: 'square',
    category: 'catalogue',
    applications: ['industrial'],
  },
  {
    kind: 'stl',
    slug: 'part-1011',
    name: 'Part 1011',
    code: '1011',
    blurb: 'Closed-die forging for an OEM heavy-duty axle programme.',
    model: '/assets/models/part-c.glb',
    aspect: 'wide',
    category: 'catalogue',
    applications: ['auto'],
  },
  {
    kind: 'image',
    slug: 'forge-floor',
    name: 'Power Hammer Bay',
    code: 'PLANT',
    blurb: 'The closed-die bay at Malur — eight hammers in parallel, fed by induction heaters.',
    src: '/assets/images/1-3-scaled.jpg',
    aspect: 'wide',
    category: 'catalogue',
    applications: ['industrial'],
  },
  {
    kind: 'image',
    slug: 'heat-treatment',
    name: 'Heat Treatment',
    code: 'PROCESS',
    blurb: 'Normalising, hardening and tempering — every part traced by heat-number on the certificate.',
    src: '/assets/images/DSC09268.jpg',
    aspect: 'tall',
    category: 'catalogue',
    applications: ['industrial'],
  },
];

/**
 * Returns the category for an item, defaulting to `catalogue` for items
 * authored before the field existed.
 */
export function productCategory(p: ProductItem): ProductCategory {
  return p.category ?? 'catalogue';
}

/**
 * Returns the applications for an item, defaulting to `['industrial']`
 * for items authored before the field existed.
 */
export function productApplications(
  p: ProductItem,
): ReadonlyArray<ProductApplication> {
  return p.applications ?? ['industrial'];
}
