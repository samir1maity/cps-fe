// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const isMorePage = pathname?.startsWith('/more');
  const shouldShowSearch = !isMorePage;

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

  return (
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
          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-[var(--brand-600)] transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--brand-600)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href={user.role === 'ADMIN' ? '/admin' : '/profile'}
                      className="block py-2 text-gray-600 hover:text-[var(--brand-600)] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block py-2 text-gray-600 hover:text-[var(--brand-600)] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block py-2 text-gray-600 hover:text-[var(--brand-600)] transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block py-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
