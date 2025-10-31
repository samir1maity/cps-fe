// src/components/layout/AuthHeader.tsx
'use client';

import React from 'react';
import Link from 'next/link';

const AuthHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-blue-600">
              creativepotterystudio
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;

