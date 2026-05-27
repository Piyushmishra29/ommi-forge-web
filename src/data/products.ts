/**
 * Masonry gallery for `/products`.
 *
 * Mixes two kinds of items:
 *  - `kind: 'stl'`   — uses one of the 11 named STLs under
 *                       /public/assets/stl/named/. Renders via
 *                       <StlPreview> on the grid, <StlViewer> in the
 *                       modal overlay.
 *  - `kind: 'image'` — uses one of the source photos under
 *                       /public/assets/images/. Same overlay flow,
 *                       just <img> instead of canvas.
 *
 * The 11 named STLs all show up here so visitors can see the full
 * forged catalogue at a glance.
 */

export type ProductItem =
  | {
      kind: 'stl';
      slug: string;
      name: string;
      code: string;
      blurb: string;
      stl: string;
      aspect: 'tall' | 'wide' | 'square';
    }
  | {
      kind: 'image';
      slug: string;
      name: string;
      code: string;
      blurb: string;
      src: string;
      aspect: 'tall' | 'wide' | 'square';
    };

export const PRODUCTS: ReadonlyArray<ProductItem> = [
  {
    kind: 'stl',
    slug: 'tvs-1200',
    name: 'TVS 1200 Casing',
    code: 'TVS-1200',
    blurb: 'Closed-die transmission casing forging for two-wheeler applications.',
    stl: '/assets/stl/named/tvs-1200.stl',
    aspect: 'square',
  },
  {
    kind: 'stl',
    slug: 'trunnion-85000103',
    name: 'Trunnion',
    code: '85000103',
    blurb: 'Heavy-duty trunnion pin forged for off-highway pivot assemblies.',
    stl: '/assets/stl/named/trunnion-85000103.stl',
    aspect: 'tall',
  },
  {
    kind: 'stl',
    slug: 'sprocket-451-zz-50163',
    name: 'Drive Sprocket',
    code: '451-ZZ-50163-V1',
    blurb: 'Forged sprocket blank for chain-drive industrial reduction units.',
    stl: '/assets/stl/named/sprocket_451-zz-50163-v1.stl',
    aspect: 'square',
  },
  {
    kind: 'stl',
    slug: 'shaft-fan-hub',
    name: 'Fan Hub Shaft',
    code: 'CUHU1001F001',
    blurb: 'Shaft-fan-hub assembly forged from 42CrMo4 for vibration-resistant rotation.',
    stl: '/assets/stl/named/shaft-fan-hub-cuhu1001f001.stl',
    aspect: 'wide',
  },
  {
    kind: 'stl',
    slug: 'right-lever-b14072',
    name: 'Right Lever',
    code: 'B14072-8',
    blurb: 'Closed-die right-hand actuation lever for transmission linkage.',
    stl: '/assets/stl/named/right-lever-b14072-8.stl',
    aspect: 'square',
  },
  {
    kind: 'stl',
    slug: 'lever-b121768',
    name: 'Selector Lever',
    code: 'B121768',
    blurb: 'Forged selector lever — used to engage gear positions in heavy gearboxes.',
    stl: '/assets/stl/named/lever-b121768.stl',
    aspect: 'tall',
  },
  {
    kind: 'stl',
    slug: 'cylinder-head-130hcb9319',
    name: 'Cylinder Head Blank',
    code: '130HCB9319',
    blurb: 'Near-net-shape cylinder-head forging — final machining done at the customer site.',
    stl: '/assets/stl/named/cylinder-head-130hcb9319.stl',
    aspect: 'wide',
  },
  {
    kind: 'stl',
    slug: 'body-8-way',
    name: '8-Way Valve Body',
    code: 'UM800900000B-BO-MODI',
    blurb: 'Forged hydraulic distributor body — eight outlet ports machined post-forging.',
    stl: '/assets/stl/named/body-8-way_um800900000b-bo-modi.stl',
    aspect: 'square',
  },
  {
    kind: 'stl',
    slug: 'bm-140-rh-link',
    name: 'BM 140 RH Link',
    code: 'BM-140-RH',
    blurb: 'Right-hand link in EN24 alloy — case-hardened, shot-peened, magnetic-particle tested.',
    stl: '/assets/stl/named/bm-140-rh-link.stl',
    aspect: 'tall',
  },
  {
    kind: 'stl',
    slug: '4308128-forging-model',
    name: 'Forging Model',
    code: '4308128-V1',
    blurb: 'Reference forging model for tooling validation and grain-flow review.',
    stl: '/assets/stl/named/4308128-FORGING-MODEL-v1-v1.stl',
    aspect: 'square',
  },
  {
    kind: 'stl',
    slug: 'part-1011',
    name: 'Part 1011',
    code: '1011',
    blurb: 'Closed-die forging for an OEM heavy-duty axle programme.',
    stl: '/assets/stl/named/1011.stl',
    aspect: 'wide',
  },
  {
    kind: 'image',
    slug: 'forge-floor',
    name: 'Power Hammer Bay',
    code: 'PLANT',
    blurb: 'The closed-die bay at Malur — eight hammers in parallel, fed by induction heaters.',
    src: '/assets/images/1-3-scaled.jpg',
    aspect: 'wide',
  },
  {
    kind: 'image',
    slug: 'heat-treatment',
    name: 'Heat Treatment',
    code: 'PROCESS',
    blurb: 'Normalising, hardening and tempering — every part traced by heat-number on the certificate.',
    src: '/assets/images/DSC09268.jpg',
    aspect: 'tall',
  },
];
