import type { Metadata } from 'next';
import ProductsHero from '@/components/sections/products/ProductsHero';
import ProductsGallery from '@/components/sections/products/ProductsGallery';

export const metadata: Metadata = {
  title: 'Products — Forged catalogue',
  description:
    'A working catalogue of named forged parts — trunnions, levers, sprockets, valve bodies and more. Tap any part for a full 3D viewer.',
};

export default function ProductsPage() {
  return (
    <>
      <ProductsHero />
      <ProductsGallery />
    </>
  );
}
