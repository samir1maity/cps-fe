'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import Carousel, { CarouselSlide } from '@/components/ui/Carousel';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';

const HomePageClient: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const productsResponse = await api.getProducts({ limit: 8 });

      if (productsResponse.data) {
        setFeaturedProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!requireAuthForCart(product.id, 1)) {
      return;
    }

    await addToCart(product);
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!requireAuthForWishlist(product.id)) {
      return;
    }

    toast.success('Added to wishlist');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const carouselSlides: CarouselSlide[] = [
    {
      id: '1',
      title: 'Handcrafted Pottery & Artisan Goods',
      subtitle: 'Discover unique pieces made with care and passion',
      description:
        'Small-batch pottery crafted by skilled artisans, each piece tells a story of tradition and craftsmanship.',
      ctaText: 'Shop Now',
      ctaLink: '/',
      bgColor: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100',
    },
    {
      id: '2',
      title: 'New Collection Available',
      subtitle: 'Fresh designs and timeless classics',
      description:
        'Explore our latest collection featuring contemporary designs alongside traditional favorites.',
      ctaText: 'Explore Collection',
      ctaLink: '/',
      bgColor: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100',
    },
    {
      id: '3',
      title: 'Artisan Quality, Every Time',
      subtitle: 'Small-batch pieces with character',
      description:
        'Every product is carefully selected to bring beauty and functionality into your home.',
      ctaText: 'View Products',
      ctaLink: '/search',
      bgColor: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50',
    },
  ];

  return (
    <div className="min-h-screen">
      <Carousel slides={carouselSlides} autoSlideInterval={5000} transitionDuration={500} />

      {/* <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl">
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--brand-600)]">Creative Pottery Studio</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight">
              Handmade pottery, ceramic tableware, and artisan home decor for everyday living.
            </h1>
            <p className="mt-5 text-lg text-stone-700 leading-8">
              Creative Pottery Studio is an online pottery store focused on handcrafted ceramics,
              decorative accents, and gift-worthy artisan pieces. From serving bowls and mugs to
              statement decor, each collection is designed to bring warmth, texture, and character
              into the home.
            </p>
            <p className="mt-4 text-base text-stone-600 leading-7">
              Browse featured pottery, discover new arrivals, and shop by category to find pieces
              that suit daily use, special occasions, and thoughtful gifting. Product pages include
              clear descriptions, pricing, and specifications to help shoppers compare items quickly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-700">
              <Link href="/search" className="rounded-full bg-stone-900 px-5 py-2.5 text-white hover:bg-stone-800 transition-colors">
                Shop all products
              </Link>
              <Link href="/categories/dinnerware" className="rounded-full border border-stone-300 px-5 py-2.5 hover:border-stone-400 transition-colors">
                Explore dinnerware
              </Link>
              <Link href="/categories/artworks" className="rounded-full border border-stone-300 px-5 py-2.5 hover:border-stone-400 transition-colors">
                View ceramic decor
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link
              href="/search"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    <img
                      src={product.images[0] || '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <button
                      onClick={() => handleAddToWishlist(product)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
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
                      className="bg-[var(--brand-600)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--brand-700)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--brand-600)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {user ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Welcome back, {user.name}!</h2>
              <p className="text-xl opacity-90 mb-8">Continue exploring our handcrafted collection</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/search"
                  className="bg-white text-[var(--brand-600)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Browse Products
                </Link>
                <Link
                  href="/profile"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[var(--brand-600)] transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Ready to start shopping?</h2>
              <p className="text-xl opacity-90 mb-8">Join thousands of satisfied customers</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-white text-[var(--brand-600)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/search"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[var(--brand-600)] transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePageClient;
