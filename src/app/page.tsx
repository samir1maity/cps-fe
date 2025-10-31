// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import toast from 'react-hot-toast';
import Carousel, { CarouselSlide } from '@/components/ui/Carousel';
import TopOffers, { Offer } from '@/components/ui/TopOffers';

const HomePage: React.FC = () => {
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
    // Check auth and redirect if needed
    if (!requireAuthForCart(product.id, 1)) {
      return;
    }
    await addToCart(product);
  };

  const handleAddToWishlist = async (product: Product) => {
    // Check auth and redirect if needed
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

  // Carousel slides data - Text-only with pastel theme colors
  const carouselSlides: CarouselSlide[] = [
    {
      id: '1',
      title: 'Handcrafted Pottery & Artisan Goods',
      subtitle: 'Discover unique pieces made with care and passion',
      description: 'Small-batch pottery crafted by skilled artisans, each piece tells a story of tradition and craftsmanship.',
      ctaText: 'Shop Now',
      ctaLink: '/',
      bgColor: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100'
    },
    {
      id: '2',
      title: 'New Collection Available',
      subtitle: 'Fresh designs and timeless classics',
      description: 'Explore our latest collection featuring contemporary designs alongside traditional favorites.',
      ctaText: 'Explore Collection',
      ctaLink: '/',
      bgColor: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100'
    },
    {
      id: '3',
      title: 'Artisan Quality, Every Time',
      subtitle: 'Small-batch pieces with character',
      description: 'Every product is carefully selected to bring beauty and functionality into your home.',
      ctaText: 'View Products',
      ctaLink: '/search',
      bgColor: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Full-Width Carousel Section */}
      <Carousel slides={carouselSlides} autoSlideInterval={5000} transitionDuration={500} />

      {/* Top Offers Section */}
      {(() => {
        const topOffers: Offer[] = [
          {
            id: '1',
            title: 'Up to 50% Off',
            subtitle: 'Handcrafted Pottery Collection',
            discount: '50%',
            discountText: 'Limited Time Offer',
            link: '/categories/pottery',
            bgGradient: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100'
          },
          {
            id: '2',
            title: 'New Arrivals',
            subtitle: 'Fresh Artisan Designs',
            discount: '30%',
            discountText: 'Special Launch Price',
            link: '/search?new=true',
            bgGradient: 'bg-gradient-to-br from-amber-200 via-yellow-50 to-orange-50'
          },
          {
            id: '3',
            title: 'Bestsellers',
            subtitle: 'Customer Favorites',
            discount: '25%',
            discountText: 'Top Rated Products',
            link: '/search?bestseller=true',
            bgGradient: 'bg-gradient-to-br from-orange-100 via-rose-50 to-amber-50'
          },
          {
            id: '4',
            title: 'Premium Collection',
            subtitle: 'Luxury Handcrafted Items',
            discount: '40%',
            discountText: 'Exclusive Discount',
            link: '/categories/premium',
            bgGradient: 'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50'
          },
          {
            id: '5',
            title: 'Clearance Sale',
            subtitle: 'Last Chance to Buy',
            discount: '60%',
            discountText: 'Limited Stock',
            link: '/search?sale=true',
            bgGradient: 'bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-50'
          },
          {
            id: '6',
            title: 'Gift Sets',
            subtitle: 'Perfect for Gifting',
            discount: '35%',
            discountText: 'Bundle Deals',
            link: '/categories/gifts',
            bgGradient: 'bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50'
          }
        ];

        return <TopOffers offers={topOffers} />;
      })()}

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link
              href="/products"
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
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <button
                      onClick={() => handleAddToWishlist(product)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  {/* Ratings removed */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
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

      {/* CTA Section */}
      <section className="bg-[var(--brand-600)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {user ? (
            <>
              <h2 className="text-3xl font-bold mb-4">
                Welcome back, {user.name}!
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Continue exploring our handcrafted collection
              </p>
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
              <h2 className="text-3xl font-bold mb-4">
                Ready to start shopping?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Join thousands of satisfied customers
              </p>
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

export default HomePage;