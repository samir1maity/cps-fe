// src/components/layout/BottomNavigation.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, User, MoreHorizontal } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { getTotalItems } = useCart();

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/categories',
      icon: Grid3X3,
      label: 'Categories',
      active: pathname.startsWith('/categories'),
    },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: 'Cart',
      active: pathname.startsWith('/cart'),
      badge: getTotalItems(),
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      active: pathname.startsWith('/profile') || pathname.startsWith('/orders'),
    },
    {
      href: '/more',
      icon: MoreHorizontal,
      label: 'More',
      active: pathname.startsWith('/more'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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




