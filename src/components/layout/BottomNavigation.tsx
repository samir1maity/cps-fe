// src/components/layout/BottomNavigation.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const { getCount } = useWishlist();

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/search',
      icon: Grid3X3,
      label: 'Search',
      active: pathname.startsWith('/search'),
    },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: 'Cart',
      active: pathname.startsWith('/cart'),
      badge: getTotalItems(),
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      active: pathname.startsWith('/wishlist'),
      badge: getCount(),
      badgeColor: 'bg-red-500',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      active: pathname.startsWith('/profile') || pathname.startsWith('/orders'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? 'text-[var(--brand-600)]'
                  : 'text-gray-500 hover:text-[var(--brand-600)]'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge && item.badge > 0 && (
                  <span className={`absolute -top-2 -right-2 ${(item as any).badgeColor ?? 'bg-[var(--brand-600)]'} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;




