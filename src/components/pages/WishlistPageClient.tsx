'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowLeft, LogIn } from 'lucide-react';
import ProductThumb from '@/components/ui/ProductThumb';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { getDefaultColorId } from '@/lib/utils/product';
import toast from 'react-hot-toast';

const WishlistPageClient: React.FC = () => {
  const { user } = useAuth();
  const { productIds, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchWishlistProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.getWishlist(user.id);
        if (res.success && res.data) {
          const normalized = (res.data as any[]).map((p: any) => ({
            ...p,
            id: p.id ?? p._id,
            images: Array.isArray(p.images) ? p.images : [],
            inStock: p.inStock === true && (p.stockQuantity ?? 0) > 0,
            category: p.category ? { ...p.category, id: p.category.id ?? p.category._id } : p.category,
            subcategory: p.subcategory ? { ...p.subcategory, id: p.subcategory.id ?? p.subcategory._id } : p.subcategory,
          }));
          setProducts(normalized);
        }
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchWishlistProducts();
  }, [user, productIds]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCartId(product.id);
    try {
      await addToCart(product, 1, getDefaultColorId(product));
    } finally {
      setAddingToCartId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] px-4 py-8 pb-28 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl bg-white/80 px-6 py-10 text-center shadow-sm ring-1 ring-stone-200/70 backdrop-blur">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              <Heart className="h-10 w-10 text-stone-400" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">Login to view your wishlist</h2>
            <p className="mt-2 text-sm text-stone-600">Save products you love and come back to them anytime.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login?redirectTo=/wishlist"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !loadingProducts && !wishlistLoading && products.length === 0;

  return (
    <div className="min-h-screen bg-[#F7F2EA] py-4 pb-24 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center sm:mb-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">My Wishlist</h1>
          {products.length > 0 && (
            <span className="ml-2 text-sm text-stone-500">({products.length} item{products.length !== 1 ? 's' : ''})</span>
          )}
        </div>

        {(loadingProducts || wishlistLoading) && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-600)]" />
          </div>
        )}

        {isEmpty && (
          <div className="mx-auto max-w-md">
            <div className="w-full rounded-2xl bg-white/80 px-6 py-10 text-center shadow-sm ring-1 ring-stone-200/70 backdrop-blur">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                <Heart className="h-10 w-10 text-stone-400" />
              </div>
              <h2 className="text-2xl font-semibold text-stone-900">Your wishlist is empty</h2>
              <p className="mt-2 text-sm text-stone-600">Browse products and save your favourites here.</p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loadingProducts && !wishlistLoading && products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 transition-shadow hover:shadow-md"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <ProductThumb
                    product={product}
                    alt={product.name}
                    className="rounded-t-2xl"
                  />
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-medium text-stone-900 line-clamp-2 hover:text-[var(--brand-600)] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {product.category && (
                    <p className="mt-1 text-xs text-stone-500">{product.category.name}</p>
                  )}
                  <div className="mt-2">
                    <span className="text-base font-semibold text-stone-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1">
                      <AddToCartButton
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                        loading={addingToCartId === product.id}
                      />
                    </div>
                    <button
                      onClick={() => handleRemove(product.id)}
                      disabled={removingId === product.id}
                      className="rounded-xl border border-stone-200 p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPageClient;
