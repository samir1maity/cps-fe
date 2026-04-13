// src/components/layout/CategoryBar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';

const CategoryBar: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const nav = scrollRef.current;
    if (!nav) return;

    const updateScrollState = () => {
      const { scrollLeft, clientWidth, scrollWidth } = nav;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    };

    updateScrollState();
    nav.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      nav.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add "Home" as first category
  const displayCategories = [
    { id: 'home', name: 'Home', slug: '', href: '/', children: [] as Category[] },
    ...categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      href: `/categories/${cat.slug}`,
      children: cat.children || [],
    }))
  ];

  const scrollCategories = (direction: 'left' | 'right') => {
    const nav = scrollRef.current;
    if (!nav) return;

    nav.scrollBy({
      left: direction === 'right' ? 240 : -240,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="relative flex items-center gap-1 sm:gap-2 py-2">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-colors sm:h-9 sm:w-9 ${
              canScrollLeft ? 'hover:bg-stone-50' : 'cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="relative min-w-0 flex-1">
            {canScrollLeft && (
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
            )}

            <nav
              ref={scrollRef}
              className="overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth snap-x snap-mandatory"
              aria-label="Category navigation"
            >
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 min-w-max py-1">
                {displayCategories.map((category) => {
                  const isActive = category.slug
                    ? pathname?.startsWith(`/categories/${category.slug}`)
                    : pathname === '/';

                  return (
                    <Link
                      key={category.id}
                      href={category.href}
                      className={`snap-start flex-shrink-0 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-base font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-[var(--brand-100)] text-[var(--brand-700)]'
                          : 'text-gray-700 hover:bg-[var(--brand-100)] hover:text-[var(--brand-600)]'
                      }`}
                    >
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          <button
            type="button"
            onClick={() => scrollCategories('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-colors sm:h-9 sm:w-9 ${
              canScrollRight ? 'hover:bg-stone-50' : 'cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
