'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSignedUrl, useSignedUrls } from '@/lib/hooks/useSignedUrls';
import {
  Heart,
  ShoppingCart,
  Share2,
  Minus,
  Plus,
  ShieldCheck,
  Leaf,
  HandHeart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePendingActions } from '@/hooks/usePendingActions';
import { api } from '@/lib/api';
import { Product, ProductColor, ColorVariantGallery } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { hasColorVariants, getProductThumbnailKey, getFirstAvailableColor } from '@/lib/utils/product';

// ── Color swatch — resolves its own signed URL ────────────────────────────────

function ColorSwatch({
  color,
  isSelected,
  onClick,
}: {
  color: ProductColor;
  isSelected: boolean;
  onClick: () => void;
}) {
  const url = useSignedUrl(color.imageKey);
  const outOfStock = color.stock === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={outOfStock}
      title={outOfStock ? `${color.name} — Out of stock` : color.name}
      className={`group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 focus:outline-none ${
        outOfStock
          ? 'opacity-40 cursor-not-allowed'
          : isSelected
          ? 'ring-2 ring-offset-2 ring-gray-900 scale-105 shadow-lg'
          : 'hover:scale-105 hover:shadow-md'
      }`}
    >
      {url ? (
        <img src={url} alt={color.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gray-100" />
      )}

      {/* Gradient + name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <p className="absolute bottom-1.5 inset-x-0 text-[11px] font-medium text-white text-center px-1 truncate leading-tight drop-shadow">
        {color.name}
      </p>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow">
          <svg className="h-3 w-3 text-gray-900" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Diagonal strike for out-of-stock */}
      {outOfStock && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
          <line x1="0" y1="48" x2="48" y2="0" stroke="#ef4444" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
}

// ── Thumbnail strip item ──────────────────────────────────────────────────────

function ThumbItem({
  imageKey,
  index,
  isSelected,
  onClick,
  productName,
}: {
  imageKey: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  productName: string;
}) {
  const url = useSignedUrl(imageKey);
  return (
    <button
      onClick={onClick}
      className={`rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
        isSelected ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
      }`}
    >
      <img
        src={url || '/images/placeholder.jpg'}
        alt={`${productName} ${index + 1}`}
        className="w-full h-24 sm:h-28 object-cover block"
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ProductPageClient: React.FC = () => {
  const params = useParams();
  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // For color-variant products: which color is active
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  // Gallery image index within the active color (or standard images)
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Extra gallery images from the separate collection — only loaded once on mount
  const [variantGallery, setVariantGallery] = useState<ColorVariantGallery>({});

  usePendingActions();

  // Build the ordered list of image keys for the current view:
  //   color mode  → [color.imageKey, ...variantGallery[colorId]]
  //   standard    → product.images
  const activeImageKeys: string[] = React.useMemo(() => {
    if (!product) return [];
    if (hasColorVariants(product) && selectedColor) {
      const extras = variantGallery[selectedColor._id] ?? [];
      return [selectedColor.imageKey, ...extras];
    }
    return product.images ?? [];
  }, [product, selectedColor, variantGallery]);

  // Batch-sign all keys in the current active set
  const activeSignedUrls = useSignedUrls(activeImageKeys);

  // Standard product images (used only for standard products)
  const standardImageKeys = product && !hasColorVariants(product) ? product.images : [];
  useSignedUrls(standardImageKeys); // pre-warm cache

  const mainImageUrl = activeSignedUrls[activeImageIndex] ?? '';

  const loadProduct = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const res = await api.getProduct(params.id as string);
      if (res.success && res.data) {
        const p = res.data;
        setProduct(p);
        if (hasColorVariants(p)) {
          // Pre-select the first in-stock color so the detail page
          // doesn't default to a sold-out variant.
          setSelectedColor(getFirstAvailableColor(p) ?? p.colors[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const loadVariantGallery = useCallback(async () => {
    if (!params.id) return;
    const res = await api.getVariantImages(params.id as string);
    if (res.success && res.data) setVariantGallery(res.data);
  }, [params.id]);

  useEffect(() => {
    loadProduct();
    loadVariantGallery();
  }, [loadProduct, loadVariantGallery]);

  // Reset gallery index when color changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor?._id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!requireAuthForCart(product.id, quantity)) return;
    await addToCart(product, quantity, selectedColor?._id ?? null);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!requireAuthForWishlist(product.id)) return;
    const added = await toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handlePrevImage = () =>
    setActiveImageIndex((i) => (i > 0 ? i - 1 : activeImageKeys.length - 1));
  const handleNextImage = () =>
    setActiveImageIndex((i) => (i < activeImageKeys.length - 1 ? i + 1 : 0));

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const colorMode = hasColorVariants(product);
  const hasMultipleImages = activeImageKeys.length > 1;

  // Effective stock: for color products use the selected variant's stock,
  // for plain products use product.stockQuantity
  const effectiveStock = colorMode && selectedColor
    ? selectedColor.stock
    : product.stockQuantity;
  const effectiveInStock = effectiveStock > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-blue-600">
            {product.category.name}
          </Link>
          {product.subcategory && (
            <>
              <span>/</span>
              <Link
                href={`/categories/${product.category.slug}/${product.subcategory.slug}`}
                className="hover:text-blue-600"
              >
                {product.subcategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* ── Image column ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-8 space-y-3">
            {/* Main viewer with prev/next arrows when multiple images */}
            <div className="relative w-full rounded-xl overflow-hidden bg-white shadow-md group">
              <img
                key={activeImageKeys[activeImageIndex]}
                src={mainImageUrl || '/images/placeholder.jpg'}
                alt={
                  colorMode && selectedColor
                    ? `${product.name} — ${selectedColor.name}`
                    : product.name
                }
                className="w-full h-auto object-contain block transition-opacity duration-200"
              />

              {/* Prev / Next arrows — only shown when there are multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {activeImageKeys.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        aria-label={`Image ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeImageIndex
                            ? 'w-4 bg-blue-600'
                            : 'w-1.5 bg-white/70 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip — unified for both color-variant and standard products */}
            {hasMultipleImages && (
              <div className="grid grid-cols-4 gap-2">
                {activeImageKeys.map((key, idx) => (
                  <ThumbItem
                    key={key}
                    imageKey={key}
                    index={idx}
                    isSelected={activeImageIndex === idx}
                    onClick={() => setActiveImageIndex(idx)}
                    productName={product.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Info column ──────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{product.description}</p>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                    Save {formatCurrency(product.originalPrice - product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* ── Similar Items ─────────────────────────────────────────── */}
            {colorMode && (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900 tracking-tight">Similar Items</p>
                    {selectedColor && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedColor.name}</p>
                    )}
                  </div>
                  {selectedColor && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${
                      selectedColor.stock > 0
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedColor.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedColor.stock > 0 ? `${selectedColor.stock} left` : 'Sold out'}
                    </span>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {product.colors.map((color) => (
                    <ColorSwatch
                      key={color._id}
                      color={color}
                      isSelected={selectedColor?._id === color._id}
                      onClick={() => {
                        setSelectedColor(color);
                        setQuantity(1);
                      }}
                    />
                  ))}
                </div>

                {/* Footer */}
                {selectedColor && activeImageKeys.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-1.5">
                    <span className="h-1 w-4 rounded-full bg-gray-400 inline-block" />
                    <p className="text-xs text-gray-400">
                      {activeImageKeys.length} photos for <span className="font-medium text-gray-600">{selectedColor.name}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {!effectiveInStock && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  {colorMode ? 'This color is out of stock' : 'Out of Stock'}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div
                  className={`flex items-center border border-gray-300 rounded-lg ${
                    !effectiveInStock ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 text-gray-800"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                    disabled={quantity >= effectiveStock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-30 text-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {effectiveInStock && (
                  <span className="text-sm text-gray-600">{effectiveStock} in stock</span>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!effectiveInStock}
                  className="flex-1 py-3 px-6 rounded-lg transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {effectiveInStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`p-3 border rounded-lg transition-colors ${product && isInWishlist(product.id) ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-500'}`}
                >
                  <Heart className="h-5 w-5" fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-blue-500">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">100% Authentic</p>
                  <p className="text-xs text-gray-500">Handcrafted & certified genuine pottery</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-green-50 flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Eco Friendly</p>
                  <p className="text-xs text-gray-500">Sustainably sourced natural materials</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center">
                  <HandHeart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Artisan Made</p>
                  <p className="text-xs text-gray-500">Supporting local craftspeople & communities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {Object.keys(product.specifications).length > 0 && (
          <div className="mt-16">
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button className="py-4 px-1 border-b-2 border-blue-600 text-blue-600 font-medium">
                    Specifications
                  </button>
                </nav>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">{key}</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPageClient;
