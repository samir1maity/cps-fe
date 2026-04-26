'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePendingActions } from '@/hooks/usePendingActions';
import { api } from '@/lib/api';
import { Product, ProductColor } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { hasColorVariants, getColorImageKey, getProductThumbnailKey } from '@/lib/utils/product';

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
  return (
    <button
      type="button"
      onClick={onClick}
      title={color.name}
      className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      {url ? (
        <img src={url} alt={color.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gray-100" />
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ProductPageClient: React.FC = () => {
  const params = useParams();
  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // For color-variant products: which color is active
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  // For standard-image products: which image index is active
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  usePendingActions();

  // Standard-image signed URLs (empty array when using color variants)
  const standardImageKeys = product && !hasColorVariants(product) ? product.images : [];
  const standardSignedUrls = useSignedUrls(standardImageKeys);

  // Active image key — either the selected color's image or the selected standard image
  const activeImageKey =
    product == null
      ? ''
      : hasColorVariants(product) && selectedColor
      ? getColorImageKey(product, selectedColor)
      : (standardImageKeys[selectedImageIndex] ?? getProductThumbnailKey(product));

  const activeImageUrl = useSignedUrl(
    // Only use this hook for color-variant products; standard products use the batch hook above.
    product && hasColorVariants(product) ? activeImageKey : null,
  );

  // The URL shown in the main viewer
  const mainImageUrl =
    product && hasColorVariants(product)
      ? activeImageUrl
      : standardSignedUrls[selectedImageIndex] ?? '';

  useEffect(() => {
    if (params.id) loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await api.getProduct(params.id as string);
      if (res.success && res.data) {
        const p = res.data;
        setProduct(p);
        // Pre-select first color if the product uses color variants
        if (hasColorVariants(p)) {
          setSelectedColor(p.colors[0]);
        }
      }
    } catch {
      // handled below via null product check
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!requireAuthForCart(product.id, quantity)) return;
    await addToCart(product, quantity, selectedColor?._id ?? null);
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    if (!requireAuthForWishlist(product.id)) return;
    toast.success('Added to wishlist');
  };

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
            {/* Main viewer */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white shadow-md">
              <img
                src={mainImageUrl || '/images/placeholder.jpg'}
                alt={colorMode && selectedColor ? `${product.name} — ${selectedColor.name}` : product.name}
                className="w-full h-full object-cover block transition-opacity duration-200"
              />
            </div>

            {/* Thumbnails strip */}
            {colorMode ? (
              // Color-variant thumbnails — each swatch is also the thumbnail
              product.colors.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      color={color}
                      isSelected={selectedColor?.name === color.name}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              )
            ) : (
              // Standard image strip
              product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? 'border-blue-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={standardSignedUrls[index] || '/images/placeholder.jpg'}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-20 object-cover block"
                      />
                    </button>
                  ))}
                </div>
              )
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

            {/* ── Color picker ─────────────────────────────────────────── */}
            {colorMode && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Color:{' '}
                  <span className="font-semibold text-gray-900">{selectedColor?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      color={color}
                      isSelected={selectedColor?.name === color.name}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Select a color to preview its image
                </p>
              </div>
            )}

            <div className="space-y-4">
              {!product.inStock && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  Out of Stock
                </div>
              )}

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div
                  className={`flex items-center border border-gray-300 rounded-lg ${
                    !product.inStock ? 'opacity-40 pointer-events-none' : ''
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
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-30 text-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.inStock && (
                  <span className="text-sm text-gray-600">{product.stockQuantity} in stock</span>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 py-3 px-6 rounded-lg transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-red-500"
                >
                  <Heart className="h-5 w-5" />
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
