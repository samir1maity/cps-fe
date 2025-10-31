// src/components/layout/Layout.tsx
'use client';

import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20 overflow-x-hidden">
        {children}
      </main>
      <BottomNavigation />
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
