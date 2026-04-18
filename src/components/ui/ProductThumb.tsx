'use client';

import React from 'react';
import { useSignedUrl } from '@/lib/hooks/useSignedUrls';

interface ProductThumbProps {
  imageKey?: string;
  alt: string;
  className?: string;
}

const ProductThumb: React.FC<ProductThumbProps> = ({ imageKey, alt, className }) => {
  const url = useSignedUrl(imageKey);
  return (
    <div className={`aspect-square overflow-hidden bg-gray-100 ${className ?? ''}`}>
      <img
        src={url || '/images/placeholder.jpg'}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default ProductThumb;
