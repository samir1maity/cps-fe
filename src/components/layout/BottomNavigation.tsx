'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, Heart, User, Bell } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { getCount } = useWishlist();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [adminUnread, setAdminUnread] = React.useState(0);

  React.useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => {
      const res = await api.getAdminNotificationUnreadCount();
      if (res.success && res.data) setAdminUnread(res.data.count);
    };
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
  }, [isAdmin]);

  const navItems = isAdmin
    ? [
        { href: '/', icon: Home, label: 'Home', active: pathname === '/' },
        { href: '/admin', icon: Grid3X3, label: 'Dashboard', active: pathname === '/admin' },
        {
          href: '/admin/notifications',
          icon: Bell,
          label: 'Alerts',
          active: pathname.startsWith('/admin/notifications'),
          badge: adminUnread,
          badgeColor: 'bg-red-500',
        },
        { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', active: pathname.startsWith('/admin/orders') },
        { href: '/profile', icon: User, label: 'Profile', active: pathname.startsWith('/profile') },
      ]
    : [
        { href: '/', icon: Home, label: 'Home', active: pathname === '/' },
        { href: '/search', icon: Grid3X3, label: 'Search', active: pathname.startsWith('/search') },
        {
          href: '/cart',
          icon: ShoppingCart,
          label: 'Cart',
          active: pathname.startsWith('/cart'),
          badge: getTotalItems(),
          badgeColor: 'bg-[var(--brand-600)]',
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* frosted glass bar */}
      <div className="mx-3 mb-3 rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_-2px_24px_rgba(0,0,0,0.10)] border border-gray-100">
        <div className="grid grid-cols-5 h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 transition-all"
              >
                <div className="relative">
                  {/* active pill behind icon */}
                  <div className={`absolute inset-0 -m-2 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-[var(--brand-600)]/10 scale-100' : 'scale-75 opacity-0'
                  }`} />
                  <Icon
                    className={`relative h-[22px] w-[22px] transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--brand-600)] scale-110'
                        : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {/* notification badge */}
                  {!!item.badge && item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 ${item.badgeColor} text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center leading-none`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-[var(--brand-600)]' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
