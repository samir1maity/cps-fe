'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, Heart, Quote, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Carousel, { CarouselSlide } from '@/components/ui/Carousel';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import ProductThumb from '@/components/ui/ProductThumb';
import { getDefaultColorId } from '@/lib/utils/product';

const FALLBACK_SLIDES: CarouselSlide[] = [
  {
    id: 'fallback-1',
    bgColor: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100',
  },
  {
    id: 'fallback-2',
    bgColor: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100',
  },
  {
    id: 'fallback-3',
    bgColor: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50',
  },
];

interface PublicReview {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
}

// Initials avatar from name
function getInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// Deterministic pastel bg from name
const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function ReviewCard({ review }: { review: PublicReview }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const isOverflow = el.scrollHeight > el.clientHeight + 2;
      setOverflows(isOverflow);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
    };
    check();
    el.addEventListener('scroll', check);
    return () => el.removeEventListener('scroll', check);
  }, [review.message]);

  const showFade = overflows && !atBottom;

  return (
    <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <Quote className="absolute top-4 right-4 h-7 w-7 text-[var(--brand-600)] fill-[var(--brand-600)] opacity-20 pointer-events-none" />

      <div className="relative pr-1">
        <div
          ref={scrollRef}
          className="overflow-y-auto pr-5"
          style={{
            maxHeight: '7.5rem',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <p className="text-sm text-gray-700 leading-6">
            "{review.message}"
          </p>
        </div>
        {showFade && (
          <div
            className="absolute bottom-0 left-0 right-0 h-7 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.6))' }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(review.name)}`}>
          {getInitials(review.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-[11px] text-gray-400">
            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="ml-auto text-[10px] font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">
          Verified
        </span>
      </div>
    </div>
  );
}

const HomePageClient: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(FALLBACK_SLIDES);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, slidesResponse, reviewsResponse] = await Promise.all([
        api.getProducts({ limit: 16, featured: 'true' }),
        api.getCarouselSlides(),
        api.getPublicReviews(),
      ]);

      if (productsResponse.data) setFeaturedProducts(productsResponse.data);

      // Only replace fallback slides if the API returned at least one slide.
      if (slidesResponse.success && slidesResponse.data && slidesResponse.data.length > 0) {
        setCarouselSlides(
          slidesResponse.data.map((s: any) => ({
            id: s._id ?? s.id,
            ctaLink: s.ctaLink || undefined,
            bgColor: s.bgColor || undefined,
            imageUrl: s.imageUrl ?? null,
          })),
        );
      }

      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data);
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

    await addToCart(product, 1, getDefaultColorId(product));
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!requireAuthForWishlist(product.id)) return;
    const added = await toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link
              href="/search?featured=true"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center text-sm sm:text-base"
            >
              View All
              <ChevronRight className="ml-0.5 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm sm:shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative">
                    <ProductThumb
                      product={product}
                      alt={product.name}
                      className="w-full group-hover:[&_img]:scale-105 [&_img]:transition-transform [&_img]:duration-300"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                    {!product.inStock && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-2.5 sm:p-4">
                  <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                    {!isAdmin && (
                      <button
                        onClick={() => handleToggleWishlist(product)}
                        className={`ml-1 shrink-0 transition-colors ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:block mb-2">
                    <p
                      className="text-xs text-gray-500 leading-relaxed overflow-hidden"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <span className="text-sm sm:text-lg font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] sm:text-sm text-gray-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {!isAdmin && (
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className="bg-[var(--brand-600)] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-[10px] sm:text-sm shrink-0"
                      >
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">{product.inStock ? 'Add' : 'Out of Stock'}</span>
                        <span className="sm:hidden">{product.inStock ? 'Add' : '—'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <section className="py-10 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <MessageSquare className="h-3.5 w-3.5" />
                Customer Reviews
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What our customers say</h2>
              <p className="mt-2 text-sm text-gray-500">Real words from people who love our pottery</p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>

            {/* See all link */}
            <div className="text-center mt-8">
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 border border-stone-300 text-stone-600 hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                See all reviews
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default HomePageClient;
