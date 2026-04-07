'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Filter, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';

const SubcategoryPageClient: React.FC = () => {
  const params = useParams();
  const categorySlug = params.slug as string | undefined;
  const subcategorySlug = params.subcategory as string | undefined;
  const { addToCart } = useCart();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (categorySlug && subcategorySlug) {
      loadCategoryData(categorySlug, subcategorySlug);
    }
  }, [categorySlug, subcategorySlug]);

  const loadCategoryData = async (parentSlug: string, childSlug: string) => {
    try {
      setLoading(true);
      const categoriesResponse = await api.getCategories();
      const parent = categoriesResponse.data?.find((cat) => cat.slug === parentSlug) || null;
      const child = parent?.children?.find((cat) => cat.slug === childSlug) || null;

      setCategory(parent);
      setSubcategory(child);

      const productsResponse = await api.getProducts({
        category: parentSlug,
        subcategory: childSlug,
        limit: 50,
      });

      if (productsResponse.data) {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load subcategory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!requireAuthForCart(product.id, 1)) return;
    await addToCart(product);
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!requireAuthForWishlist(product.id)) return;
    toast.success('Added to wishlist');
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!category || !subcategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subcategory not found</h2>
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
            {category.name} / {subcategory.name}
          </h1>
          {subcategory.description && (
            <p className="mt-2 text-stone-600 max-w-2xl text-sm sm:text-base">{subcategory.description}</p>
          )}
          <p className="mt-3 text-sm leading-7 text-stone-600 max-w-3xl">
            Browse {subcategory.name.toLowerCase()} inside our {category.name.toLowerCase()} collection
            to compare handcrafted options, review product descriptions, and filter down to the right
            size, style, and budget.
          </p>
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

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
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
                  <span className="text-sm text-gray-600">{products.length} products found</span>
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

            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-400">{subcategory.name.charAt(0)}</span>
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48'} bg-gray-200 relative overflow-hidden`}>
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
                        <h3 className={`font-semibold text-gray-900 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                          {product.name}
                        </h3>
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className="h-5 w-5" />
                        </button>
                      </div>
                      <p className={`text-gray-600 mb-2 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                        {product.description}
                      </p>
                      <div className={`flex justify-between items-center ${viewMode === 'list' ? 'mt-4' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
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

export default SubcategoryPageClient;
