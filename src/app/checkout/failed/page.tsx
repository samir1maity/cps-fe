'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, ShoppingCart } from 'lucide-react';

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const reason = searchParams.get('reason') || 'Your payment could not be processed.';
  const shortId = orderId.slice(-8).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-red-50/40 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-8 py-10 text-center">

          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Payment Failed</h1>
          <p className="text-sm text-stone-500 leading-relaxed">{reason}</p>

          {/* Order ref */}
          {shortId && (
            <div className="mt-6 inline-block bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">Order Reference</p>
              <p className="font-mono text-sm font-semibold text-stone-700">#{shortId}</p>
              <p className="text-xs text-stone-400 mt-1">No payment was charged</p>
            </div>
          )}

          {/* Reasons */}
          <div className="mt-8 space-y-3 text-left">
            {[
              { icon: '💳', text: 'Insufficient balance or card declined by bank' },
              { icon: '⏱️', text: 'Session expired — please try again' },
              { icon: '🌐', text: 'Network issue during payment processing' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <p className="text-sm text-stone-500">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] px-5 py-3 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Back to Cart
            </Link>
          </div>

        </div>

        {/* Sub note */}
        <p className="mt-4 text-center text-xs text-stone-400">
          If money was deducted from your account, it will be refunded automatically within 5–7 business days.
        </p>

      </div>
    </div>
  );
}
