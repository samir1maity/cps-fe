// src/components/ui/TopOffers.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  discount?: string;
  discountText?: string;
  image?: string;
  link: string;
  bgGradient?: string;
}

interface TopOffersProps {
  offers: Offer[];
}

const TopOffers: React.FC<TopOffersProps> = ({ offers }) => {
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-[#F7F2EA]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Top Offers
            </h2>
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
              </svg>
              <span>Scroll</span>
            </span>
          </div>
          <Link
            href="/search"
            className="text-sm sm:text-base text-[var(--brand-600)] hover:text-[var(--brand-700)] font-medium hidden sm:block"
          >
            View All
          </Link>
        </div>
        
        <div className="relative">
          {/* Left fade indicator */}
          <div className="absolute left-0 top-0 bottom-2 w-8 sm:w-12 bg-gradient-to-r from-[#F7F2EA] to-transparent pointer-events-none z-10" />
          
          {/* Scrollable container */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-3 sm:space-x-4 min-w-max pb-2 px-4 sm:px-6 lg:px-8">
            {offers.map((offer) => {
              const bgClass = offer.bgGradient || 'bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50';
              
              return (
                <Link
                  key={offer.id}
                  href={offer.link}
                  className="group flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className={`relative h-48 ${bgClass} flex items-center justify-center overflow-hidden`}>
                    {offer.image ? (
                      <Image
                        src={offer.image}
                        alt={offer.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 320px"
                      />
                    ) : (
                      <div className="text-center px-4">
                        {offer.discount && (
                          <div className="mb-2">
                            <span className="inline-block bg-[var(--brand-600)] text-white text-2xl sm:text-3xl font-bold px-4 py-2 rounded-lg shadow-lg">
                              {offer.discount}
                            </span>
                          </div>
                        )}
                        {offer.discountText && (
                          <p className="text-sm text-gray-700 font-medium">{offer.discountText}</p>
                        )}
                      </div>
                    )}
                    
                    {offer.discount && offer.image && (
                      <div className="absolute top-2 right-2 bg-[var(--brand-600)] text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                        {offer.discount}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[var(--brand-600)] transition-colors">
                      {offer.title}
                    </h3>
                    {offer.subtitle && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {offer.subtitle}
                      </p>
                    )}
                    {offer.discountText && (
                      <p className="text-sm text-[var(--brand-600)] font-medium mt-2">
                        {offer.discountText}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
            </div>
          </div>
          
          {/* Right fade indicator */}
          <div className="absolute right-0 top-0 bottom-2 w-8 sm:w-12 bg-gradient-to-l from-[#F7F2EA] to-transparent pointer-events-none z-10" />
        </div>
        
        {/* Mobile View All Link with scroll hint */}
        <div className="sm:hidden text-center mt-4 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
              </svg>
              Swipe to see more
            </span>
          </div>
          <Link
            href="/search"
            className="text-sm text-[var(--brand-600)] hover:text-[var(--brand-700)] font-medium"
          >
            View All Offers →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopOffers;

