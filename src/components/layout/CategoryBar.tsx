// src/components/layout/CategoryBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';

const CategoryBar: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    loadCategories();
  }, []);

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
    { id: 'home', name: 'Home', slug: '', href: '/' },
    ...categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      href: `/categories/${cat.slug}`
    }))
  ];

  if (loading) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="overflow-x-auto scrollbar-hide" aria-label="Category navigation">
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 min-w-max py-2">
            {displayCategories.map((category) => {
              const isActive = category.slug 
                ? pathname?.startsWith(`/categories/${category.slug}`)
                : pathname === '/';
              
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
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
    </div>
  );
};

export default CategoryBar;

