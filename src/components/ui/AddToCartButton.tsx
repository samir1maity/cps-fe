'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, SwatchBook } from 'lucide-react';
import { Product } from '@/lib/types';
import { hasColorVariants, isProductAvailable } from '@/lib/utils/product';

interface Props {
  product: Product;
  loading?: boolean;
  onAddToCart: () => void;
  className?: string;
}

export default function AddToCartButton({ product, loading = false, onAddToCart, className = '' }: Props) {
  const available = isProductAvailable(product);
  const multiColor = hasColorVariants(product) && product.colors.length > 1;

  const base =
    'w-full flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-150';

  if (!available) {
    return (
      <button disabled className={`${base} bg-stone-100 text-stone-400 cursor-not-allowed ${className}`}>
        Out of Stock
      </button>
    );
  }

  if (multiColor) {
    return (
      <Link
        href={`/products/${product.id}`}
        className={`${base} border border-[var(--brand-600)] text-[var(--brand-600)] hover:bg-[var(--brand-600)] hover:text-white ${className}`}
      >
        <SwatchBook className="h-3 w-3" />
        Choose Options
      </Link>
    );
  }

  return (
    <button
      onClick={onAddToCart}
      disabled={loading}
      className={`${base} bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading
        ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
        : <ShoppingCart className="h-3 w-3" />
      }
      Add to Cart
    </button>
  );
}
