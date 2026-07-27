// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useScrollLock } from '@/lib/hooks/useScrollLock';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useScrollLock(isMenuOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { getCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const isMorePage = pathname?.startsWith('/more');
  const isAdminPage = pathname?.startsWith('/admin');
  const shouldShowSearch = !isMorePage && !isAdminPage;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 max-w-[60vw]">
            <Image
              src="/favcon.png"
              alt="Creative Pottery Studio"
              width={30}
              height={30}
              className="h-8 w-8 rounded-sm shrink-0"
            />
            <span className="text-xl sm:text-2xl font-bold text-[var(--brand-600)] truncate">creativepotterystudio</span>
          </Link>

          {/* Search Bar - Hidden on mobile and on More page */}
          {shouldShowSearch && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative flex w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-l-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus:bg-white focus:shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)]/30 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium rounded-r-full transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <AdminNotificationBell />
            ) : (
              <>
                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="relative p-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {getCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {getCount()}
                    </span>
                  )}
                </Link>
                {/* Cart */}
                <Link
                  href="/cart"
                  className="relative p-2.5 rounded-xl text-gray-500 hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] transition-colors"
                  title="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--brand-600)] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <>
                <Link
                  href={user.role === 'ADMIN' ? '/admin' : '/profile'}
                  className="p-2.5 rounded-xl text-gray-500 hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] transition-colors"
                  title={user.name}
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - hidden on More page */}
        {shouldShowSearch && (
          <div className="md:hidden pb-4 pt-2">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-l-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus:bg-white focus:shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)]/30 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium rounded-r-full transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

      </div>
    </header>

    {/* Mobile Menu — rendered in a portal so it's never clipped by sticky header */}
    {isMenuOpen && typeof document !== 'undefined' && createPortal(
      <div className="md:hidden">
        {/* Full-screen backdrop */}
        <div
          className="fixed inset-x-0 bottom-0 top-16 bg-black/40 z-[999]"
          onClick={() => setIsMenuOpen(false)}
        />
        {/* Menu panel */}
        <div className="fixed left-0 right-0 top-16 z-[1000] bg-white shadow-2xl rounded-b-2xl overflow-hidden">
          {user ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="h-10 w-10 rounded-full bg-[var(--brand-100)] flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-[var(--brand-600)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Nav links */}
              <nav className="px-3 py-2">
                {(user.role === 'ADMIN'
                  ? [{ href: '/admin', label: 'Admin Dashboard' }]
                  : [
                      { href: '/profile', label: 'Profile' },
                      { href: '/orders', label: 'My Orders' },
                      { href: '/wishlist', label: 'Wishlist' },
                    ]
                ).map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-3.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-600)] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Logout */}
              <div className="px-3 pb-5 pt-1 border-t border-gray-100 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 py-3 space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-[var(--brand-600)] border border-[var(--brand-200)] hover:bg-[var(--brand-50)] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default Header;
