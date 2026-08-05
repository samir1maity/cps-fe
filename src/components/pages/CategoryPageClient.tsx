'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductThumb from '@/components/ui/ProductThumb';
import AddToCartButton from '@/components/ui/AddToCartButton';
import ColorDots from '@/components/ui/ColorDots';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { getDefaultColorId, isProductAvailable } from '@/lib/utils/product';

const SORT_MAP: Record<string, string> = {
  relevance: '-createdAt',
  'price-low': 'price',
  'price-high': '-price',
  rating: '-rating',
  newest: '-createdAt',
};

const PAGE_SIZE = 12;

const CategoryPageClient: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const fetchProducts = useCallback(async (sub: string, sort: string, min: string, max: string, p: number) => {
    setListLoading(true);
    try {
      const response = await api.getProducts({
        category: slug,
        subcategory: sub !== 'all' ? sub : undefined,
        minPrice: min ? Number(min) : undefined,
        maxPrice: max ? Number(max) : undefined,
        sort: SORT_MAP[sort] ?? '-createdAt',
        limit: PAGE_SIZE,
        page: p,
      });
      setProducts(response.data ?? []);
      setTotal(response.pagination?.total ?? response.data?.length ?? 0);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setListLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setSelectedSubcategory('all');
    setSortBy('relevance');
    setPriceRange({ min: '', max: '' });
    setPage(1);
    setPageLoading(true);
    api.getCategory(slug)
      .then((res) => {
        if (res.success && res.data) setCategory(res.data);
      })
      .finally(() => setPageLoading(false));
  }, [slug]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSubcategory, sortBy, priceRange.min, priceRange.max]);

  useEffect(() => {
    if (!pageLoading && slug) {
      fetchProducts(selectedSubcategory, sortBy, priceRange.min, priceRange.max, page);
    }
  }, [selectedSubcategory, sortBy, priceRange.min, priceRange.max, page, pageLoading, fetchProducts, slug]);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleAddToCart = async (product: Product) => {
    if (!requireAuthForCart(product.id, 1)) return;
    await addToCart(product, 1, getDefaultColorId(product));
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!requireAuthForWishlist(product.id)) return;
    const added = await toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
    setSelectedSubcategory('all');
    setPage(1);
  };

  if (!pageLoading && !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 space-y-1">
          <p className="text-[10px] tracking-[0.22em] uppercase text-amber-700/70">Collection</p>
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight text-stone-900">
            {category?.name || 'Loading...'}
          </h1>
          <p className="text-xs text-stone-600">{total} {total === 1 ? 'product' : 'products'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-5 lg:sticky lg:top-8 border border-stone-200/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
                  Clear all
                </button>
              </div>

              {category?.children && category.children.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Subcategories</h4>
                  <div className="space-y-2 h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedSubcategory === 'all'
                          ? 'bg-[var(--brand-100)] text-[var(--brand-700)]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All
                    </button>
                    {category.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(child.slug)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedSubcategory === child.slug
                            ? 'bg-[var(--brand-100)] text-[var(--brand-700)]'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-stone-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                  <span className="text-sm text-gray-600">{total} products found</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {pageLoading || listLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-400">{category?.name?.charAt(0) || '?'}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or check back later</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-200 overflow-hidden group ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className="relative">
                          <ProductThumb
                            product={product}
                            alt={product.name}
                            className={`${viewMode === 'list' ? 'w-44' : 'w-full'} group-hover:[&_img]:scale-105 [&_img]:transition-transform [&_img]:duration-300`}
                          />
                          {!isProductAvailable(product) && (
                            <span className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className={`p-3.5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-semibold text-stone-800 leading-snug ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                            {product.name}
                          </h3>
                          <button
                            onClick={() => handleToggleWishlist(product)}
                            className={`ml-1 shrink-0 transition-colors ${isInWishlist(product.id) ? 'text-red-500' : 'text-stone-300 hover:text-red-400'}`}
                          >
                            <Heart className="h-4 w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <p className={`text-xs text-stone-400 mb-3 leading-relaxed ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-bold text-stone-900 shrink-0">{formatCurrency(product.price)}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-stone-400 line-through shrink-0">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <ColorDots colors={product.colors} />
                        </div>
                        <AddToCartButton
                          product={product}
                          onAddToCart={() => handleAddToCart(product)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages >= 1 && (
                  <div className="flex flex-col items-center gap-2 mt-10">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--brand-600)] text-[var(--brand-600)] rounded-lg disabled:opacity-30 hover:bg-[var(--brand-600)] hover:text-white transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === '...' ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => goToPage(p as number)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                  page === p
                                    ? 'bg-[var(--brand-600)] text-white'
                                    : 'border border-stone-200 text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                      </div>

                      <button
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--brand-600)] text-[var(--brand-600)] rounded-lg disabled:opacity-30 hover:bg-[var(--brand-600)] hover:text-white transition-colors"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-400">Page {page} of {totalPages} · {total} products</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPageClient;
