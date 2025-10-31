// src/components/layout/Layout.tsx
'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import AuthHeader from './AuthHeader';
import CategoryBar from './CategoryBar';
import { PendingActionsHandler } from '@/components/auth/PendingActionsHandler';

interface LayoutProps {
  children: ReactNode;
}

// Pages that should use the minimal auth header
const AUTH_PAGES = ['/login', '/register'];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = pathname && AUTH_PAGES.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <PendingActionsHandler />
      {isAuthPage ? <AuthHeader /> : <Header />}
      {!isAuthPage && <CategoryBar />}
      <main className="overflow-x-hidden">
        {children}
      </main>
      {!isAuthPage && <BottomNavigation />}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default Layout;
