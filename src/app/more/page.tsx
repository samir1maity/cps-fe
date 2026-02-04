// src/app/more/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  MessageCircle, 
  Shield, 
  Truck,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const MorePage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: '/profile' },
      ],
    },
    {
      title: 'Shopping',
      items: [
        { icon: Truck, label: 'Track Order', href: '/track-order' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/help' },
        { icon: MessageCircle, label: 'Contact Us', href: '/contact' },
        { icon: Shield, label: 'Privacy Policy', href: '/privacy' },
      ],
    },
  ];

  if (isAdmin) {
    menuItems.unshift({
      title: 'Admin',
      items: [
        { icon: Shield, label: 'Admin Dashboard', href: '/admin' },
      ],
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {user ? `Hello, ${user.name}` : 'Welcome'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {user ? user.email : 'Sign in to access your account'}
              </p>
            </div>
            {!user && (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuItems.map((section) => (
            <div key={section.title} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          {user && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 transition-colors text-red-600"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
                <span className="text-red-400">→</span>
              </button>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>creativepotterystudio v1.0.0</p>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default MorePage;
