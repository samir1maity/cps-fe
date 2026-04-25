'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, Heart, Search, ShoppingCart, X } from 'lucide-react';
import ProductThumb from '@/components/ui/ProductThumb';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';

const SORT_MAP: Record<string, string> = {
  relevance: '-createdAt',
  'price-low': 'price',
  'price-high': '-price',
  rating: '-rating',
  newest: '-createdAt',
};

const PAGE_SIZE = 12;

const SearchPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryParam    = searchParams.get('q') || '';
  const featuredParam = searchParams.get('featured') === 'true';
  const categoryParam = searchParams.get('category') || '';
  const pageParam     = parseInt(searchParams.get('page') || '1', 10);

  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();

  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(false);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const [showFilters, setShowFilters]   = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy]             = useState('relevance');
  const [priceRange, setPriceRange]     = useState({ min: '', max: '' });
  const [featured, setFeatured]         = useState(featuredParam);

  useEffect(() => {
    api.getCategories().then((r) => r.data && setCategories(r.data));
  }, []);

  // sync URL → local state when params change (e.g. back button)
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setFeatured(featuredParam);
  }, [categoryParam, featuredParam]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getProducts({
        search:    queryParam || undefined,
        category:  categoryParam || undefined,
        featured:  featuredParam ? 'true' : undefined,
        minPrice:  priceRange.min ? parseFloat(priceRange.min) : undefined,
        maxPrice:  priceRange.max ? parseFloat(priceRange.max) : undefined,
        sort:      SORT_MAP[sortBy] ?? '-createdAt',
        page:      pageParam,
        limit:     PAGE_SIZE,
      });
      setProducts(response.data ?? []);
      setTotalPages(response.pagination?.totalPages ?? 1);
      setTotalCount(response.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [queryParam, categoryParam, featuredParam, priceRange, sortBy, pageParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug); else params.delete('category');
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const handleFeaturedToggle = (val: boolean) => {
    setFeatured(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('featured', 'true'); else params.delete('featured');
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
  };

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceRange.min) params.set('minPrice', priceRange.min); else params.delete('minPrice');
    if (priceRange.max) params.set('maxPrice', priceRange.max); else params.delete('maxPrice');
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
    setFeatured(false);
    router.push('/search');
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/search?${params.toString()}`);
  };

  const handleAddToCart = async (product: Product) => {
    if (!requireAuthForCart(product.id, 1)) return;
    await addToCart(product);
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!requireAuthForWishlist(product.id)) return;
    toast.success('Added to wishlist');
  };

  const hasActiveFilters = !!queryParam || !!categoryParam || featuredParam || !!priceRange.min || !!priceRange.max;

  const pageTitle = featuredParam && !queryParam
    ? 'Featured Products'
    : queryParam
    ? `Results for "${queryParam}"`
    : 'All Products';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {totalCount} product{totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-5 sticky top-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>

              {/* Featured toggle */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Show</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => handleFeaturedToggle(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Featured only</span>
                </label>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={selectedCategory === ''}
                      onChange={() => handleCategoryChange('')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.slug}
                        checked={selectedCategory === cat.slug}
                        onChange={() => handleCategoryChange(cat.slug)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Price Range</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handlePriceApply}
                  className="w-full py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Sort */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <Search className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className="relative">
                          <ProductThumb
                            imageKey={product.images[0]}
                            alt={product.name}
                            className="w-full group-hover:[&_img]:scale-105 [&_img]:transition-transform [&_img]:duration-300"
                          />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/40" />
                          )}
                          {!product.inStock && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
                            {product.name}
                          </h3>
                          <button
                            onClick={() => handleAddToWishlist(product)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-bold text-gray-900">
                              {formatCurrency(product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs text-gray-400 line-through ml-1.5">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inStock}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            {product.inStock ? 'Add' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => goToPage(pageParam - 1)}
                      disabled={pageParam <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageParam) <= 1)
                        .reduce<(number | '...')[]>((acc, p, i, arr) => {
                          if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) {
                            acc.push('...');
                          }
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
                              className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                                p === pageParam
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                    </div>
                    <button
                      onClick={() => goToPage(pageParam + 1)}
                      disabled={pageParam >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
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

const SearchPageClient: React.FC = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }
  >
    <SearchPageContent />
  </Suspense>
);

export default SearchPageClient;
