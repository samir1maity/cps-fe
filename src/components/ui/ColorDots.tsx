'use client';

import React from 'react';
import { ProductColor } from '@/lib/types';
import { useSignedUrls } from '@/lib/hooks/useSignedUrls';

const MAX_VISIBLE = 2;

function Dot({
  url,
  name,
  inStock,
  index,
}: {
  url: string;
  name: string;
  inStock: boolean;
  index: number;
}) {
  return (
    <span
      title={`${name}${inStock ? '' : ' · out of stock'}`}
      className="relative inline-block h-5 w-5 rounded-full overflow-hidden ring-2 ring-white shrink-0"
      style={{
        marginLeft: index === 0 ? 0 : '-8px',
        zIndex: index,
        opacity: inStock ? 1 : 0.45,
      }}
    >
      {url
        ? <img src={url} alt={name} className="h-full w-full object-cover" />
        : <span className="block h-full w-full bg-stone-200" />
      }
      {!inStock && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg,transparent 42%,#ef444466 42%,#ef444466 58%,transparent 58%)',
          }}
        />
      )}
    </span>
  );
}

export default function ColorDots({ colors }: { colors: ProductColor[] }) {
  if (!colors || colors.length <= 1) return null;

  const visible = colors.slice(0, MAX_VISIBLE);
  const overflow = colors.length - MAX_VISIBLE;
  const urls = useSignedUrls(visible.map((c) => c.imageKey || null));

  return (
    <div className="flex items-center">
      {visible.map((c, i) => (
        <Dot key={c._id} url={urls[i]} name={c.name} inStock={c.stock > 0} index={i} />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center h-5 px-1 rounded-full bg-stone-100 text-[9px] font-semibold text-stone-500 ring-2 ring-white shrink-0"
          style={{ marginLeft: '-8px', zIndex: MAX_VISIBLE }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
