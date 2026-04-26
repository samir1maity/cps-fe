'use client';

import React from 'react';
import { useSignedUrl } from '@/lib/hooks/useSignedUrls';
import { Product } from '@/lib/types';
import { getProductThumbnailKey } from '@/lib/utils/product';

interface ProductThumbProps {
  /**
   * Pass a full Product (or partial with images + colors) to let the
   * component derive the correct thumbnail automatically — color-variant
   * products use colors[0].imageKey, standard products use images[0].
   */
  product?: Pick<Product, 'images' | 'colors'>;
  /**
   * Escape hatch: provide a raw storage key directly (e.g. when you only
   * have a key, not the full product). Ignored when `product` is provided.
   */
  imageKey?: string;
  alt: string;
  className?: string;
}

const ProductThumb: React.FC<ProductThumbProps> = ({ product, imageKey, alt, className }) => {
  const key = product ? getProductThumbnailKey(product) : (imageKey ?? '');
  const url = useSignedUrl(key || null); // null when no key → skips signing, shows placeholder immediately

  // No key at all — render placeholder immediately, no spinner
  if (!key) {
    return (
      <div className={`aspect-square overflow-hidden bg-gray-100 relative ${className ?? ''}`}>
        <img src="/images/placeholder.jpg" alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`aspect-square overflow-hidden bg-gray-100 relative ${className ?? ''}`}>
      {!url && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border-2 border-gray-300" />
            <div className="absolute inset-0 rounded-full border-2 border-t-gray-500 animate-spin" />
          </div>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <img
        src={url || '/images/placeholder.jpg'}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${url ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default ProductThumb;
