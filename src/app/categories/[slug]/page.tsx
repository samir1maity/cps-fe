// src/app/categories/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Heart,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatters';

const SORT_MAP: Record<string, string> = {
  relevance: '-createdAt',
  'price-low': 'price',
  'price-high': '-price',
  rating: '-rating',
  newest: '-createdAt',
};

const CategoryPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const fetchProducts = useCallback(async (sub: string, sort: string, min: string, max: string) => {
    setListLoading(true);
    try {
      const response = await api.getProducts({
        category: slug,
        subcategory: sub !== 'all' ? sub : undefined,
        minPrice: min ? Number(min) : undefined,
        maxPrice: max ? Number(max) : undefined,
        sort: SORT_MAP[sort] ?? '-createdAt',
        limit: 50,
      });
      setProducts(response.data ?? []);
      setTotal(response.pagination?.total ?? response.data?.length ?? 0);
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
    setPageLoading(true);
    api.getCategory(slug).then((res) => {
      if (res.success && res.data) setCategory(res.data);
    }).finally(() => setPageLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!pageLoading && slug) {
      fetchProducts(selectedSubcategory, sortBy, priceRange.min, priceRange.max);
    }
  }, [selectedSubcategory, sortBy, priceRange.min, priceRange.max, pageLoading, fetchProducts, slug]);

  const handleAddToCart = async (product: Product) => {
    if (!requireAuthForCart(product.id, 1)) return;
    await addToCart(product);
  };

  const handleAddToWishlist = (product: Product) => {
    if (!requireAuthForWishlist(product.id)) return;
    toast.success('Added to wishlist');
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
    setSelectedSubcategory('all');
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
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase text-amber-700/70">Collection</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-stone-900">
            {category?.name || 'Loading...'}
          </h1>
          {category?.description && (
            <p className="mt-2 text-stone-600 max-w-2xl text-sm sm:text-base">
              {category.description}
            </p>
          )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                  <span className="text-2xl font-bold text-gray-400">
                    {category?.name?.charAt(0) || '?'}
                  </span>
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
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className={`${
                        viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48'
                      } bg-gray-200 relative overflow-hidden`}>
                        <Image
                          src={product.images[0] || '/images/placeholder.jpg'}
                          alt={product.name}
                          width={viewMode === 'grid' ? 300 : 200}
                          height={viewMode === 'grid' ? 300 : 200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold text-gray-900 ${
                          viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'
                        }`}>
                          {product.name}
                        </h3>
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className="h-5 w-5" />
                        </button>
                      </div>
                      <p className={`text-gray-600 mb-2 ${
                        viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'
                      }`}>
                        {product.description}
                      </p>
                      <div className={`flex justify-between items-center ${viewMode === 'list' ? 'mt-4' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
